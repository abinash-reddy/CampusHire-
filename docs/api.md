# CampusHire – Complete REST API Specification

> **Base URL:** `http://localhost:5000/api`  
> **Format:** Standard JSON (`Content-Type: application/json`)  
> **Authentication:** HTTP Bearer Token (`Authorization: Bearer <jwt_or_firebase_token>`)

---

## 1. Authentication APIs (`/api/auth`)

### Register Student
- **Endpoint:** `POST /api/auth/register`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "name": "Aarav Sharma",
    "email": "aarav@college.edu",
    "password": "Password@123",
    "rollNumber": "21CS001",
    "department": "CSE",
    "batchYear": 2026,
    "cgpa": 8.5
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "success": true,
    "message": "Student registration successful",
    "data": {
      "user": { "_id": "...", "name": "Aarav Sharma", "email": "aarav@college.edu", "role": "student" },
      "student": { "_id": "...", "rollNumber": "21CS001", "department": "CSE", "cgpa": 8.5 },
      "token": "eyJhbGciOiJIUzI1NiIsIn..."
    }
  }
  ```

### User Login
- **Endpoint:** `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "student@campushire.edu",
    "password": "Student@123"
  }
  ```
- **Response:** `200 OK`

### Firebase Identity Sync
- **Endpoint:** `POST /api/auth/firebase-sync`
- **Access:** Public (Requires Firebase ID Token)
- **Request Body:**
  ```json
  {
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
    "name": "Candidate Name",
    "rollNumber": "21CS045"
  }
  ```
- **Response:** `200 OK`

### Current User Profile
- **Endpoint:** `GET /api/auth/me`
- **Access:** Authenticated (Student & Admin)
- **Response:** `200 OK`

---

## 2. Student Profile APIs (`/api/students`)

### Get Current Student Profile
- **Endpoint:** `GET /api/students/profile`
- **Access:** Student
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "rollNumber": "21CS001",
      "department": "CSE",
      "batchYear": 2026,
      "cgpa": 8.75,
      "activeBacklogs": 0,
      "skills": ["JavaScript", "React", "Node.js", "MongoDB"],
      "placementStatus": "Unplaced",
      "currentHighestCtc": 0,
      "activeResume": { "_id": "...", "fileName": "Resume.pdf" }
    }
  }
  ```

### Update Student Profile
- **Endpoint:** `PUT /api/students/profile`
- **Access:** Student
- **Request Body:**
  ```json
  {
    "phone": "+91 9876543210",
    "skills": ["React", "Express.js", "MongoDB", "Docker"],
    "githubUrl": "https://github.com/student",
    "linkedinUrl": "https://linkedin.com/in/student"
  }
  ```
- **Response:** `200 OK`

---

## 3. Recruitment Drives & Eligibility APIs (`/api/drives`)

### Browse Drives
- **Endpoint:** `GET /api/drives`
- **Access:** Public / Authenticated
- **Query Parameters:** `?status=OPEN&department=CSE&search=Developer&page=1&limit=10`
- **Response:** `200 OK`

### Get Drive Details
- **Endpoint:** `GET /api/drives/:id`
- **Access:** Public / Authenticated
- **Response:** `200 OK`

