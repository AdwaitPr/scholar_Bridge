# ScholarBridge Research Report: Regulatory Concurrence Matrix & Grant Stacking Framework

> Reference Academic Year: **AY 2026–27**  
> Operational Timezone: **Asia/Kolkata (IST, UTC+05:30)**  
> Legal Context: **Direct Benefit Transfer (DBT) Bharat, General Financial Rules (GFR) Rule 230(1), & NSP AY 2026–27 Multi-Application Directives**

---

## 1. Executive Summary & Legal Directives

In the Indian educational funding landscape, educational aid spans Central Ministries, Statutory Bodies (AICTE, UGC), State Welfare Departments, and Private Philanthropic Foundations. A major source of disqualification, clawbacks, and student anxiety is **scholarship concurrency**—the legal and administrative rules governing whether a student can hold or apply for more than one scholarship concurrently.

### 1.1 The AY 2026–27 NSP Paradigm Shift

Prior to AY 2026–27, the National Scholarship Portal (NSP) strictly enforced a legacy _"One Student, One Scholarship"_ de-duplication block at the submission stage. In the 2026–27 cycle, NSP updated its framework:

1. **Application Phase Flexibility:** A student can submit **one Merit-based application** and **one or more Welfare-based applications** within the same academic year.
2. **Disbursement Phase Exclusivity:** Even though dual applications are permitted to maximize discovery odds, **disbursement remains strictly de-duplicated**. If a student is selected for both a Central Merit award (e.g., AICTE Pragati) and a Central Welfare award (e.g., Top Class SC), the student must surrender one award before physical or biometric verification at the State/Ministry level. Receiving duplicate central funds in an Aadhaar-seeded bank account triggers DBT duplication flags and recovery proceedings under GFR Rule 230(1).

---

## 2. Scheme Classification Taxonomy

To compute mutual exclusions and stacking potential, all scholarships in ScholarBridge are mapped to four regulatory classifications:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SCHOLARSHIP FUNDING TAXONOMY                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
│     CENTRAL_MERIT       │   │     CENTRAL_WELFARE     │   │      STATE_CENTRAL      │
│ (AICTE Pragati, CSSS,   │   │ (SC Top Class, ST Fellow│   │  SPONSORED (CSS / PM)   │
│  UGC Ishan Uday, NSPGS) │   │  DEPwD, PM YASASVI)     │   │ (Delhi/UP/Maha Post-Mat)│
└───────────┬─────────────┘   └───────────┬─────────────┘   └───────────┬─────────────┘
            │                             │                             │
            └─────────────────────────────┼─────────────────────────────┘
                                          │
                                          ▼
                             ┌─────────────────────────┐
                             │  PHILANTHROPIC_STACKABLE│
                             │ (Reliance Foundation,   │
                             │  Tata Trusts, CSR)      │
                             └─────────────────────────┘
```

| Classification        | Definition & Legal Source                                                                                     | Concurrence Rule Summary                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CENTRAL_MERIT`       | Competitive, merit-capped schemes funded directly by Central Ministries (e.g. MoE, AICTE, UGC).               | **Strictly 1 application on NSP.** Mutually exclusive with all other Central schemes on disbursement.                                                           |
| `CENTRAL_WELFARE`     | Targeted social welfare & inclusion schemes (SC, ST, OBC, EBC, DNT, PwD).                                     | Can be applied for alongside 1 Central Merit scheme on NSP. Mutually exclusive with other full maintenance/tuition Central awards on disbursement.              |
| `STATE_POST_MATRIC`   | Centrally Sponsored Schemes (60:40 fund sharing) or 100% State-funded schemes administered via State Portals. | Covers institutional non-refundable fees + maintenance. Displaced or reduced if a Central scheme pays full tuition.                                             |
| `PHILANTHROPIC_STACK` | Private trusts, foundation grants, and corporate CSR fellowships (e.g. Reliance Foundation).                  | **Stackable with Government Aid** up to total verified cost of education (Tuition + Living + Equipment), unless external scheme explicitly forbids private aid. |

---

## 3. Pairwise Compatibility & Concurrence Matrix

This matrix maps pairwise interactions between the 16 seeded ScholarBridge schemes (`SCH-01` to `SCH-15B`) and representative state schemes:

### Interaction Relationship Codes:

- 🔴 **`MUTUALLY_EXCLUSIVE`:** Prohibited by law or portal policy. Accepting one invalidates or revokes the other.
- 🟡 **`DUAL_APPLY_SINGLE_DISBURSE`:** NSP AY 2026–27 permits applying for both to maximize admission odds, but student must surrender one upon award.
- 🟢 **`STACKABLE_GAP_FUNDING`:** Legally stackable up to total institutional cost of education (Tuition + Living + Books + Equipment).
- ⚪ **`INDEPENDENT_CATEGORY`:** Distinct education levels (e.g. School Class 9–12 vs Postgraduate) that cannot apply to the same student at the same time.

