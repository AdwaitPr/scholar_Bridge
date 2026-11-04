# ScholarBridge — Master Build Plan (for Antigravity)

> Reference date for seed data: **2026-11-04**. Time zone for all deadlines: **Asia/Kolkata (IST, UTC+05:30)**.
> Source of truth for product scope: the ScholarBridge Technical Architecture & Product Specification document. This plan turns it into an ordered, verifiable build.

---

## 0. How the agent should use this plan

1. Work **phase by phase**, in order. Do not start a phase until the previous phase's **Exit Criteria** pass.
2. Each task has an ID (e.g. `P2-T3`). Commit after every task: `feat(P2-T3): ...`.
3. After each phase run: `pnpm tsc --noEmit && pnpm lint && pnpm test:unit`. Fix before moving on.
4. **Never fabricate** scholarship amounts, deadlines or eligibility. If a value is not in the Source Verification Register (Appendix A), store `is_deadline_verified = false` and display "Deadline not verified".
5. **Never store** Aadhaar, PAN, bank account/IFSC, addresses, parent names, or uploaded document files.
6. Where this plan contradicts the original spec, **this plan wins** (see Section 2: Spec Defects).

---

## 1. Product summary

**Problem:** Students miss scholarships because they don't know about them, misread eligibility, or forget deadlines.
**Solution:** A scholarship discovery + application-management platform for Indian students (school → PG), focused only on education funding.

**Core capabilities (MVP):**
Discovery · education-level filtering · deterministic eligibility with explanations · deadline tracking (student vs institute vs nodal) · document checklist · application progress tracking · saved scholarships · official application links.

**Non-goals (MVP):** No LLM/AI recommendations, no document uploads, no application submission on behalf of students, no SMS/email notifications (in-app only), no payments.

**Guiding principles:** deterministic and explainable · source-verified · privacy by minimization · mobile-first (360px) · anti-fraud messaging everywhere ("Government applications on NSP are free").

---

## 2. Spec defects to fix before/while building

These were found while reviewing the spec's code and SQL. Fix them as part of the phases noted.