### Check Eligibility for a Drive
- **Endpoint:** `GET /api/drives/:id/eligibility`
- **Access:** Student
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "isEligible": true,
      "criteria": {
        "cgpa": { "required": 7.0, "actual": 8.75, "passed": true },
        "department": { "allowed": ["CSE", "IT"], "actual": "CSE", "passed": true },
        "backlogs": { "maxAllowed": 0, "actual": 0, "passed": true },
        "batchYear": { "allowed": [2026], "actual": 2026, "passed": true }
      },
      "failedCriteria": [],
      "matchedSkills": ["JavaScript", "React", "Node.js"],
      "missingSkills": ["AWS"]
    }
  }
  ```

### Create Recruitment Drive (Admin Only)
- **Endpoint:** `POST /api/drives`
- **Access:** Admin / TPO
- **Request Body:**
  ```json
  {
    "company": "6798e1b12...",
    "jobRole": "Full Stack Developer",
    "jobDescription": "Build modern web services with Node.js and React...",
    "package": 14.5,
    "eligibilityCriteria": {
      "minCgpa": 7.5,
      "allowedDepartments": ["CSE", "IT", "AI&DS"],
      "maxBacklogs": 0,
      "batchYears": [2026]
    },
    "applicationDeadline": "2026-10-15T23:59:59.000Z"
  }
  ```
- **Response:** `201 Created`

---

## 4. Application Tracking APIs (`/api/applications`)

### Apply to a Drive
- **Endpoint:** `POST /api/applications`
- **Access:** Student (Requires eligibility check to pass)
- **Request Body:**
  ```json
  {
    "recruitmentDrive": "6798e1b12..."
  }
  ```
- **Response:** `201 Created`

### View My Applications
- **Endpoint:** `GET /api/applications/my`
- **Access:** Student
- **Response:** `200 OK`

### View All Applications (Admin)
- **Endpoint:** `GET /api/admin/applications`
- **Access:** Admin / TPO
- **Query Parameters:** `?driveId=...&status=APPLIED&page=1&limit=25`
- **Response:** `200 OK`

### Update Application Pipeline Status
- **Endpoint:** `PUT /api/admin/applications/:id/status`
- **Access:** Admin / TPO
- **Request Body:**
  ```json
  {
    "status": "SHORTLISTED",
    "note": "Candidate met technical profile criteria"
  }
  ```
- **Response:** `200 OK`

---

## 5. Resume Management & ATS APIs (`/api/resumes`)

### Upload PDF Resume
- **Endpoint:** `POST /api/resumes/upload`
- **Access:** Student
- **Content-Type:** `multipart/form-data`
- **Body:** `file: <resume.pdf>` (Max 5MB)
- **Response:** `201 Created`

### View Active Resume
- **Endpoint:** `GET /api/resumes/my`
- **Access:** Student
- **Response:** `200 OK`

### Run Deterministic ATS Test
- **Endpoint:** `POST /api/resumes/test`
- **Access:** Student
- **Response:** `201 Created`
  ```json
  {
    "success": true,
    "data": {
      "overallScore": 82,
      "sectionScores": {
        "contact": 100,
        "education": 90,
        "skills": 85,
        "projects": 80,
        "experience": 75
      },
      "detectedSkills": ["JavaScript", "React", "Node.js", "Express", "MongoDB", "Git"],
      "missingSections": [],
      "suggestions": ["Include quantified metrics in project bullet points (e.g. 'reduced latency by 20%')"]
    }
  }
  ```

### Match Resume Against a Job Drive
- **Endpoint:** `POST /api/resumes/match/:driveId`
- **Access:** Student
- **Response:** `201 Created`
  ```json
  {
    "success": true,
    "data": {
      "matchPercentage": 85,
      "matchedSkills": ["JavaScript", "React", "Node.js"],
      "missingSkills": ["Docker", "AWS"],
      "matchedKeywords": ["REST API", "Database", "Unit Testing"],
      "suggestions": ["Add Docker containerization experience to align with cloud requirements"]
    }
  }
  ```

---

## 6. Interview Management APIs (`/api/interviews`)

### View Student Interview Schedule
- **Endpoint:** `GET /api/interviews/my`
- **Access:** Student
- **Response:** `200 OK`

### Schedule Interview Round (Admin)
- **Endpoint:** `POST /api/interviews`
- **Access:** Admin / TPO
- **Request Body:**
  ```json
  {
    "student": "6798e2c...",
    "recruitmentDrive": "6798e1b...",
    "roundName": "Round 1: Technical Interview",
    "scheduledDate": "2026-10-05T00:00:00.000Z",
    "scheduledTime": "10:30 AM",
    "mode": "Online",
    "meetingLink": "https://meet.google.com/xyz-abcd-efg"
  }
  ```
- **Response:** `201 Created`

---

## 7. Results & Placement Analytics APIs

### Publish Placement Result (Admin)
- **Endpoint:** `POST /api/results`
- **Access:** Admin / TPO
- **Request Body:**
  ```json
  {
    "student": "6798e2c...",
    "recruitmentDrive": "6798e1b...",
    "company": "6798e0a...",
    "jobRole": "Software Development Engineer",
    "package": 16.5,
    "status": "SELECTED"
  }
  ```
- **Response:** `201 Created` (Automatically marks student profile as `"Placed"`)

### Get Placement Overview Analytics
- **Endpoint:** `GET /api/admin/analytics/overview`
- **Access:** Admin / TPO
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "totalStudents": 150,
      "registeredStudents": 142,
      "totalCompanies": 24,
      "activeRecruitmentDrives": 8,
      "totalApplications": 320,
      "selectedStudents": 85,
      "placementRate": 56.67
    }
  }
  ```

### Branch-wise Analytics
- **Endpoint:** `GET /api/admin/analytics/branches`
- **Access:** Admin / TPO
- **Response:** `200 OK`
