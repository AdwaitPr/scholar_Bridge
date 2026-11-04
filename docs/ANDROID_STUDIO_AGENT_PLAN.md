# ScholarBridge Android App — Android Studio Agent Master Build Plan

> **For Android Studio Agentic Workers:** REQUIRED EXECUTION METHODOLOGY: Execute this plan phase-by-phase in strict order. Each task has exact file paths, complete Kotlin/Jetpack Compose implementations, automated verification commands, and exit criteria. Commit after every task (`git commit -m "feat(android-PX-TY): ..."`). Run `./gradlew testDebugUnitTest` after each phase. Do not skip phases or fabricate schemas.

**Goal:** Convert the ScholarBridge web application into a native Android application inside the `android/` directory of this cloned repository, connected directly to the existing Supabase database and Next.js backend API, with full feature parity across all 12 screens and 100% offline emulator testability.

**Architecture:** Modern Android Clean Architecture + MVVM (Model-View-ViewModel) using Kotlin 2.1+, Jetpack Compose, Material 3, Kotlin Coroutines + StateFlow, Retrofit2/OkHttp3 with persistent session cookies, Room Database for offline caching and onboarding drafts, and native Android Calendar Provider & WorkManager for deadline reminders.

**Tech Stack:**

- **Language & Runtime:** Kotlin 2.1+, Java 17+, Target SDK 35 (Android 15), Min SDK 26 (Android 8.0)
- **UI Toolkit:** Jetpack Compose + Material 3, Navigation Compose, Compose Foundation
- **Networking:** Retrofit 2.11, OkHttp 4.12, Kotlinx Serialization / Moshi
- **Local Persistence:** Android Jetpack Room 2.6 (offline scholarship cache, onboarding drafts)
- **Dependency Injection:** Hilt (Dagger) 2.51+
- **Background Tasks:** AndroidX WorkManager 2.9 (periodic deadline sync & local alarms)
- **Date/Time:** `java.time` with explicit `ZoneId.of("Asia/Kolkata")` (IST, UTC+05:30)

**Reference Backend:**

- **Local Android Emulator loopback:** `http://10.0.2.2:3000/api/` (maps directly to host `localhost:3000`)
- **Production URL:** `https://scholarbridge.in/api/` (configurable in `BuildConfig`)
- **Existing Supabase Database:** Same 12 PostgreSQL tables (`scholarships`, `applications`, `application_checklists`, `checklist_items`, `reminders`, `saved_scholarships`, `profiles`, `verification_logs`).

---

## Global Constraints

1. **Strict Data Minimization:** The Android app must NEVER request, validate, or store Aadhaar numbers, PAN cards, bank account numbers, IFSC codes, parent names, or file uploads.
2. **Deterministic & Explainable:** Eligibility must display exact clause citations and 4 distinct outcome states (_Potential match_, _Additional information required_, _Likely ineligible_, _Eligibility requires official verification_). No AI hallucinations.
3. **Timezone Awareness:** All countdowns, dates, and deadlines must be computed in `Asia/Kolkata` (IST, UTC+05:30). Student deadlines must be strictly distinguished from Institute Nodal Officer (INO) deadlines.
4. **Anti-Fraud Messaging:** Every screen displaying scholarships must prominently feature: _"Government scholarship applications on NSP are 100% free. Never pay agent fees."_
5. **Direct Official Links:** When a student taps "Apply on Official Site", launch an external browser intent (`Intent.ACTION_VIEW`) to the allowlisted official portal (`scholarships.gov.in`, `ugc.ac.in`, etc.).
6. **Workspace Location:** All Android code lives in the `android/` subfolder of this repository.

---

## Directory Structure to Create

