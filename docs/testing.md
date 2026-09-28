# CampusHire – Testing & Quality Assurance Guide

> **Course:** BTWA Capstone Project  
> **Testing Suite Status:** 55 / 55 Passed (100% Pass Rate)

---

## 1. Automated Integration Test Suite Breakdown

CampusHire includes automated integration test scripts in `server/scripts/`.

### Master System Audit Command:
```powershell
npm run audit
```

### Test Assertions Table:

| Phase | Test Suite | Assertions | Key Validations |
| :--- | :--- | :---: | :--- |
| **Phase 1 & 2** | Backend & MongoDB | 3 | Server health check (`/api/health`), Atlas/Compass connection, connection pool |
| **Phase 3 & 5** | Auth & Registration | 5 | Student registration, password exclusion (`select: false`), duplicate email rejection (`409 Conflict`) |
| **Phase 6 & 7** | Login & RBAC | 5 | Student/Admin JWT generation, credential comparison, role assertion |
| **Phase 4 & 25**| Security & Authorization | 2 | Student blocked from admin route (`403 Forbidden`), unauthenticated access blocked (`401`) |
| **Phase 8** | Student Profile | 5 | Roll number matching, profile updates, placement status tampering protection |
| **Phase 9** | Company Management | 2 | Hiring partner creation, company tier and contact assignment |
| **Phase 10** | Recruitment Drives | 1 | Drive creation, deadline configuration, eligibility parameters |
| **Phase 11** | Eligibility Engine | 3 | Deterministic evaluation, CGPA & backlog validation, failure reason generation |
| **Phase 14 & 15**| Resume Upload & ATS | 5 | Strict PDF validation, secure storage, section scoring, keyword density analysis |
| **Phase 16** | Job Resume Matching | 3 | Match percentage calculation, skill gap discovery, JD keyword alignment |
| **Phase 12 & 13**| Applications & Stages | 4 | Application submission, duplicate prevention, pipeline status advancing |
| **Phase 17** | Interview Coordinator | 3 | Round scheduling, candidate agenda view, clearance feedback |
| **Phase 18** | Notifications | 4 | Real-time alerts, unread counts, individual & bulk read updates |
| **Phase 19** | Results & CTC Sync | 5 | Result publication, automatic student `"Placed"` transition, CTC record update |
| **Phase 20** | Placement Analytics | 5 | KPI totals, placement rate %, branch-wise distribution, company statistics |

---

## 2. Step-by-Step Viva Presentation Demonstration Script

When demonstrating CampusHire to academic evaluators or external examiners, follow this 5-minute workflow:

### Step 1: Open the Application
- Navigate to `http://localhost:5173`.
- Point out the clean university placement portal branding, modern Inter font typography, role tabs, and Google Sign-In button.

### Step 2: Student Pre-Qualification & Application Flow
1. Click **"Fill Student"** → Sign in as `student@campushire.edu`.
2. Inspect the **Student Dashboard**: KPI widgets (Eligible Drives, Active Applications, Upcoming Interviews, Placement Status).
3. Navigate to **Recruitment Drives** (`/student/drives`):
   - Click a drive card.
   - Click **"Check Eligibility"**: Show the deterministic evaluation card verifying CGPA >= 7.0, 0 backlogs, and CSE branch.
   - Click **"Apply Now"** to submit the application.
4. Navigate to **Application Tracking** (`/student/applications`):
   - Show the candidate pipeline tracking card in `APPLIED` status.

### Step 3: Resume Studio & ATS Analysis
1. Navigate to **Resume Studio** (`/student/resume/upload`):
   - Show the active PDF resume card with file size and upload date.
2. Navigate to **Resume Testing** (`/student/resume/test`):
   - Show the circular score badge (e.g., `74 / 100`).
   - Show individual section breakdown scores (Contact, Education, Skills, Projects, Experience).
   - Show actionable resume improvement suggestions.
3. Click **"Match with a Specific Job Drive"**:
   - Show the job match percentage, matched skills, missing skills (e.g., Docker, AWS), and alignment suggestions.

### Step 4: Admin / TPO Operations & Pipeline Management
1. Click avatar in top navigation → Click **"Sign Out"**.
2. Click **"Fill Admin"** → Sign in as `admin@campushire.edu`.
3. View **Admin Dashboard**:
   - Show real-time KPI counts (Total Students, Companies, Active Drives, Placements).
   - Show the Branch-Wise Placement progress bars.
4. Navigate to **Application Management** (`/admin/applications`):
   - Locate the student application submitted in Step 2.
   - Advance candidate status: `APPLIED` → `SHORTLISTED` → `TECHNICAL_INTERVIEW`.
5. Navigate to **Interview Management** (`/admin/interviews`):
   - Schedule Round 1 with Google Meet link.
6. Navigate to **Results Management** (`/admin/results`):
   - Publish final result as `SELECTED` at `16.5 LPA`.

### Step 5: Automatic Student Status Transition Verification
1. Sign out of Admin.
2. Sign back in as the student.
3. View the student dashboard:
   - Notice the status badge has automatically updated to **"Placed"**.
   - Notice the confirmed offer badge displays **16.5 LPA**.
4. Navigate to **Placement History** (`/student/results`):
   - View the confirmed selection letter and compensation package.

---

## 3. Individual Test Suite Execution Commands

```powershell
# Authentication & RBAC Tests
node scripts/testAuth.js

# Academic Profile & Protection Tests
node scripts/testStudentProfile.js

# Eligibility Engine Multi-Case Tests (Branch, CGPA, Backlogs, Batch Year)
node scripts/testEligibility.js

# Recruitment Application Pipeline Tests
node scripts/testRecruitmentApplications.js

# Resume Management & Ownership Tests
node scripts/testResumeManagement.js

# ATS Scoring & Parser Tests
node scripts/testResumeAnalysis.js

# Job-Specific Skill Matching Tests
node scripts/testJobSpecificResumeMatching.js

# Interview Coordinator Tests
node scripts/testInterviews.js

# Placement Notice Board Tests
node scripts/testPlacementUpdates.js

# Result Publication & Status Transition Tests
node scripts/testPlacementResults.js

# Institutional Analytics & MongoDB Aggregation Tests
node scripts/testPlacementAnalytics.js

# Frontend Production Build Test
cd ../client
npm run build
```
