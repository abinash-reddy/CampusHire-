# CampusHire – College Placement & Recruitment Management System

> **Academic Coursework:** BTWA (Backend Technologies for Web Applications)  
> **Architecture:** Modern Layered RESTful Web Architecture (MERN + Firebase + Gemini AI)  
> **Demo URL (Frontend):** `http://localhost:5173`  
> **API Server (Backend):** `http://localhost:5000`

---

## 1. Project Overview

**CampusHire** is a full-stack, enterprise-grade college placement and recruitment management platform designed to streamline campus hiring drives. It automates candidate eligibility evaluations, application tracking pipelines, rule-based & AI-assisted ATS resume analysis, interview coordination, placement result publication with automatic CTC tracking, and institutional placement analytics.

---

## 2. Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | High-performance SPA with fast HMR |
| **Styling** | Tailwind CSS v4 + Lucide Icons | Responsive modern dashboard interface |
| **Routing** | React Router v7 | Protected client-side routing & RBAC views |
| **Backend Runtime** | Node.js + Express.js v4 | Clean MVC-Service REST API architecture |
| **Database & ODM** | MongoDB Atlas / Compass + Mongoose | Cloud & local database with indexed schemas |
| **Authentication** | Firebase Authentication + JWT | Hybrid authentication: Firebase ID Tokens & fallback JWTs |
| **Storage** | Multi-Tier Storage | Firebase Cloud Storage & local secure upload storage |
| **AI Engine** | Google Gemini Free-Tier (Gemini 1.5/2.0) | Deterministic rule engine combined with generative resume/interview assistance |

---

## 3. High-Level System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                 Client Layer (React 19 + Vite)              │
│  Student Dashboard  │  Admin / TPO Console  │  Auth Views   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / REST JSON (JWT / Firebase Bearer)
┌──────────────────────────────▼──────────────────────────────┐
│                Express.js REST API Gateway                  │
│   ├── Middleware: CORS, Error Handler, Multer Upload        │
│   └── Security: firebaseAuthMiddleware & roleMiddleware     │
└──────┬───────────────────────┬───────────────────────┬──────┘
       │                       │                       │