```
scholar_Bridge/
├── android/                             <-- Android Studio root directory
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   ├── gradle/
│   │   └── libs.versions.toml
│   ├── gradlew
│   ├── gradlew.bat
│   └── app/
│       ├── build.gradle.kts
│       ├── proguard-rules.pro
│       └── src/
│           ├── main/
│           │   ├── AndroidManifest.xml
│           │   ├── java/com/scholarbridge/app/
│           │   │   ├── ScholarBridgeApp.kt
│           │   │   ├── MainActivity.kt
│           │   │   ├── core/
│           │   │   │   ├── network/       (Retrofit, OkHttp, Interceptors, ApiResult)
│           │   │   │   ├── database/      (Room DB, Entities, DAOs)
│           │   │   │   ├── di/            (Hilt Modules: NetworkModule, DatabaseModule)
│           │   │   │   ├── designsystem/  (Theme, Color, Type, Shape, Components)
│           │   │   │   └── util/          (TimeUtils, NumberFormatters, Constants)
│           │   │   ├── data/
│           │   │   │   ├── model/         (DTOs matching web JSON contracts)
│           │   │   │   └── repository/    (ScholarshipRepo, ProfileRepo, TrackerRepo)
│           │   │   ├── domain/
│           │   │   │   ├── model/         (Domain models, State machines)
│           │   │   │   └── engine/        (Deterministic Boolean AST Evaluator)
│           │   │   └── ui/
│           │   │       ├── navigation/    (NavGraph, Destinations, BottomBar)
│           │   │       ├── home/          (HomeScreen, HomeViewModel)
│           │   │       ├── discovery/     (DiscoveryScreen, FilterSheet, DetailScreen)
│           │   │       ├── eligibility/   (DiagnosticsScreen, QuickFillDialog)
│           │   │       ├── onboarding/    (OnboardingWizardScreen, OnboardingViewModel)
│           │   │       ├── dashboard/     (DashboardScreen, NotificationTray)
│           │   │       ├── tracker/       (ApplicationsKanbanScreen, ChecklistScreen)
│           │   │       ├── deadlines/     (CalendarScreen, AgendaScreen, EventExporter)
│           │   │       ├── saved/         (SavedScreen, ComparisonTable)
│           │   │       ├── settings/      (SettingsScreen, DataExport, DeleteDialog)
│           │   │       └── policy/        (HowWeVerifyScreen, PrivacyScreen, DisclaimerScreen)
│           │   └── res/
│           │       ├── values/            (strings.xml, colors.xml, themes.xml)
│           │       └── drawable/          (icons, logos, splash)
│           └── test/                      (Unit tests: EvaluatorTest, RepoTest, etc.)
└── src/                                 <-- Existing Next.js Web Application
```

---

## Phase 0: Android Project Scaffolding & Gradle Setup

### Task P0-T1: Create Root Android Project & Version Catalog

- **Directory:** `android/`
- **Files to Create:**
  - `android/settings.gradle.kts`: Declares `rootProject.name = "ScholarBridge"` and includes `:app`. Configures Google and Maven Central plugin repositories.
  - `android/build.gradle.kts`: Root Gradle file applying Android & Kotlin plugins with `apply false`.
  - `android/gradle/libs.versions.toml`: Version catalog declaring:
    - Android Gradle Plugin: `8.7.+`
    - Kotlin: `2.1.0`
    - Compose BOM: `2024.11.00`
    - Hilt: `2.51.1`
    - Room: `2.6.1`
    - Retrofit: `2.11.0`
    - OkHttp: `4.12.0`
    - Coroutines: `1.9.0`
    - WorkManager: `2.9.1`

### Task P0-T2: Configure App Module (`android/app/build.gradle.kts`)

- Target SDK: `35`, Min SDK: `26`, Java Version: `17`.
- Enable Jetpack Compose with Kotlin Compose Compiler plugin.
- Add `buildConfigField`:
  - `DEFAULT_BASE_URL`: `"http://10.0.2.2:3000/api/"` (for Android Emulator to access local Next.js server).
  - `PROD_BASE_URL`: `"https://scholarbridge.in/api/"`.
