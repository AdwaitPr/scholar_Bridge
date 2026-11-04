# ScholarBridge 🎓

> **Deterministic, source-verified scholarship discovery and application lifecycle platform for Indian students with zero-PII privacy.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Tests-80%20passing-brightgreen)](tests/)

ScholarBridge is an open-access, source-verified scholarship discovery and application lifecycle platform tailored for Indian students from Class 9 through Postgraduate studies (AY 2026–27).

Unlike secondary aggregators that scrape unverified deadlines, promote sponsored programs, or rely on probabilistic AI models that risk hallucinating eligibility thresholds, ScholarBridge features a deterministic, explainable rules engine backed by an authoritative Source Verification Register.

---

## 🌟 Key Capabilities

- **🔍 Deterministic Eligibility Engine:** Pure Boolean Abstract Syntax Tree (AST) evaluator with clause-level explanations and official circular citations. Zero AI hallucinations.
- **⏰ Multi-Stage Deadline Management:** Distinguishes between the **Student Application Deadline** and the subsequent **Institute Nodal Officer (INO) Verification Deadline** in Asia/Kolkata (IST).
- **📋 Preparation Tracker & Readiness Meter:** 9-state application lifecycle Kanban board and dynamic document readiness checklists.
- **🛡️ Strict Privacy by Architectural Minimization:** Never collects, asks for, or stores Aadhaar numbers, PAN cards, bank account details/IFSC, parent names, or uploaded documents.
- **🚫 Anti-Fraud by Design:** Prominent warnings on every screen confirming that government scholarship applications on the National Scholarship Portal (NSP) are 100% free.

---

## 🏗️ Architecture & Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Database & Auth:** Supabase PostgreSQL with strict Row Level Security (RLS) policies
- **UI & Styling:** Tailwind CSS v4, Base UI, Lucide Icons, WCAG 2.1 AA accessible focus and contrast tokens
- **Internationalization:** Scaffolded with `next-intl` (English + Hindi)
- **Timezone Handling:** Pure IST (UTC+05:30) date handling with zero client-side timezone drift
- **SEO & Provenance:** Schema.org `GovernmentService` JSON-LD, dynamically generated `sitemap.xml` and `robots.txt`

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.x
- pnpm >= 9.x
- Supabase CLI or active Supabase project

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/AdwaitPr/scholar_Bridge.git
   cd scholar_Bridge
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and populate your Supabase credentials:

   ```bash
   cp .env.example .env.local
   ```

   Required keys:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # Server-side only
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Seed Database:**

   ```bash
   pnpm seed
   ```

5. **Start Development Server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Testing & Quality Assurance

```bash
# Run unit test suite (80 tests across 10 suites)
pnpm test:unit

# Typecheck TypeScript code
pnpm typecheck

# Run ESLint
pnpm lint

# Run Static Secret Audit (verifies client bundle for zero credentials)
pnpm audit:secrets

# Production build
pnpm build
```

---

## 📖 Operational Runbooks

- [Master Build Plan](docs/SCHOLARBRIDGE_MASTER_PLAN.md)
- [Technical Architecture & Spec](docs/SPEC.md)
- [Production Launch Runbook & SOPs](docs/LAUNCH_RUNBOOK.md)

---

## ⚖️ License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
