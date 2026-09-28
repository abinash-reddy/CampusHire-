# CampusHire – Database Schema & Collections Reference

> **Database System:** MongoDB Atlas / MongoDB Compass  
> **Object Document Mapper (ODM):** Mongoose v8.9.5  
> **Total Managed Collections:** 14 Collections

---

## 1. `users` Collection ([models/User.js](file:///C:/Users/Hp/Desktop/4TH%20YR%201ST%20TERM/BTWA/CampusHire/server/models/User.js))

Stores system credentials, login metadata, and role assignments.

| Field | Type | Constraints & Defaults | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key (Auto) | Unique user identifier |
| `name` | `String` | Required, Trim, Min: 2, Max: 100 | Full name of user |
| `email` | `String` | Required, Unique, Lowercase, Indexed | College email address |
| `password` | `String` | Select: false, Min: 6 | Bcrypt hashed password (optional if Firebase Auth used) |
| `firebaseUid` | `String` | Unique, Sparse, Indexed | Unique UID from Firebase Authentication |
| `role` | `String` | Enum: `['student', 'tpo', 'admin']`, Default: `'student'` | Access control role |
| `student` | `ObjectId` | Ref: `'Student'`, Default: `null` | Associated student academic profile reference |
| `isActive` | `Boolean` | Default: `true` | Account active state |
| `lastLogin` | `Date` | Default: `null` | Timestamp of most recent session |
| `createdAt` | `Date` | Timestamp (Auto) | Record creation timestamp |
| `updatedAt` | `Date` | Timestamp (Auto) | Record modification timestamp |

---

## 2. `students` Collection ([models/Student.js](file:///C:/Users/Hp/Desktop/4TH%20YR%201ST%20TERM/BTWA/CampusHire/server/models/Student.js))

Stores student academic records, verification attributes, verified skills, and placement status.

| Field | Type | Constraints & Defaults | Description |
| :--- | :--- | :--- | :--- |
| `user` | `ObjectId` | Ref: `'User'`, Required, Unique, Indexed | Linked User account |
| `rollNumber` | `String` | Required, Unique, Uppercase, Trim, Indexed | College roll / register number |
| `department` | `String` | Enum: `['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI&DS', 'OTHER']`, Indexed | Academic department |
| `batchYear` | `Number` | Required, Min: 2020, Max: 2100, Indexed | Graduation year |
| `cgpa` | `Number` | Required, Min: 0, Max: 10.0 | Cumulative Grade Point Average |
| `tenthPercentage` | `Number` | Min: 0, Max: 100, Default: `null` | 10th standard percentage |
| `twelfthOrDiplomaPercentage`| `Number` | Min: 0, Max: 100, Default: `null` | 12th standard percentage |
| `activeBacklogs` | `Number` | Default: 0, Min: 0 | Current unresolved backlogs |
| `historyBacklogs` | `Number` | Default: 0, Min: 0 | Total historical backlogs |
| `skills` | `[String]` | Default: `[]` | Technical competencies |
| `programmingLanguages` | `[String]` | Default: `[]` | Programming proficiencies |
| `projects` | `[Object]` | Title (Req), Description, TechStack, URLs | Key software projects |
| `certifications` | `[Object]` | Name (Req), Issuer, IssueDate, CredentialUrl | Professional certifications |
| `githubUrl` | `String` | Default: `''` | GitHub profile link |
| `linkedinUrl` | `String` | Default: `''` | LinkedIn profile link |
| `phone` | `String` | Default: `''` | Contact number |
| `placementStatus` | `String` | Enum: `['Unplaced', 'Placed', 'Higher Studies', 'Opted Out']`, Indexed | Placement status |
| `currentHighestCtc` | `Number` | Default: 0, Min: 0 | Highest confirmed offer in LPA |
| `activeResume` | `ObjectId` | Ref: `'Resume'`, Default: `null` | Currently active resume document |

---