- Add dependencies for Compose Material 3, Hilt, Room, Retrofit, OkHttp logging interceptor, and WorkManager.

### Task P0-T3: AndroidManifest.xml & Application Class

- **File:** `android/app/src/main/AndroidManifest.xml`
- Declare permissions:
  - `<uses-permission android:name="android.permission.INTERNET" />`
  - `<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />`
  - `<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />`
  - `<uses-permission android:name="android.permission.WRITE_CALENDAR" />`
  - `<uses-permission android:name="android.permission.READ_CALENDAR" />`
- Allow cleartext traffic for local development loopback: `android:usesCleartextTraffic="true"` (for `10.0.2.2`).
- Set `@HiltAndroidApp` on `ScholarBridgeApp.kt`.
- **Exit Criteria:** `./gradlew assembleDebug` succeeds cleanly in the `android/` directory.

---

## Phase 1: Core Networking & Backend Connection

### Task P1-T1: Session-Aware OkHttpClient & Retrofit Factory

- **File:** `android/app/src/main/java/com/scholarbridge/app/core/network/NetworkModule.kt`
- Create OkHttpClient equipped with:
  - `CookieJar` (e.g. `JavaNetCookieJar` with persistent `CookieManager`) to automatically preserve Next.js Supabase session cookies (`sb-*-auth-token`).
  - Auth Token Interceptor: Injects `Authorization: Bearer <token>` when available.
  - Logging Interceptor: Prints headers and JSON bodies during debug builds.
  - Timeout configurations: Connect 15s, Read 30s.

### Task P1-T2: ScholarBridge API Interface (`ScholarBridgeApiService.kt`)

- Direct mapping of existing Next.js REST API:
  ```kotlin
  interface ScholarBridgeApiService {
      @GET("scholarships/discover")
      suspend fun discoverScholarships(
          @Query("q") query: String? = null,
          @Query("education_level") educationLevel: String? = null,
          @Query("state") state: String? = null,
          @Query("course") course: String? = null,
          @Query("funding_type") fundingType: String? = null,
          @Query("provider_type") providerType: String? = null,
          @Query("max_income") maxIncome: Long? = null,
          @Query("hide_expired") hideExpired: Boolean = false,
          @Query("sort") sort: String = "deadline_asc",
          @Query("page") page: Int = 1,
          @Query("page_size") pageSize: Int = 12
      ): Response<DiscoveryResponseDto>

      @GET("scholarships/{slug}")
      suspend fun getScholarshipDetail(@Path("slug") slug: String): Response<ScholarshipDetailDto>

      @POST("eligibility/evaluate")
      suspend fun evaluateEligibility(@Body request: EvaluateEligibilityRequestDto): Response<EligibilityEvaluationResultDto>

      @GET("profile")
      suspend fun getProfile(): Response<ProfileResponseDto>

      @PUT("profile")
      suspend fun updateProfile(@Body profile: StudentProfileDto): Response<ProfileResponseDto>

      @DELETE("profile")
      suspend fun deleteProfile(@Header("X-Confirm-Account-Deletion") confirm: String = "true"): Response<Unit>

      @GET("profile/export")
      suspend fun exportData(): Response<ResponseBody>

      @GET("saved")
      suspend fun getSavedScholarships(): Response<SavedListResponseDto>

      @POST("saved")
      suspend fun saveScholarship(@Body body: SaveScholarshipRequestDto): Response<Unit>

      @DELETE("saved")
      suspend fun unsaveScholarship(@Query("scholarship_id") scholarshipId: String): Response<Unit>

      @GET("applications")
      suspend fun getApplications(): Response<ApplicationListResponseDto>

      @POST("applications")
      suspend fun createApplication(@Body body: CreateApplicationRequestDto): Response<ApplicationResponseDto>

      @PATCH("applications/{id}")
      suspend fun updateApplicationStatus(
          @Path("id") id: String,
          @Body body: UpdateApplicationStatusDto
      ): Response<ApplicationResponseDto>

      @PATCH("checklists/items/{itemId}")
      suspend fun toggleChecklistItem(
          @Path("itemId") itemId: String,
          @Body body: ToggleChecklistItemDto
      ): Response<ToggleChecklistItemResponseDto>
  }
  ```