| #   | Defect                                                                                                                                                                                                                                                         | Fix                                                                                                                                                                                                                                                 | Phase |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| D1  | Spec says "11 tables" but the migration creates **12** (incl. `verification_logs`).                                                                                                                                                                            | Update all docs/comments to 12.                                                                                                                                                                                                                     | P1    |
| D2  | Column `application_Open_date` has a capital letter (Postgres lowercases unquoted names; breaks TS types).                                                                                                                                                     | Rename to `application_open_date`.                                                                                                                                                                                                                  | P1    |
| D3  | `z.keyof(StudentProfileSchema.shape)` is invalid (`z.keyof` takes an object schema, not its shape; also yields a Zod enum of keys of a _shape_).                                                                                                               | Use `z.enum(Object.keys(StudentProfileSchema.shape) as [keyof StudentProfileInput, ...(keyof StudentProfileInput)[]])` or define an explicit `ProfileFieldKey` enum.                                                                                | P2    |
| D4  | Evaluator: a **missing** field on a condition with `requiresOfficialVerification: true` returns `VERIFY`, not `UNKNOWN`. This makes the spec's own test ("income omitted → Additional information required") **fail**, and wrongly tells students they "pass". | Missing field ⇒ always `UNKNOWN`. `VERIFY` only when the self-reported value passes. Reserve a separate `externalGateOnly: true` flag for conditions with no profile field (e.g., Reliance aptitude test), which always return `VERIFY`.            | P3    |
| D5  | `evaluateScholarshipEligibility` applies `freshApplicationsOpen === false` as a `VERIFY` override even when the result is `FALSE`/`UNKNOWN`? (it doesn't—but it also overrides `TRUE`). Intent is unclear for **renewal-only** schemes (PM-USP CSSS).          | Introduce explicit window logic: `fresh_applications_open=false` ⇒ outcome message "Fresh applications not open yet – check portal", never "Potential match". Keep `FALSE`/`UNKNOWN` precedence.                                                    | P3    |
| D6  | OR-node returns `missing` only from UNKNOWN children and drops satisfied/verify context when mixed; "all failed" message is generic.                                                                                                                           | When all OR branches fail, include each branch's failure labels in the explanation. When some UNKNOWN and none TRUE, list all missing.                                                                                                              | P3    |
| D7  | `verification_logs` has `FOR SELECT USING (TRUE)` which publicly exposes `admin_user_id`.                                                                                                                                                                      | Create a public view `verification_logs_public` omitting `admin_user_id`; restrict base table SELECT to admins.                                                                                                                                     | P1    |
| D8  | Profiles UPDATE policy `WITH CHECK (... role = 'student')` blocks admins from editing their own profile and doesn't prevent role self-escalation at column level reliably.                                                                                     | Add a trigger `prevent_role_change()` that rejects `role` changes unless `service_role`; loosen the check to `auth.uid() = id`.                                                                                                                     | P1    |
| D9  | Docs say `/api/scholarships/discover` filters `course` & `education_level` post-query in JS and `textSearch('name', …)` against a non-tsvector column.                                                                                                         | Add a generated `search_vector tsvector` column on `scholarships`; query with `.textSearch('search_vector', q, {type:'websearch'})`. Move education-level/state filters into SQL via an RPC or joined filter. Add pagination (`page`, `page_size`). | P4    |
| D10 | Spec's domain whitelist (`.gov.in`, `.nic.in`, `.ac.in`) is claimed as DB-enforced but only `^https://` is checked.                                                                                                                                            | Add DB CHECK + admin API Zod refine for host allowlist (+ explicit foundation allowlist table).                                                                                                                                                     | P1/P7 |
| D11 | Unit test expects `daysRemaining` 27 and `urgency UPCOMING_30D` — correct, but `CRITICAL_72H` etc. boundaries untested.                                                                                                                                        | Add boundary tests (72h, 7d, 30d).                                                                                                                                                                                                                  | P3    |
| D12 | `pg_trgm` extension is created but unused.                                                                                                                                                                                                                     | Either add trigram index on `name` for typo-tolerant search, or remove. Plan: add it (P4).                                                                                                                                                          | P1/P4 |
| D13 | Income cap is stored in both `max_income_inr` column and the AST. Risk of divergence.                                                                                                                                                                          | Treat AST as source of truth; add a seed-time consistency check script that fails if column ≠ AST value.                                                                                                                                            | P3    |
| D14 | `scholarships.is_deadline_verified` may be TRUE while `student_deadline_at` is in the past with `verification_status = 'verified'`.                                                                                                                            | Nightly job / on-read computation: show "Expired" and offer admin "flagged_for_review".                                                                                                                                                             | P6    |
| D15 | Reliance (SCH-15) bundles UG and PG into one record, but rules differ (income cap vs none, GATE/CGPA).                                                                                                                                                         | Split into **SCH-15A (UG)** and **SCH-15B (PG)** or give two rule versions keyed by education level. Plan chooses split.                                                                                                                            | P5    |

---

## 3. Tech stack & repo layout

- **Framework:** Next.js (App Router) + TypeScript (strict)
- **UI:** Tailwind CSS + shadcn/ui; fonts Plus Jakarta Sans + Inter (`tabular-nums`)
- **Backend:** Supabase (Postgres 15+, Auth, RLS). No separate server.
- **Validation:** Zod everywhere (API, forms, rule ASTs)
- **Forms:** react-hook-form + zod resolver
- **Data fetching:** TanStack Query on client; server components for catalog pages
- **Tests:** Vitest (unit), Playwright (E2E + RLS isolation)
- **Tooling:** pnpm, ESLint, Prettier, Husky + lint-staged, GitHub Actions CI

```
scholarbridge/
├─ supabase/
│  ├─ migrations/            # 0001_init.sql, 0002_views_triggers.sql ...
│  └─ seed/                  # catalog JSON (source of truth for seed)
├─ scripts/
│  ├─ seed-scholarships.ts   # service-role, server-only
│  ├─ check-rule-consistency.ts
│  └─ audit-no-secrets.ts    # fails if SERVICE_ROLE in client bundle
├─ src/
│  ├─ app/                   # routes (12 screens + api/)
│  ├─ components/ui/         # shadcn primitives
│  ├─ lib/
│  │  ├─ supabase/{client,server,admin}.ts
│  │  ├─ schemas/            # shared zod schemas
│  │  └─ utils/
│  └─ modules/
│     ├─ student-profile/
│     ├─ scholarship-catalog/
│     ├─ scholarship-discovery/
│     ├─ eligibility-engine/
│     ├─ application-tracker/
│     ├─ checklist-manager/
│     ├─ deadline-management/
│     └─ scholarship-administration/
├─ tests/{unit,e2e,fixtures}/
└─ .github/workflows/ci.yml
```

Each module contains: `schema.ts`, `repository.ts`, `service.ts`, `components/`, `index.ts` (public API only; no deep imports across modules).

---

## 4. Phased roadmap

### Phase 0 — Project bootstrap (0.5 day)

- **P0-T1** `create-next-app` (TS, App Router, Tailwind, ESLint, src dir); enable `strict`, `noUncheckedIndexedAccess`.
- **P0-T2** Install shadcn/ui; add: button, card, input, select, checkbox, switch, tabs, accordion, dialog, sheet, badge, progress, table, toast, skeleton, form, calendar, dropdown-menu.
- **P0-T3** Tailwind theme tokens (see Section 8). Fonts via `next/font`.
- **P0-T4** Env handling: `.env.example`, a typed `env.ts` (zod) that fails build if `NEXT_PUBLIC_*` leaks service key.
- **P0-T5** Vitest + Playwright config; CI workflow running tsc, lint, unit tests, build.
- **P0-T6** Husky + lint-staged.
  **Exit:** `pnpm build` and `pnpm test:unit` green on empty app; CI passes.

### Phase 1 — Database, RLS, seed (1.5 days)

- **P1-T1** Migration `0001_init.sql` from spec with fixes D1, D2, D10, D12 (12 tables, enums, indexes).
- **P1-T2** Migration `0002_security.sql`: RLS policies, `is_admin()`, D7 public log view, D8 role-protection trigger, `updated_at` triggers.
- **P1-T3** Add `search_vector` generated column + GIN index + trigram index (D9/D12).
- **P1-T4** Generate DB types: `supabase gen types typescript` → `src/lib/supabase/database.types.ts`.
- **P1-T5** Seed data files in `supabase/seed/` (15 → 16 records after SCH-15 split, see D15), each with rule AST, documents, sources.
- **P1-T6** `scripts/seed-scholarships.ts` (idempotent upsert by `code`; writes initial `verification_logs` via a seed admin).
- **P1-T7** Synthetic test users (student A, student B, admin) for tests only.
  **Exit:** `supabase db reset` runs clean; `select count(*) from scholarships` = 16; RLS enabled on all 12 tables (`pg_tables.rowsecurity`).

### Phase 2 — Shared schemas & auth (1 day)

- **P2-T1** `src/lib/schemas/*`: profile, rule AST (fix D3), discovery query, application, admin upsert.
- **P2-T2** Supabase clients: browser, server (cookies), admin (server-only, `import 'server-only'`).
- **P2-T3** Auth pages: `/login`, `/signup` (email + password and magic link; Google optional), `/auth/callback`, sign-out.
- **P2-T4** Middleware: protect `/dashboard`, `/saved`, `/applications`, `/deadlines`, `/settings`, `/onboarding`; protect `/admin` with role check.
- **P2-T5** On signup trigger/route: create `profiles` row (role=student).
  **Exit:** can sign up, log in, get redirected to `/onboarding`; unauthenticated users are redirected from protected routes.

### Phase 3 — Eligibility engine & deadline service (2 days) ⭐ core

- **P3-T1** Implement evaluator per spec **with fixes D4, D5, D6**. Result states: `Potential match`, `Additional information required`, `Likely ineligible`, `Eligibility requires official verification`.
- **P3-T2** Add `externalGateOnly` condition flag and `ruleSchemaVersion`.
- **P3-T3** Precedence (document in code comment): `FALSE > UNKNOWN > VERIFY > TRUE`; window-closed overlay applied last.
- **P3-T4** Deadline service per spec; add `renewalOnly` handling and 3-date model (student / institute / nodal).
- **P3-T5** Rule consistency script (D13).
- **P3-T6** Unit tests (Vitest), at minimum:
  - Spec's 5 eligibility tests (note: test 4 now passes thanks to D4)
  - OR-branch tests (lateral entry; GATE vs CGPA)
  - Missing field + `requiresOfficialVerification` ⇒ UNKNOWN
  - Renewal-only scheme (PM-USP CSSS) never yields "Potential match" for fresh applicants
  - Boundary tests: income exactly at cap (pass), cap+1 (fail); age 29 vs 30
  - Deadline boundaries at 72h / 7d / 30d, expiry exactly at deadline instant, IST formatting independent of `TZ` env (run suite with `TZ=UTC` and `TZ=America/Los_Angeles`)
  - Property test (fast-check): evaluator is deterministic and never throws on arbitrary partial profiles
    **Exit:** ≥95% line coverage on `eligibility-engine` and `deadline-management`; all tests pass in 3 TZ settings.

### Phase 4 — Catalog & discovery API + pages (2 days)

- **P4-T1** `scholarship-catalog` repository: list, getBySlug (with rules, documents, sources, public log view).
- **P4-T2** `GET /api/scholarships/discover` with D9 fixes: `q`, `education_level`, `state`, `course`, `funding_type`, `provider_type`, `hide_expired`, `deadline_within_days`, `sort`, `page`, `page_size` (default 12, max 50). Response includes `deadlineEvaluation` and (if authed) `eligibilityEvaluation`.
- **P4-T3** `GET /api/scholarships/[slug]`.
- **P4-T4** `POST /api/eligibility/evaluate` (public, rate-limited; validates profile with Zod; **does not persist** profile).
- **P4-T5** Page `/scholarships` (server component shell + client filter sidebar, URL-synced filters, skeletons, empty state, mobile filter sheet).
- **P4-T6** Page `/scholarships/[slug]` (benefit table, eligibility summary, documents, instructions, Source Provenance box, both deadlines, anti-fraud notice, "Apply on official site" button with `rel="noopener noreferrer"` and external-link icon, Save button).
- **P4-T7** Landing page `/` (value prop, live counts from DB, 6-step journey, quick education-level search, anti-fraud banner).
  **Exit:** anonymous user can browse, filter, and open details; Lighthouse mobile perf ≥85 on `/scholarships`.

### Phase 5 — Onboarding, profile & eligibility UI (2 days)

- **P5-T1** `/onboarding` 4-step wizard (progress, per-step validation, draft persisted server-side on each step; privacy notice on every step: never enter Aadhaar/bank details).
- **P5-T2** `PUT /api/profile`, `DELETE /api/profile` (requires `X-Confirm-Account-Deletion: true`; also deletes the `auth.users` row via admin client server-side).
- **P5-T3** Reject unknown keys with Zod `.strict()` — extra fields like `aadhaar` return 400 (test it).
- **P5-T4** `/scholarships/[slug]/eligibility`: four accordions (Satisfied / Failed / Missing with inline quick-fill / Requires official verification), disclaimer banner, re-evaluate instantly on quick-fill save.
- **P5-T5** Match badges component (emerald / amber / crimson / teal-outline for verification) — **never color-only**: icon + text label (accessibility).
- **P5-T6** Split SCH-15 into 15A/15B (D15) in seed.
  **Exit:** new user completes onboarding in <90s on mobile, sees match badges on discovery.

### Phase 6 — Saved, tracker, checklist, deadlines (3 days)

- **P6-T1** `POST/DELETE /api/saved` + `/saved` page with comparison table (side-by-side: benefit, income cap, deadlines, match). Include NSP rule note: one merit + one or more welfare applications may be allowed for AY 2026–27, but concurrent receipt of multiple central/state scholarships is restricted — link to official guideline, avoid asserting beyond the source.
- **P6-T2** `POST /api/applications`, `PATCH /api/applications/[id]`; state machine with allowed transitions (Saved→Researching→Preparing→Ready to apply→Submitted→Awaiting result→Awarded|Not selected→Closed; Closed reachable from any). Reject invalid transitions with 422.
- **P6-T3** `initializeApplicationWithChecklist` (spec) — wrap in a **Postgres RPC/transaction** so application + checklist + items + reminders are atomic (avoid partial state on failure). Make idempotent (don't duplicate items on re-call).
- **P6-T4** `/applications`: Kanban (dnd-kit, keyboard accessible) + table toggle; reference ID & private notes fields.
- **P6-T5** `/applications/[id]/checklist` + `PATCH /api/checklists/items/[itemId]`; progress %, readiness state; banner "tracks your readiness only; not official validation".
- **P6-T6** Reminders: on application creation generate `reminders` rows from `reminder_days_before` × (student deadline), skipping past dates and unverified deadlines. Recompute when a scholarship's deadline changes (DB function triggered from admin update).
- **P6-T7** `/deadlines`: month + agenda views (IST), color + icon coding (Expired, <72h, <7d, Unverified), distinct markers for student vs INO deadlines; ICS export of saved deadlines (client-generated, no PII).
- **P6-T8** `/dashboard`: top matches, active applications with progress, urgent banner (≤7 days), notification tray (undismissed reminders due now).
- **P6-T9** Deadline expiry check (D14): computed on read; plus a Supabase scheduled function (`pg_cron`) nightly to set `verification_status='flagged_for_review'` where deadline passed and status was `verified`.
  **Exit:** full student journey works end to end on seeded data; Playwright happy-path test passes.

### Phase 7 — Admin console (2 days)

- **P7-T1** `/admin` guarded by server-side role check (never client-only).
- **P7-T2** Scholarship list with status filters (flagged, expired, unverified).
- **P7-T3** Create/edit form: all fields, deadline pickers (stored as IST 23:59:59 by default), source URLs (https + allowlist, D10), required `verification_note`.
- **P7-T4** Visual rule builder: tree editor for AND/OR/CONDITION nodes, live validation with `RuleNodeSchema`, **"Test with synthetic profile"** panel running the evaluator.
- **P7-T5** `POST /api/admin/scholarships` (+ PUT): single DB transaction (scholarship + rules new version + docs + sources + `verification_logs` row). Student session ⇒ 403.
- **P7-T6** Rule versioning: edits create new `version`; evaluator uses highest version.
- **P7-T7** Verification log viewer (public-safe view for students on detail page: "Last verified on X from Y").
  **Exit:** admin can edit a deadline; student sees update immediately and reminders recalc; audit row exists.

### Phase 8 — Settings, privacy, polish (1.5 days)

- **P8-T1** `/settings`: profile edit, reminder thresholds, JSON data export (`GET /api/profile/export`), delete account flow with typed confirmation.
- **P8-T2** Global anti-fraud banner component; footer with "How we verify", privacy policy, terms, disclaimer pages (static).
- **P8-T3** Accessibility pass (WCAG 2.1 AA): focus states, labels, landmarks, contrast ≥4.5:1, reduced motion, screen-reader announcements for dynamic eligibility updates.
- **P8-T4** i18n scaffolding with `next-intl`; ship **English + Hindi** strings for core flows (keys for all UI text; Marathi/Gujarati/Tamil/Bengali later).
- **P8-T5** SEO: metadata, OpenGraph, `sitemap.xml` from catalog, JSON-LD (`FinancialProduct`/`Grant`-like minimal) on detail pages, `robots.txt` (disallow `/api`, `/dashboard`, etc.).
- **P8-T6** Error/not-found/loading boundaries for every route; offline-friendly messaging.
  **Exit:** axe-core reports 0 serious/critical issues on all 12 screens.

### Phase 9 — Security hardening & QA (2 days)

- **P9-T1** Rate limiting (Upstash Redis or Supabase edge function) on `/api/eligibility/evaluate`, auth, and admin routes.
- **P9-T2** Security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy); CSRF protection on mutating routes (same-site cookies + origin check).
- **P9-T3** Playwright RLS isolation suite: Student A cannot read/update/delete B's profile, saved items, applications (incl. `private_notes`), checklists, reminders — even with known UUIDs (expect 404/empty). Student cannot call admin APIs (403). Admin cannot read `private_notes` (RLS).
- **P9-T4** `scripts/audit-no-secrets.ts` runs after build; fails on `SERVICE_ROLE` in `.next/static`.
- **P9-T5** Account deletion integration test: zero orphan rows across all dependent tables.
- **P9-T6** E2E journeys: (a) anon browse → signup → onboarding → match → save → prepare → checklist → mark submitted; (b) admin edit deadline → student sees change; (c) mobile viewport 360px.
- **P9-T7** Dependency audit (`pnpm audit`), license check, secret scan in CI (gitleaks).
  **Exit:** all suites green in CI; no high/critical audit findings.

### Phase 10 — Deployment & launch readiness (1 day)

- **P10-T1** Vercel project + Supabase production project; env vars; migrations via CI (`supabase db push` on main).
- **P10-T2** Preview deployments per PR using a Supabase branch/staging project.
- **P10-T3** Observability: Sentry (scrub PII), Vercel Analytics (cookieless), uptime check, DB backups enabled.
- **P10-T4** **Data verification gate (blocking):** before go-live a human admin must re-verify each seeded scholarship against its official URL on the actual launch date, update `last_verified_at`, and write a `verification_logs` entry. Records not re-verified launch as `deadline_not_verified`.
- **P10-T5** Launch checklist & runbook (how to update a deadline, flag a scheme, roll back a rule version).
  **Exit:** production smoke test passes; all 16 records carry a launch-date verification entry.

**Estimated total:** ~17–19 working days for one agent/dev; phases 4–8 can partially parallelize once Phases 1–3 are done.

---

## 5. Data model summary (12 tables)

`profiles` · `scholarships` · `scholarship_eligibility_rules` · `scholarship_documents` · `scholarship_sources` · `saved_scholarships` · `applications` · `application_checklists` · `checklist_items` · `reminders` · `verification_logs` — plus enum types and one public view (`verification_logs_public`). (Count is 11 base tables + `verification_logs` = 12 with the spec's SQL; recount against migration and keep docs aligned.)

Key rules:

- Catalog tables: public SELECT, admin-only writes.
- Student tables: `auth.uid() = user_id` for ALL; profile `id = auth.uid()`.
- All catalog URLs must be `https://` and on the host allowlist.
- AST in `rule_ast` is the source of truth; columns (`max_income_inr`, `allowed_*`) are denormalized index helpers validated by script.

## 6. API contract (final)

| Endpoint                                          | Auth                        | Notes                                         |
| ------------------------------------------------- | --------------------------- | --------------------------------------------- |
| `GET /api/scholarships/discover`                  | Public (enriched if authed) | Paginated; Zod-validated query                |
| `GET /api/scholarships/[slug]`                    | Public                      | Includes rules, docs, sources, public log     |
| `POST /api/eligibility/evaluate`                  | Public, rate-limited        | Not persisted                                 |
| `GET/PUT/DELETE /api/profile`                     | Student                     | `.strict()` body; delete needs confirm header |
| `GET /api/profile/export`                         | Student                     | JSON export                                   |
| `POST/DELETE /api/saved`                          | Student                     |                                               |
| `POST /api/applications`                          | Student                     | Atomic RPC; returns checklist id              |
| `PATCH /api/applications/[id]`                    | Student                     | Validates state transitions; 404 cross-tenant |
| `PATCH /api/checklists/items/[itemId]`            | Student                     | Returns readiness %                           |
| `GET /api/reminders`, `PATCH /api/reminders/[id]` | Student                     | Dismiss                                       |
| `POST/PUT /api/admin/scholarships`                | Admin                       | Transactional + audit log                     |

Error shape everywhere: `{ error: { code, message, details? } }`; never leak SQL errors.

## 7. Eligibility engine contract

- **Outcomes:** Potential match · Additional information required · Likely ineligible · Eligibility requires official verification.
- **Precedence:** `FALSE > UNKNOWN > VERIFY > TRUE`; window overlay (renewal-only / not yet open) applied last and phrased as a _portal status_, not a student failing.
- **Every result** carries: satisfied / unsatisfied / missing / verification arrays, human-readable summary, and the non-authority disclaimer.
- **Pure functions**, no I/O, no `Date.now()` inside (inject reference time).
- **Adding a scheme = adding data** (AST + docs + sources), never new engine code.

## 8. Design system

- Colors: surface `#FFFFFF`, bg `#F8FAFC`, navy `#0F172A`, primary blue `#1D4ED8`, teal `#0D9488` (verified source/official gate only), emerald `#15803D` (match), amber `#B45309` (info needed / 7-day), crimson `#B91C1C` (ineligible / 72h).
- Typography: Plus Jakarta Sans (headings), Inter (body), `tabular-nums` for money, income, countdowns.
- Money format: `Intl.NumberFormat('en-IN')` with `₹`.
- Layout: mobile-first at 360px; sidebar filters become a bottom sheet on mobile; touch targets ≥44px.
- Never rely on color alone; pair with icon + text.
- Components to build once and reuse: `MatchBadge`, `DeadlineBadge`, `SourceProvenanceBox`, `AntiFraudBanner`, `ScholarshipCard`, `ChecklistItem`, `StatusColumn`, `EmptyState`.

## 9. Screens (12)

1 Landing `/` · 2 Onboarding `/onboarding` · 3 Dashboard `/dashboard` · 4 Discovery `/scholarships` · 5 Details `/scholarships/[slug]` · 6 Eligibility `/scholarships/[slug]/eligibility` · 7 Saved `/saved` · 8 Tracker `/applications` · 9 Checklist `/applications/[id]/checklist` · 10 Deadlines `/deadlines` · 11 Settings `/settings` · 12 Admin `/admin`
(+ auth pages and static policy pages.)

## 10. Definition of Done (whole project)

- [ ] All 12 screens implemented, responsive, accessible (axe clean).
- [ ] Engine + deadline unit tests pass under 3 time zones; ≥95% coverage on those modules.
- [ ] Playwright RLS isolation + account deletion tests pass.
- [ ] No service-role key in client bundle; no PII fields anywhere in schema.
- [ ] Every scholarship shows source URLs, last-verified date, and either a verified deadline or "Deadline not verified".
- [ ] Renewal-only schemes cannot show "Potential match" to fresh applicants.
- [ ] Anti-fraud banner and non-authority disclaimer present where specified.
- [ ] Launch-date data verification completed by a human admin (P10-T4).

## 11. Risks & watch-items

- **Stale data is the #1 product risk.** Deadlines change mid-cycle; rely on the admin verification workflow, nightly flagging, and "last verified" visibility. Do not auto-scrape and publish.
- **Rule drift:** keep `eligibility_source_citation` current; version rules; show citation in the UI.
- **Scope creep:** no email/SMS, uploads, or AI features in MVP.
- **Legal:** disclaimers on every eligibility screen; no claim of official affiliation with NSP/UGC/AICTE.

---

## Appendix A — Seed catalog (from the spec's Source Verification Register)

Seed exactly these as provided (re-verify at launch per P10-T4). IDs, names, benefits, income limits, deadlines and URLs are in the spec. Summary of deadline handling:

| ID             | Scheme                                                  | Seeded deadline handling                                                                                                                       |
| -------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| SCH-01..04     | AICTE Pragati (Degree, Diploma), Saksham, Swanath       | Student 2026-11-30, INO 2026-12-15                                                                                                             |
| SCH-05         | UGC NSPGS                                               | Student 2026-11-30                                                                                                                             |
| SCH-06         | UGC Ishan Uday (NER)                                    | Student 2026-11-30                                                                                                                             |
| SCH-07         | PM-USP CSSS                                             | `fresh_applications_open=false`; renewal 2026-10-31 (expired relative to reference date); fresh = not verified; status `verified_renewal_only` |
| SCH-08         | PM YASASVI                                              | 2026-10-31 (flag: past reference date → show Expired / check portal)                                                                           |
| SCH-09, 10, 11 | SC Top Class, ST National Fellowship, DEPwD Post-Matric | 2026-10-31 (past reference date → Expired / check portal)                                                                                      |
| SCH-12         | PMSS (CAPF/Assam Rifles)                                | Student 2026-11-30, INO 2026-12-15                                                                                                             |
| SCH-13         | NMMSS                                                   | Deadline not verified                                                                                                                          |
| SCH-14         | Delhi Post-Matric SC                                    | Deadline not verified                                                                                                                          |
| SCH-15A/B      | Reliance Foundation UG / PG                             | 2026-10-05 → Expired (EXPIRED status)                                                                                                          |

> Note: the spec lists several schemes with 2026-10-31 deadlines as `VERIFIED`. As of the reference date (2026-11-04) those are in the past unless the portal extended them. Seed them with their listed dates and let the deadline service display **Expired**; the admin must check for extensions at launch.

## Appendix B — Prompts to hand Antigravity per phase

Use this template for each phase:

> "Read `SCHOLARBRIDGE_MASTER_PLAN.md`. Implement **Phase N** only, task by task, committing after each task. Follow Section 0 rules and apply any spec-defect fixes listed for this phase. When done, run the Exit Criteria commands and report results. Do not start Phase N+1."

Suggested agent split once Phase 3 is complete: **Agent A** → Phases 4–5 (public + onboarding), **Agent B** → Phase 6 (tracker/checklists/deadlines), **Agent C** → Phase 7 (admin). Merge before Phase 8.