## 3. `companies` Collection ([models/Company.js](file:///C:/Users/Hp/Desktop/4TH%20YR%201ST%20TERM/BTWA/CampusHire/server/models/Company.js))

Stores corporate recruiting partner details.

| Field | Type | Constraints & Defaults | Description |
| :--- | :--- | :--- | :--- |
| `name` | `String` | Required, Unique, Trim, Indexed | Corporate company name |
| `website` | `String` | Trim | Official website URL |
| `tier` | `String` | Enum: `['Tier 1', 'Tier 2', 'Tier 3', 'Startup']`, Default: `'Tier 2'` | Company recruitment tier |
| `industry` | `String` | Default: `'Information Technology'` | Industry sector |
| `description` | `String` | Default: `''` | Company background |
| `contactPerson` | `Object` | Name, Email, Phone, Designation | HR coordinator contact |
| `isActive` | `Boolean` | Default: `true` | Partnership status |

---

## 4. `recruitmentdrives` Collection ([models/RecruitmentDrive.js](file:///C:/Users/Hp/Desktop/4TH%20YR%201ST%20TERM/BTWA/CampusHire/server/models/RecruitmentDrive.js))

Stores hiring drives, job descriptions, rounds, and eligibility thresholds.

| Field | Type | Constraints & Defaults | Description |
| :--- | :--- | :--- | :--- |
| `company` | `ObjectId` | Ref: `'Company'`, Required, Indexed | Sponsoring company |
| `jobRole` | `String` | Required, Trim, Indexed | Job designation offered |
| `jobDescription`| `String` | Required | Comprehensive JD |
| `package` | `Number` | Required, Min: 0 | CTC package in LPA |
| `eligibilityCriteria` | `Object` | minCgpa, allowedDepartments, maxBacklogs, batchYears | Deterministic eligibility constraints |
| `rounds` | `[Object]` | roundNumber, roundName, description | Drive round pipeline |
| `applicationDeadline`| `Date` | Required | Cutoff date for applications |
| `status` | `String` | Enum: `['UPCOMING', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']`, Indexed | Drive lifecycle state |

---

## 5. `applications` Collection ([models/Application.js](file:///C:/Users/Hp/Desktop/4TH%20YR%201ST%20TERM/BTWA/CampusHire/server/models/Application.js))

Tracks student applications and their status progression.

| Field | Type | Constraints & Defaults | Description |
| :--- | :--- | :--- | :--- |
| `student` | `ObjectId` | Ref: `'Student'`, Required, Indexed | Candidate applicant |
| `recruitmentDrive` | `ObjectId` | Ref: `'RecruitmentDrive'`, Required, Indexed | Target drive |
| `status` | `String` | Enum: `['APPLIED', 'SHORTLISTED', 'ASSESSMENT', 'TECHNICAL_INTERVIEW', 'HR_INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN']` | Pipeline stage |
| `resume` | `ObjectId` | Ref: `'Resume'` | Resume snapshot at time of application |
| `statusHistory` | `[Object]` | status, timestamp, changedBy, note | Audit trail of status transitions |

*Compound Index:* `{ student: 1, recruitmentDrive: 1 }` (Unique — prevents duplicate applications).

---

## 6. `resumes` Collection ([models/Resume.js](file:///C:/Users/Hp/Desktop/4TH%20YR%201ST%20TERM/BTWA/CampusHire/server/models/Resume.js))

Stores uploaded primary resumes and extracted attributes.

| Field | Type | Constraints & Defaults | Description |
| :--- | :--- | :--- | :--- |
| `student` | `ObjectId` | Ref: `'Student'`, Required, Indexed | Owning student |
| `fileName` | `String` | Required, Trim | Original file name |
| `filePath` | `String` | Default: `''` | Local storage disk path |
| `fileUrl` | `String` | Default: `''` | Firebase cloud storage URL |
| `storageProvider` | `String` | Enum: `['local', 'firebase']`, Default: `'local'` | Storage driver |
| `fileSize` | `Number` | Default: 0 | File size in bytes |
| `extractedText` | `String` | Default: `''` | Extracted plain text layer |
| `atsScore` | `Number` | Min: 0, Max: 100, Default: 0 | Computed overall ATS score |
| `isPrimary` | `Boolean` | Default: `true` | Active placement resume flag |