### Task P1-T3: DTO Models Matching Web Zod Schemas

- **File:** `android/app/src/main/java/com/scholarbridge/app/data/model/ScholarshipDto.kt`
- Strict field alignment with `discovery.schema.ts`, `profile.schema.ts`, and `rule-ast.schema.ts`.
- Verify zero presence of PII fields (no Aadhaar, PAN, or bank account variables).

---

## Phase 2: Design System & Design Tokens (Material 3)

### Task P2-T1: ScholarBridge Theme, Colors & Typography

- **File:** `android/app/src/main/java/com/scholarbridge/app/core/designsystem/Theme.kt`
- Exact hex alignment with web CSS semantic tokens:
  - Navy: `0xFF0F172A`
  - Primary Blue: `0xFF1D4ED8`
  - Teal (Official Verification): `0xFF0D9488`
  - Emerald (Potential Match): `0xFF15803D`
  - Amber (Urgent/Missing Info): `0xFFB45309`
  - Crimson (Ineligible/72h): `0xFFB91C1C`
  - Background: `0xFFF8FAFC`, Surface: `0xFFFFFFFF`
- Ensure WCAG 2.1 AA compliant text contrast across all color pairs.

### Task P2-T2: Reusable Common Components

- **`MatchBadge.kt`:** Never color-only. Uses icon + localized text label (_Potential match_, _Additional information required_, _Likely ineligible_, _Official verification required_).
- **`DeadlineBadge.kt`:** Formats student vs INO deadlines in Asia/Kolkata timezone with `tabular-nums` alignment (_"Closes in 5 days"_, _"Closing Today"_, _"Expired"_, _"Deadline not verified"_).
- **`AntiFraudBanner.kt`:** Persistent warning component with link to official NSP portal.
- **`SourceProvenanceBox.kt`:** Displays authoritative source URL, last-verified date, and audit badge.

---

## Phase 3: Discovery Catalog & Scholarship Detail Screens

### Task P3-T1: Discovery Screen with Faceted Filters Modal

- **File:** `android/app/src/main/java/com/scholarbridge/app/ui/discovery/DiscoveryScreen.kt`
- Instant search bar with debounced query.
- Filter chips for Education Level (School 9–12, Diploma, UG Technical, UG General, PG).
- `ModalBottomSheet` filter sheet with State domicile dropdown, Course stream, Funding type, Max income slider, and "Hide expired" toggle.
- Pull-to-refresh and infinite scrolling pagination.

### Task P3-T2: Scholarship Card & Detail View

- **File:** `android/app/src/main/java/com/scholarbridge/app/ui/discovery/ScholarshipDetailScreen.kt`
- Comprehensive overview: annual financial benefit in INR (`₹`), eligibility summary, and detailed application guidelines.
- Mandatory documents list with issuing authorities.
- "Apply on Official Site" prominent CTA button opening `Intent.ACTION_VIEW` targeting allowlisted government domain.
- Save / Bookmark icon toggle with instant optimistic state update.

---

## Phase 4: Deterministic Eligibility Engine & 4-Accordion Diagnostics

### Task P4-T1: Client-Side Kotlin AST Evaluator (`EligibilityEvaluator.kt`)

- **File:** `android/app/src/main/java/com/scholarbridge/app/domain/engine/EligibilityEvaluator.kt`
- Pure Kotlin port of `src/modules/eligibility-engine/evaluator.ts`.
- Recursively evaluates `AND` / `OR` / `CONDITION` tree nodes against `StudentProfile`.
- Evaluates Comparison Operators: `eq`, `neq`, `lte`, `gte`, `lt`, `gt`, `in`, `nin`.
- Preserves spec defect fixes:
  - **D4:** Missing profile field returns `UNKNOWN` (Missing info), not `VERIFY`.
  - **D5:** `fresh_applications_open = false` returns explicit window overlay _"Fresh applications not open yet – check portal"_.
  - **D6:** Failed OR-node collects failure reasons from all branches.

