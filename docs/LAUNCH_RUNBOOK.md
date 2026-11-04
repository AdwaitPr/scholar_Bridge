# ScholarBridge — Production Launch Runbook & Operational Procedures

> Reference Date for Seed Data: **2026-11-04**  
> Operational Timezone: **Asia/Kolkata (IST, UTC+05:30)**  
> Platform Status: **Pre-Launch Ready (Phase 10)**

---

## 1. Pre-Launch Verification Gate (P10-T4)

Before declaring production go-live, a human administrator must perform the **blocking data verification gate**. No automated crawler is permitted to overwrite verification statuses.

### Verification Criteria Checklist

For each of the 16 seeded scholarships (`SCH-01` through `SCH-15B`):

1. **Official URL Validity:**
   - Must point directly to an allowlisted portal (`scholarships.gov.in`, `ugc.ac.in`, `aicte-india.org`, `scholarships.reliancefoundation.org`, or state e-District portal).
   - Absolutely no third-party aggregators or unofficial blogs.
2. **Current Academic Window (2026–27):**
   - Confirm whether the student submission window is open, closed, or renewal-only.
   - If closing date is published in an official circular: set `is_deadline_verified = true`, specify `student_deadline_at` in IST (converted to UTC 18:29:59Z), and record the `guideline_pdf_url`.
   - If not explicitly published or portal says "Opening soon": set `is_deadline_verified = false`, status `deadline_not_verified`.
3. **Audit Log Recording:**
   - Write a row in `verification_logs` with `admin_user_id`, `verified_source_url`, and `change_summary`.

---

## 2. Standard Operating Procedures (SOPs)

### SOP-01: Updating a Deadline Mid-Cycle (e.g. NSP Extension Circular)

When the Ministry of Education or UGC issues a public circular extending deadlines:

1. Navigate to `/admin` using an authenticated admin account.
2. Locate the scheme (e.g., `AICTE Pragati Degree`) and click **Edit**.
3. Under the **Deadlines & Application Windows** tab:
   - Update `student_deadline_at` (e.g. `2026-12-15 23:59:59 IST`).
   - Update `institute_verification_deadline_at` (e.g. `2026-12-31 23:59:59 IST`).
   - Ensure `is_deadline_verified` remains checked.
4. Under the **Audit & Verification Note** tab:
   - Enter official citation: e.g., _"Extended per MoE circular F.No. 12-4/2026-Sch dated 2026-11-28"_.
5. Click **Save Changes**.
   - _Database Trigger Action:_ Supabase trigger `trg_recalc_reminders_on_deadline_change` immediately updates all student reminder rows for this scholarship.

### SOP-02: Flagging a Scheme for Review

If a student or institution reports conflicting eligibility criteria:

1. Navigate to `/admin/scholarships/[id]/edit`.
2. Change `verification_status` to `flagged_for_review`.
3. Enter the reason in `verification_note`: e.g., _"Student reported revised parental income ceiling from state welfare portal."_
4. Submit form. The scheme card immediately displays an amber warning badge in student search, urging caution.

### SOP-03: Rolling Back an Eligibility Rule Version

If an erroneous AST rule was published:

1. Database table `scholarship_eligibility_rules` retains all past versions ordered by `version DESC`.
2. To rollback, publish a new rule version copying the AST from the earlier validated version (e.g. version 1).
3. The evaluator automatically queries `order('version', { ascending: false }).limit(1)`, applying the rollback instantly without downtime.

### SOP-04: Handling Nightly pg_cron Expiry Flags

1. Database cron job `check_expired_scholarships` runs every midnight at `18:30 UTC` (00:00 IST).
2. Any scholarship whose `student_deadline_at < NOW()` is automatically transitioned from `verified` to `expired` or `flagged_for_review`.
3. On discovery queries, expired scholarships are hidden by default unless the student unchecks "Hide expired scholarships".

---

## 3. Privacy & Zero-PII Compliance Checklist

| Item                    | Verification Standard        | Audit Method                                       |
| ----------------------- | ---------------------------- | -------------------------------------------------- |
| **Aadhaar Numbers**     | Strictly forbidden           | Schema `.strict()`, DB schema zero aadhaar columns |
| **PAN / Tax IDs**       | Strictly forbidden           | Rejected with 400 on API                           |
| **Bank Account / IFSC** | Strictly forbidden           | Zero storage across all 12 tables                  |
| **Identity Uploads**    | No document files accepted   | Checklists store completion boolean only           |
| **Data Portability**    | GDPR / Indian DPDP compliant | `GET /api/profile/export` returns complete JSON    |
| **Permanent Erasure**   | Irreversible deletion        | `DELETE /api/profile` with cascading FK purges     |

---

## 4. Production Smoke Test Verification

Execute the standard verification pipeline:

```bash
# 1. Typecheck
pnpm tsc --noEmit

# 2. Linting
pnpm lint

# 3. Unit test suite
pnpm test:unit

# 4. Static secret scan
pnpm audit:secrets

# 5. Production build
pnpm build
```

All checks must report clean with code 0 before promotion to production.