---

## 7. `resumetests` Collection ([models/ResumeTest.js](file:///C:/Users/Hp/Desktop/4TH%20YR%201ST%20TERM/BTWA/CampusHire/server/models/ResumeTest.js))

Stores deterministic ATS scoring evaluations and job-matching reports.

| Field | Type | Description |
| :--- | :--- | :--- |
| `student` | `ObjectId` (Ref: `'Student'`) | Candidate reference |
| `resume` | `ObjectId` (Ref: `'Resume'`) | Resume tested |
| `recruitmentDrive`| `ObjectId` (Ref: `'RecruitmentDrive'`) | Job drive (for job matching) |
| `testType` | Enum: `['GENERAL', 'JOB_MATCH']` | Test category |
| `overallScore` | `Number` (0–100) | ATS score / match percentage |
| `sectionScores` | `Object` | Subscores: contact, education, skills, projects, experience, certs |
| `detectedSkills`| `[String]` | Matched dictionary skills |
| `missingSkills` | `[String]` | Skills required by drive but absent in resume |
| `matchedKeywords`| `[String]` | Matched JD keywords |
| `suggestions` | `[String]` | Actionable improvement recommendations |

---

## 8. `resumeversions` Collection ([models/ResumeVersion.js](file:///C:/Users/Hp/Desktop/4TH%20YR%201ST%20TERM/BTWA/CampusHire/server/models/ResumeVersion.js))

Maintains full version history of student resume updates.

| Field | Type | Description |
| :--- | :--- | :--- |
| `student` | `ObjectId` (Ref: `'Student'`) | Candidate reference |
| `resume` | `ObjectId` (Ref: `'Resume'`) | Parent resume reference |
| `versionNumber` | `Number` (Default: 1) | Incremental version number |
| `fileName` | `String` | File name for this iteration |
| `storageProvider`| Enum: `['local', 'firebase']` | Storage location |
| `isCurrent` | `Boolean` | True if this is the active version |
| `changeNotes` | `String` | Optional student edit notes |

---

## 9. `interviews` Collection ([models/Interview.js](file:///C:/Users/Hp/Desktop/4TH%20YR%201ST%20TERM/BTWA/CampusHire/server/models/Interview.js))

Coordinates individual interview rounds.

| Field | Type | Description |
| :--- | :--- | :--- |
| `student` | `ObjectId` (Ref: `'Student'`) | Interviewed candidate |
| `recruitmentDrive`| `ObjectId` (Ref: `'RecruitmentDrive'`) | Associated drive |
| `company` | `ObjectId` (Ref: `'Company'`) | Hiring company |
| `roundName` | `String` | Round title (e.g. `'Round 1: Technical'`, `'HR Interview'`) |
| `scheduledDate` | `Date` | Scheduled date |
| `scheduledTime` | `String` | Scheduled time (e.g. `'10:00 AM'`) |
| `mode` | Enum: `['Online', 'In-Person', 'Telephonic']` | Interview format |
| `meetingLink` | `String` | Virtual meeting room link (Google Meet/Zoom) |
| `status` | Enum: `['SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'CLEARED', 'REJECTED', 'ABSENT']` | Clearance status |
| `feedback` | `String` | Panelist notes & feedback |

---

## 10. `notifications` Collection ([models/Notification.js](file:///C:/Users/Hp/Desktop/4TH%20YR%201ST%20TERM/BTWA/CampusHire/server/models/Notification.js))

Dispatches system updates and drive alerts to students.