### Task P4-T2: 4-Accordion Diagnostics Screen

- **File:** `android/app/src/main/java/com/scholarbridge/app/ui/eligibility/EligibilityDiagnosticsScreen.kt`
- Expandable Material 3 Cards for:
  1. **Satisfied Conditions (Green checkmark):** Displays criterion and reason passed.
  2. **Not Met Conditions (Red cross):** Displays failure explanation and official guideline citation.
  3. **Missing Information (Amber question mark):** Inline "Quick-Fill" dialog allowing student to provide missing attribute without leaving the screen, triggering instant recalculation.
  4. **Requires Official Verification (Teal shield):** Explains external gates (e.g. Reliance Foundation Aptitude Test, Institute Verification).

---

## Phase 5: Student Onboarding Wizard & Profile Settings

### Task P5-T1: 4-Step Progressive Onboarding Wizard

- **File:** `android/app/src/main/java/com/scholarbridge/app/ui/onboarding/OnboardingWizardScreen.kt`
- Step 1: Basic Profile & Education Level.
- Step 2: Course Stream, Current Year, Institution Type & AISHE status.
- Step 3: Academic Percentage / Marks & Social Category.
- Step 4: Family Income Bracket & Reminder Thresholds.
- **Privacy Callout on Every Step:** Banner reminding students never to enter Aadhaar or bank account numbers.
- **Offline Draft Persistence:** Saves form draft to Room DB so progress is never lost on app exit.

### Task P5-T2: Account Settings, Data Export & Erasure

- **File:** `android/app/src/main/java/com/scholarbridge/app/ui/settings/SettingsScreen.kt`
- Profile Editor with input validation.
- Reminder Threshold Checkboxes (`30`, `14`, `7`, `3`, `1` days).
- **Data Portability:** "Export My Data (JSON)" button triggering Android Share Sheet (`Intent.ACTION_SEND`) with the student's complete record.
- **Permanent Account Erasure:** Deletion modal requiring the user to type `"DELETE MY ACCOUNT"` before enabling the destructive deletion button calling `DELETE /api/profile`.

---

## Phase 6: Application Tracker & Document Checklist

### Task P6-T1: 9-State Lifecycle Kanban & List Tracker

- **File:** `android/app/src/main/java/com/scholarbridge/app/ui/tracker/ApplicationsTrackerScreen.kt`
- Horizontal pager / TabRow covering the 9 finite states:
  _Saved → Researching → Preparing → Ready to Apply → Submitted → Awaiting Result → Awarded / Not Selected → Closed_.
- Strict client-side validation rejecting invalid state jumps (matching web state machine).
- Editable Application Reference ID and encrypted local private notes.

### Task P6-T2: Readiness Meter & Document Checklist Screen

- **File:** `android/app/src/main/java/com/scholarbridge/app/ui/tracker/ChecklistScreen.kt`
- Circular progress readiness meter (% completed).
- Grouped checklist items by category: Documents, Registration (OTR), Verification, Tests.
- Optimistic toggle with check animation calling `PATCH /api/checklists/items/{itemId}`.
- Banner: _"Tracks your personal preparation readiness only. Not official portal validation."_

---

## Phase 7: Deadlines Calendar & Local Notifications

### Task P7-T1: IST Deadlines Calendar View

- **File:** `android/app/src/main/java/com/scholarbridge/app/ui/deadlines/CalendarScreen.kt`
- Month grid view and agenda list view.
- Color-coded badges for Expired, Urgent (<72h), Upcoming (<7d), and Unverified.
- Distinct visual badges for Student Application Deadline vs Institute Nodal Officer (INO) Verification Deadline.

