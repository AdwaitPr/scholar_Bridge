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

| # | Defect | Fix | Phase |
|---|--------|-----|-------|
| D1 | Spec says "11 tables" but the migration creates **12** (incl. `verification_logs`). | Update all docs/comments to 12. | P1 |
| D2 | Column `application_Open_date` has a capital letter (Postgres lowercases unquoted names; breaks TS types). | Rename to `application_open_date`. | P1 |
| D3 | `z.keyof(StudentProfileSchema.shape)` is invalid (`z.keyof` takes an object schema, not its shape; also yields a Zod enum of keys of a *shape*). | Use `z.enum(Object.keys(StudentProfileSchema.shape) as [keyof StudentProfileInput, ...(keyof StudentProfileInput)[]])` or define an explicit `ProfileFieldKey` enum. | P2 |
| D4 | Evaluator: a **missing** field on a condition with `requiresOfficialVerification: true` returns `VERIFY`, not `UNKNOWN`. This makes the spec's own test ("income omitted → Additional information required") **fail**, and wrongly tells students they "pass". | Missing field ⇒ always `UNKNOWN`. `VERIFY` only when the self-reported value passes. Reserve a separate `externalGateOnly: true` flag for conditions with no profile field (e.g., Reliance aptitude test), which always return `VERIFY`. | P3 |
| D5 | `evaluateScholarshipEligibility` applies `freshApplicationsOpen === false` as a `VERIFY` override even when the result is `FALSE`/`UNKNOWN`? (it doesn't—but it also overrides `TRUE`). Intent is unclear for **renewal-only** schemes (PM-USP CSSS). | Introduce explicit window logic: `fresh_applications_open=false` ⇒ outcome message "Fresh applications not open yet – check portal", never "Potential match". Keep `FALSE`/`UNKNOWN` precedence. | P3 |
| D6 | OR-node returns `missing` only from UNKNOWN children and drops satisfied/verify context when mixed; "all failed" message is generic. | When all OR branches fail, include each branch's failure labels in the explanation. When some UNKNOWN and none TRUE, list all missing. | P3 |
| D7 | `verification_logs` has `FOR SELECT USING (TRUE)` which publicly exposes `admin_user_id`. | Create a public view `verification_logs_public` omitting `admin_user_id`; restrict base table SELECT to admins. | P1 |
| D8 | Profiles UPDATE policy `WITH CHECK (... role = 'student')` blocks admins from editing their own profile and doesn't prevent role self-escalation at column level reliably. | Add a trigger `prevent_role_change()` that rejects `role` changes unless `service_role`; loosen the check to `auth.uid() = id`. | P1 |
| D9 | Docs say `/api/scholarships/discover` filters `course` & `education_level` post-query in JS and `textSearch('name', …)` against a non-tsvector column. | Add a generated `search_vector tsvector` column on `scholarships`; query with `.textSearch('search_vector', q, {type:'websearch'})`. Move education-level/state filters into SQL via an RPC or joined filter. Add pagination (`page`, `page_size`). | P4 |
| D10 | Spec's domain whitelist (`.gov.in`, `.nic.in`, `.ac.in`) is claimed as DB-enforced but only `^https://` is checked. | Add DB CHECK + admin API Zod refine for host allowlist (+ explicit foundation allowlist table). | P1/P7 |
| D11 | Unit test expects `daysRemaining` 27 and `urgency UPCOMING_30D` — correct, but `CRITICAL_72H` etc. boundaries untested. | Add boundary tests (72h, 7d, 30d). | P3 |
| D12 | `pg_trgm` extension is created but unused. | Either add trigram index on `name` for typo-tolerant search, or remove. Plan: add it (P4). | P1/P4 |
| D13 | Income cap is stored in both `max_income_inr` column and the AST. Risk of divergence. | Treat AST as source of truth; add a seed-time consistency check script that fails if column ≠ AST value. | P3 |
| D14 | `scholarships.is_deadline_verified` may be TRUE while `student_deadline_at` is in the past with `verification_status = 'verified'`. | Nightly job / on-read computation: show "Expired" and offer admin "flagged_for_review". | P6 |
| D15 | Reliance (SCH-15) bundles UG and PG into one record, but rules differ (income cap vs none, GATE/CGPA). | Split into **SCH-15A (UG)** and **SCH-15B (PG)** or give two rule versions keyed by education level. Plan chooses split. | P5 |

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