| Field | Type | Description |
| :--- | :--- | :--- |
| `recipient` | `ObjectId` (Ref: `'User'`) | Receiving student/admin |
| `title` | `String` | Notification header |
| `message` | `String` | Notification body |
| `type` | Enum: `['DRIVE', 'APPLICATION', 'INTERVIEW', 'RESULT', 'SYSTEM']` | Categorical badge |
| `isRead` | `Boolean` (Default: `false`) | Read status |

---

## 11. `placementupdates` Collection ([models/PlacementUpdate.js](file:///C:/Users/Hp/Desktop/4TH%20YR%201ST%20TERM/BTWA/CampusHire/server/models/PlacementUpdate.js))

Notice board circulars and announcements.

| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | `String` (Required) | Announcement headline |
| `content` | `String` (Required) | Detailed circular content |
| `category` | Enum: `['Announcement', 'Drive Update', 'Policy', 'Results', 'General']` | Notice category |
| `pinned` | `Boolean` (Default: `false`) | Pinned to top of board |
| `author` | `ObjectId` (Ref: `'User'`) | Posting placement officer |

---

## 12. `results` Collection ([models/Result.js](file:///C:/Users/Hp/Desktop/4TH%20YR%201ST%20TERM/BTWA/CampusHire/server/models/Result.js))

Published final recruitment selections.

| Field | Type | Description |
| :--- | :--- | :--- |
| `student` | `ObjectId` (Ref: `'Student'`) | Selected candidate |
| `recruitmentDrive`| `ObjectId` (Ref: `'RecruitmentDrive'`) | Sponsoring drive |
| `company` | `ObjectId` (Ref: `'Company'`) | Hiring company |
| `jobRole` | `String` | Confirmed job role |
| `package` | `Number` | CTC package (LPA) |
| `status` | Enum: `['SELECTED', 'REJECTED', 'WAITLISTED']` | Result status |
| `resultDate` | `Date` (Default: `Date.now`) | Publication date |

---

## 13. `aiconversations` Collection ([models/AIConversation.js](file:///C:/Users/Hp/Desktop/4TH%20YR%201ST%20TERM/BTWA/CampusHire/server/models/AIConversation.js))

Stores student assistant dialogue history.

| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | `ObjectId` (Ref: `'User'`) | Owning user |
| `student` | `ObjectId` (Ref: `'Student'`) | Student profile |
| `title` | `String` | Conversation topic |
| `messages` | `[Object]` (role, content, timestamp, retrievedData) | Ordered message turns |
| `category` | Enum: `['GENERAL', 'RESUME_ADVICE', 'DRIVE_ELIGIBILITY', 'INTERVIEW_PREP', 'SKILL_DEVELOPMENT']` | Domain focus |

---

## 14. `aianalyses` Collection ([models/AIAnalysis.js](file:///C:/Users/Hp/Desktop/4TH%20YR%201ST%20TERM/BTWA/CampusHire/server/models/AIAnalysis.js))

Caches AI evaluations (resume reviews, skill gaps, interview prep) to prevent repeated API calls.

| Field | Type | Description |
| :--- | :--- | :--- |
| `student` | `ObjectId` (Ref: `'Student'`) | Target candidate |
| `user` | `ObjectId` (Ref: `'User'`) | Requesting user |
| `analysisType` | Enum: `['RESUME_REVIEW', 'JOB_MATCH', 'SKILL_GAP', 'INTERVIEW_PREP', 'TEXT_IMPROVEMENT']` | Evaluation type |
| `overallScore` | `Number` (0–100) | Evaluation score |
| `skillGaps` | `[Object]` (skill, meaning, whatToLearn, preparationOrder, resources) | Skill gap breakdowns |
| `interviewQuestions`| `[Object]` (type, question, context, sampleAnswerStructure) | Targeted questions |
| `isCached` | `Boolean` (Default: `false`) | Cache hit flag |
| `tokensUsed` | `Number` | Quota consumption metrics |