┌──────▼──────┐         ┌──────▼──────┐         ┌──────▼──────┐
│  MongoDB    │         │  Firebase   │         │ Google AI   │
│  Atlas /    │         │  Admin SDK  │         │ Studio      │
│  Compass    │         │  (Auth &    │         │ (Gemini     │
│  (14 Models)│         │   Storage)  │         │  Service)   │
└─────────────┘         └─────────────┘         └─────────────┘
```

---

## 4. Complete Feature List

### Student Features
- **Authentication:** Email/Password login, registration, Google Popup Sign-in, and Password Reset via Firebase.
- **Academic Profile:** Manage roll number, branch, CGPA, active/historical backlogs, verified skills, and project links.
- **Drive Discovery:** Browse active campus recruitment drives with real-time company details and compensation packages.
- **Automated Eligibility Engine:** One-click pre-qualification check evaluating branch, CGPA, backlogs, and graduation year with explicit pass/fail criteria feedback.
- **Application Tracking:** Track progression through pipeline stages: `APPLIED` → `SHORTLISTED` → `TECHNICAL_INTERVIEW` → `HR_INTERVIEW` → `SELECTED` / `REJECTED`.
- **Resume Studio & ATS Analysis:** Upload PDF resumes (under 5MB) with deterministic section parsing, keyword extraction, and score breakdown.
- **Job-Specific Matching:** Match resume against specific recruitment drive job descriptions to identify missing skills and keyword gaps.
- **Interview Schedule:** Calendar and agenda view of upcoming rounds with video links and coordinators.
- **Notice Board:** Real-time placement circulars, announcements, and drive schedules.
- **Offer Letter & History:** View confirmed placement offers and highest achieved CTC.

### Admin / TPO Features
- **Executive Analytics:** Real-time KPI summary (Total Students, Active Drives, Companies, Placement Rate %).
- **Interactive Visualizations:** Branch-wise placement distribution, company-wise applicant metrics, and drive statistics.
- **Drive Management:** Create, configure eligibility thresholds, activate, or close recruitment drives.
- **Candidate Pipeline Tracker:** Filter, shortlist, advance stages, and manage applicant progression.
- **Interview Coordinator:** Schedule rounds, assign interviewers, configure video links, and publish clearance feedback.
- **Result Publishing:** Publish final selections (`SELECTED`, `WAITLISTED`, `REJECTED`) with automatic student status transition to `"Placed"`.
- **Student Master Roster:** View complete candidate profiles, academic records, and verified placement statuses.

---

## 5. Directory & File Organization

```text
CampusHire/
├── client/                     # Frontend Application (React 19 + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI (Buttons, Modals, Badges, Table)
│   │   ├── context/            # AuthContext (Firebase + JWT state)
│   │   ├── pages/
│   │   │   ├── admin/          # Admin portal views (Analytics, Drives, Students)
│   │   │   ├── auth/           # Login & Registration views
│   │   │   ├── shared/         # Common pages (Notice Board)
│   │   │   └── student/        # Student portal views (Dashboard, Resumes, Drives)
│   │   └── services/           # api.js (Centralized Axios/Fetch client) & firebase.js
│   ├── .env.example            # Frontend environment template
│   └── vite.config.js          # Vite config with backend proxy
├── server/                     # Backend API (Express.js + Mongoose)
│   ├── config/                 # db.js (MongoDB Atlas/Compass) & firebaseAdmin.js
│   ├── controllers/            # HTTP request controllers (MVC Layer)
│   ├── middlewares/            # authMiddleware, uploadMiddleware, errorHandler
│   ├── models/                 # 14 Mongoose Schema Models
│   ├── routes/                 # Express Router modules
│   ├── scripts/                # seed.js, auditAll.js, test suites
│   ├── services/               # Business logic & ATS scoring services
│   ├── uploads/resumes/        # Secure PDF storage directory
│   ├── .env.example            # Backend environment template
│   └── server.js               # Express application entrypoint
├── docs/                       # integrations.md (Atlas, Firebase, Gemini setup)
├── AGENTS.md                   # BTWA Project Rules & Architecture Guidelines
└── README.md                   # Master Documentation
```

---

## 6. Database Collections & Mongoose Schemas (14 Collections)

All collections are indexed and managed via Mongoose:

1. **`User`**: Account identity, `firebaseUid`, email, password hash, role (`'student'`, `'admin'`, `'tpo'`), active state.
2. **`Student`**: Profile linked to User (`user`), roll number, department, CGPA, backlogs, skills, placement status (`'Unplaced'`, `'Placed'`), active resume ref.
3. **`Company`**: Hiring partner records, tier, website, contact coordinators.
4. **`RecruitmentDrive`**: Company ref, job title, description, package (LPA), eligibility criteria, deadlines, status (`'OPEN'`, `'CLOSED'`).
5. **`Application`**: Application state (`'APPLIED'`, `'SHORTLISTED'`, `'INTERVIEW'`, `'SELECTED'`, `'REJECTED'`), candidate ref, drive ref.
6. **`Resume`**: Primary resume document, file path/url, storage provider (`'local'` | `'firebase'`), size, ATS score.
7. **`ResumeTest`**: ATS rule evaluation, general section scores, detected skills, keyword scores, suggestions.
8. **`ResumeVersion`**: Historical versions of student resumes for audit and version tracking.
9. **`Interview`**: Interview rounds, date, time, mode (`'Online'` | `'In-Person'`), meeting URL, clearance status.
10. **`Notification`**: Real-time notifications with unread badges and bulk read receipts.
11. **`PlacementUpdate`**: Placement cell notices and announcements.
12. **`Result`**: Final hiring results with package, student ref, drive ref, and result status.
13. **`AIConversation`**: Multi-turn placement assistant conversational history.
14. **`AIAnalysis`**: Cached generative AI evaluations, skill gaps, and interview prep suggestions.

---

## 7. Environment Variables Configuration

### Server Configuration (`server/.env`)
Copy `server/.env.example` to `server/.env`:

```env
# 1. Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# 2. Database Connection (MongoDB Atlas or Compass)
# For Atlas Cloud Cluster: mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/campushire?retryWrites=true&w=majority
# For Local MongoDB Compass:
MONGODB_URI=mongodb://127.0.0.1:27017/campushire
MONGO_URI=mongodb://127.0.0.1:27017/campushire