### Task P7-T2: Android Calendar Sync & WorkManager Reminders

- **File:** `android/app/src/main/java/com/scholarbridge/app/core/util/CalendarExporter.kt`
- Direct calendar event insertion via `CalendarContract.Events` (client-generated, zero PII).
- Periodic background worker (`WorkManager`) checking upcoming saved scholarship deadlines and dispatching local Android notifications based on user thresholds (30, 14, 7, 3, 1 days).

---

## Phase 8: Saved Scholarships, Anti-Fraud & Static Pages

### Task P8-T1: Saved Scholarships & Side-by-Side Comparison

- **File:** `android/app/src/main/java/com/scholarbridge/app/ui/saved/SavedScreen.kt`
- Card list of saved scholarships.
- Side-by-side comparison sheet comparing annual benefit, income ceiling, deadlines, and eligibility status.
- Callout note on AY 2026–27 NSP dual-application rules (one merit + welfare allowed, concurrent central disbursement restricted).

### Task P8-T2: Static Information & Legal Screens

- **File:** `android/app/src/main/java/com/scholarbridge/app/ui/policy/StaticPages.kt`
- Dedicated Compose screens for:
  - `HowWeVerifyScreen`: The 4 pillars of verification and public audit transparency.
  - `PrivacyPolicyScreen`: Strict architectural data minimization guarantees.
  - `DisclaimerScreen`: Non-affiliation with NSP/UGC/AICTE and anti-fraud advisory.
  - `TermsOfServiceScreen`: Non-agency and free-access terms.

---

## Phase 9: Emulator Testing, QA & Verification Suite

### Task P9-T1: Unit Test Suite (`app/src/test/`)

- Port all critical tests:
  - `EligibilityEvaluatorTest.kt`: Verifies evaluation logic across all 16 schemes with edge cases.
  - `DeadlineServiceTest.kt`: Verifies IST countdown calculations across different device time zones.
  - `ProfileValidationTest.kt`: Verifies rejection of unexpected PII fields.
  - `TrackerStateMachineTest.kt`: Verifies all allowed and forbidden transitions in the 9-state machine.
- Command: `./gradlew testDebugUnitTest`

### Task P9-T2: Emulator Run & UI Verification

- Start Android Virtual Device (AVD):
  ```bash
  emulator -avd Pixel_8_API_35 &
  adb wait-for-device
  ```
- Build & install APK on emulator:
  ```bash
  cd android
  ./gradlew installDebug
  ```
- Launch app via ADB:
  ```bash
  adb shell am start -n com.scholarbridge.app/.MainActivity
  ```
- Smoke test checklist:
  - [ ] App launches with ScholarBridge splash screen.
  - [ ] Discovery feed populates from `http://10.0.2.2:3000/api/scholarships/discover`.
  - [ ] Filter sheet filters by education level and income ceiling.
  - [ ] Clicking a scholarship opens detail view with official portal link.
  - [ ] Onboarding wizard draft persists across app restarts.
  - [ ] Anti-fraud banner visible on all key screens.

---

## Phase 10: Instructions for the Android Studio Coding Agent

When running inside Android Studio, prompt your AI agent with:

```text
You are an expert Android engineer working on the ScholarBridge project.
Follow docs/ANDROID_STUDIO_AGENT_PLAN.md step-by-step.
Start with Phase 0 and create the android/ directory project structure.
Connect all API endpoints to http://10.0.2.2:3000/api/ for emulator testing.
Adhere strictly to:
1. Zero PII storage (no Aadhaar, PAN, or bank account numbers).
2. Deterministic AST eligibility matching.
3. Asia/Kolkata timezone handling.
4. Material 3 styling and 360dp mobile responsiveness.
Commit after each task: feat(android-PX-TY): ...
After each phase run: ./gradlew testDebugUnitTest
```