| Base Scheme (Row)               | Competing Scheme (Column)                 | Relationship Code               | Legal Clause Citation / Operational Mechanism                                                                                                                   |
| ------------------------------- | ----------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SCH-01** (AICTE Pragati UG)   | **SCH-07** (PM-USP CSSS UG)               | 🔴 `MUTUALLY_EXCLUSIVE`         | Both are `CENTRAL_MERIT`. NSP blocks filing >1 Central Merit application per AY.                                                                                |
| **SCH-01** (AICTE Pragati UG)   | **SCH-09** (MoSJE Top Class SC)           | 🟡 `DUAL_APPLY_SINGLE_DISBURSE` | 1 Merit + 1 Welfare dual-apply allowed on NSP; student must surrender Pragati if Top Class SC is awarded (Top Class benefit ₹2L+ is 4x higher).                 |
| **SCH-01** (AICTE Pragati UG)   | **SCH-14** (Delhi / State Post-Matric SC) | 🔴 `MUTUALLY_EXCLUSIVE`         | Pragati guidelines Clause 4.2: Candidate in receipt of state stipend must surrender one.                                                                        |
| **SCH-01** (AICTE Pragati UG)   | **SCH-15A** (Reliance Foundation UG)      | 🟢 `STACKABLE_GAP_FUNDING`      | Reliance Foundation allows government aid; Pragati lump sum ₹50k acts towards contingency/books; Reliance covers remaining tuition up to total college fee cap. |
| **SCH-05** (UGC NSPGS PG)       | **SCH-10** (MoTA ST Fellowship)           | 🔴 `MUTUALLY_EXCLUSIVE`         | Both provide direct monthly maintenance stipends through UGC/NSP. Central DBT de-duplication halts dual disbursement.                                           |
| **SCH-05** (UGC NSPGS PG)       | **SCH-15B** (Reliance Foundation PG)      | 🟢 `STACKABLE_GAP_FUNDING`      | Reliance PG guidelines explicitly permit external academic stipends (e.g. GATE/UGC stipends up to ₹15,000/mo) alongside fellowship grants.                      |
| **SCH-06** (UGC Ishan Uday NER) | **SCH-07** (PM-USP CSSS)                  | 🔴 `MUTUALLY_EXCLUSIVE`         | Both are Central Merit. NSP portal limits applicants to 1 merit scheme per year.                                                                                |
| **SCH-06** (UGC Ishan Uday NER) | **SCH-15A** (Reliance Foundation UG)      | 🟢 `STACKABLE_GAP_FUNDING`      | Ishan Uday provides ₹8,000/mo maintenance. Reliance UG covers tuition up to ₹2,00,000. Stackable up to institutional fee cap.                                   |
| **SCH-09** (Top Class SC)       | **SCH-14** (State Post-Matric SC)         | 🔴 `MUTUALLY_EXCLUSIVE`         | Top Class SC completely displaces State Post-Matric fee reimbursement; receiving both for identical tuition fee violates GFR 230(1).                            |
| **SCH-12** (PMSS CAPF / MHA)    | **SCH-01** (AICTE Pragati)                | 🔴 `MUTUALLY_EXCLUSIVE`         | WARB PMSS Clause 14 bars concurrent central scholarships; recipient must opt for one.                                                                           |
| **SCH-13** (NMMSS School 9–12)  | **SCH-01..12, 14, 15**                    | ⚪ `INDEPENDENT_CATEGORY`       | NMMSS is school-level (Class 9–12); higher education schemes do not apply concurrently.                                                                         |

---

## 4. Mathematical Optimization Model (The Knapsack Solver)

### 4.1 Decision Variables & Parameters

Let $S = \{s_1, s_2, \dots, s_n\}$ be the verified scholarships the student is eligible for.

- $x_i \in \{0, 1\}$: Whether the student targets/accepts scholarship $s_i$.
- $v_i$: Annual net benefit in ₹ INR.
- $P_i \in (0, 1]$: Selection probability / quota competitiveness weight:
  - _Universal Entitlement (e.g. SC Post-Matric):_ $P_i = 0.95$
  - _Moderate Quota (e.g. Pragati 10,000 slots):_ $P_i = 0.60$
  - _High Competition (e.g. Reliance Foundation / CSSS top 20th percentile):_ $P_i = 0.25$
- $C_{\text{fees}}$: Total annual institutional expenditure (Tuition + Living + Equipment).

### 4.2 Objective Function

The engine provides **two distinct optimization targets**:

1. **Target 1: Maximum Expected Yield (Application Phase):**
   $$\max \sum_{i=1}^n (v_i \cdot P_i) \cdot x_i$$
2. **Target 2: Maximum Realizable Value (Disbursement / Award Phase):**
   $$\max \sum_{i=1}^n v_i \cdot x_i$$

### 4.3 Constraint Set

1. **Central Merit Limit (NSP Submission Boundary):**
   $$\sum_{i \in \text{CentralMerit}} x_i \le 1$$
2. **Central Disbursement Mutual Exclusion (DBT Duplication Boundary):**
   $$\sum_{i \in \text{CentralAll}} x_i \le 1$$
3. **Pairwise Conflict Edges:**
   $$\forall (s_i, s_j) \in E_{\text{conflict}}, \quad x_i + x_j \le 1$$
4. **Institutional Fee Ceiling (Gap-Funding Cap):**
   $$\sum_{i \in \text{Stackable}} v_i \cdot x_i \le C_{\text{fees}}$$

---

## 5. Next Steps for Implementation

1. **Serialize this Matrix into Code:** Convert this dataset into a type-safe JSON schema (`concurrence-rules.json`) within `src/modules/eligibility-engine/`.
2. **Implement Solver Algorithm:** A branch-and-bound optimization solver in TypeScript & Kotlin that evaluates an eligible student's matches and outputs:
   - **Recommended Application Bundle:** (Which 1 Merit + Welfare schemes to apply for on NSP + which Private schemes to apply for externally).
   - **Disbursement Decision Tree:** (If student wins A and B, choose A because yield is higher; if student wins B only, accept B).
   - **Clawback Warnings:** Highlighting conflicting pairs in the Saved and Tracker tabs.