# 3. JWT Secret (BTWA Core System)
JWT_SECRET=campushire_development_secret_btwa_key_2026
JWT_EXPIRES_IN=7d

# 4. Firebase Project Credentials
FIREBASE_PROJECT_ID=campushire-f3d0a
FIREBASE_STORAGE_BUCKET=campushire-f3d0a.firebasestorage.app
# Optional Service Account Private Key for Admin SDK
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# 5. Google Gemini AI API Key (Free-Tier)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Client Configuration (`client/.env`)
Copy `client/.env.example` to `client/.env`:

```env
VITE_API_URL=/api
VITE_FIREBASE_API_KEY=AIzaSyAS9DQikNN2u7cZAmeKs7D2DGGNmcTAc78
VITE_FIREBASE_AUTH_DOMAIN=campushire-f3d0a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=campushire-f3d0a
VITE_FIREBASE_STORAGE_BUCKET=campushire-f3d0a.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=992914702166
VITE_FIREBASE_APP_ID=1:992914702166:web:ea75a50efb31ca63f860f7
```

---

## 8. Installation & Setup Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance (Compass) OR free MongoDB Atlas cloud cluster
- **npm**: v9.0.0 or higher

### Step 1: Clone & Install Dependencies
```powershell
# In project root
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Step 2: Seed Demo Database
Populate the database with pre-configured companies, recruitment drives, eligible/ineligible student profiles, sample resumes, applications, and announcements:
```powershell
cd server
npm run seed
```

### Step 3: Start Development Servers
Open two terminal windows:

**Terminal 1 (Backend Server):**
```powershell
cd server
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```powershell
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 9. Pre-Configured Demo Accounts (For Viva & Evaluation)

| Role | Email Address | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Admin / TPO** | `admin@campushire.edu` | `Admin@123` | Full administrative control, analytics, drive & interview scheduling |
| **Student (Eligible)** | `student@campushire.edu` | `Student@123` | Active CSE candidate, 8.75 CGPA, sample uploaded resume, full drive access |
| **Student (Placed)** | `aarav.sharma@college.edu` | `Student@123` | Placed candidate, offers displayed, CTC tracking |

> [!TIP]
> The login screen contains **"Fill Student"** and **"Fill Admin"** quick-fill buttons for fast, single-click demonstration during examiner evaluation.

---

## 10. Complete REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new candidate student account |
| `POST` | `/api/auth/login` | Public | Authenticate student/admin & obtain JWT |
| `POST` | `/api/auth/firebase-sync` | Public | Sync Firebase authenticated user with MongoDB |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile & linked student record |

### Students (`/api/students`)
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/students/profile` | Student | Retrieve academic profile, CGPA, backlogs, & resume |
| `PUT` | `/api/students/profile` | Student | Update contact info, skills, projects, certifications |

### Recruitment Drives & Eligibility (`/api/drives`)
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/drives` | Public/Auth | List recruitment drives (supports search & filter) |
| `GET` | `/api/drives/:id` | Public/Auth | Retrieve drive specifications, rounds, & package |
| `GET` | `/api/drives/:id/eligibility` | Student | Evaluate student eligibility with detailed breakdown |
| `POST` | `/api/drives` | Admin | Create a new campus recruitment drive |
| `PUT` | `/api/drives/:id` | Admin | Update drive details, deadline, or status |

### Applications (`/api/applications`)
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/applications` | Student | Apply to an eligible recruitment drive |
| `GET` | `/api/applications/my` | Student | View candidate application history & stages |
| `GET` | `/api/admin/applications` | Admin | View all student applications across college drives |
| `PUT` | `/api/admin/applications/:id/status` | Admin | Advance candidate application pipeline stage |

### Resume Studio & ATS Matching (`/api/resumes`)
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/resumes/upload` | Student | Upload/replace PDF resume (max 5MB) |
| `GET` | `/api/resumes/my` | Student | Retrieve active primary resume details |
| `DELETE` | `/api/resumes/:id` | Student (Owner) | Remove resume and unlink from profile |
| `POST` | `/api/resumes/test` | Student | Run deterministic ATS score evaluation |
| `POST` | `/api/resumes/match/:driveId` | Student | Match active resume against specific drive JD |
| `GET` | `/api/resumes/test-results` | Student | Retrieve resume evaluation history |

### Interviews (`/api/interviews`)
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/interviews/my` | Student | Retrieve candidate interview schedule |
| `GET` | `/api/admin/interviews` | Admin | View all scheduled interviews across drives |
| `POST` | `/api/interviews` | Admin | Schedule an interview round for a student |
| `PUT` | `/api/interviews/:id` | Admin | Update interview feedback & clearance status |

### Results & Analytics (`/api/results`, `/api/admin/analytics`)
| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/results/my` | Student | View personal placement results & offers |
| `POST` | `/api/results` | Admin | Publish selection results (syncs placed status) |
| `GET` | `/api/admin/analytics/overview` | Admin | Comprehensive placement metrics & KPIs |
| `GET` | `/api/admin/analytics/branches` | Admin | Branch-wise placement counts & percentages |
| `GET` | `/api/admin/analytics/companies` | Admin | Company-wise applications & offers |

---

## 11. Automated Testing & Verification Suite

CampusHire includes automated integration test suites validating all phases:

```powershell
# Run the complete master system audit (55 assertions)
cd server
npm run audit

# Run individual test suites
node scripts/testAuth.js
node scripts/testEligibility.js
node scripts/testRecruitmentApplications.js
node scripts/testResumeManagement.js
node scripts/testResumeAnalysis.js
node scripts/testJobSpecificResumeMatching.js
node scripts/testInterviews.js
node scripts/testPlacementResults.js
node scripts/testPlacementAnalytics.js

# Test Frontend Production Build
cd ../client
npm run build
```

---

## 12. Troubleshooting & Common Questions

1. **Port 5000 or 5173 is already in use:**
   - On Windows: Run `netstat -ano | findstr :5000` and `taskkill /PID <PID> /F`.
   - On Linux/Mac: Run `lsof -i :5000` and `kill -9 <PID>`.

2. **MongoDB Atlas Connection Timeout:**
   - Go to MongoDB Atlas Console → **Network Access** → Click **Add IP Address** → Choose **Allow access from anywhere (`0.0.0.0/0`)**.

3. **Cannot upload PDF resumes:**
   - Resumes must be genuine PDF files under 5MB. Scanned image-only PDFs will fail the text extraction layer.

4. **Peer student data visibility:**
   - CampusHire implements strict data isolation: students can never query peer applications, peer interviews, peer resumes, or peer placement results. Attempts return HTTP `403 Forbidden`.

---

## 13. Deep-Dive Documentation Index

For detailed technical specifications, refer to the documents in the `docs/` directory:

- 🏗️ [docs/architecture.md](docs/architecture.md) – Layered architecture, ER diagrams, RBAC matrix, and security design.
- 🍃 [docs/database.md](docs/database.md) – Comprehensive schema and constraint documentation for all 14 Mongoose collections.
- 📡 [docs/api.md](docs/api.md) – Complete REST API reference with sample request/response payloads.
- 🧪 [docs/testing.md](docs/testing.md) – Test suite breakdown (55/55 passed) and 5-minute viva demonstration script.
- ☁️ [docs/integrations.md](docs/integrations.md) – Cloud setup guide for MongoDB Atlas, Firebase Authentication, Storage, and Gemini AI.

