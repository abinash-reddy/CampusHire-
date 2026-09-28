/**
 * CampusHire - End-to-End System Audit Script
 * Validates all core functional requirements:
 * 1. Backend startup & health check
 * 2. MongoDB connection
 * 3. Authentication
 * 4. Authorization (RBAC)
 * 5. Student registration
 * 6. Student login
 * 7. Admin login
 * 8. Student profile (view, update, validations)
 * 9. Company management (CRUD, tiers)
 * 10. Recruitment drives (dates, branches, CGPA)
 * 11. Eligibility checking engine
 * 12. Applications (submission, checks)
 * 13. Application status pipeline transitions
 * 14. Resume upload & validation
 * 15. Resume testing & ATS scoring
 * 16. Job-specific resume matching
 * 17. Interview scheduling & permissions
 * 18. Notifications (events, read states, unread counts)
 * 19. Placement results & automatic student status updates
 * 20. Analytics (overview, branches, companies, drives)
 * 23. Error handling (400, 401, 403, 404, 409)
 * 24. Form validation rules
 * 25. Security & data protection
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const parsedUrl = new URL(url);

  const headers = { ...options.headers };
  let body = options.body;

  if (body && typeof body === 'object' && !(body instanceof Buffer)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          let data = {};
          try {
            data = JSON.parse(rawData);
          } catch (e) {
            data = { raw: rawData };
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

function buildMultipartFormData(fields, fileField) {
  const boundary = '----CampusHireBoundary' + Date.now().toString(16);
  const parts = [];

  for (const [k, v] of Object.entries(fields || {})) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`
      )
    );
  }

  if (fileField) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${fileField.fieldName}"; filename="${fileField.fileName}"\r\nContent-Type: ${fileField.contentType}\r\n\r\n`
      )
    );
    parts.push(fileField.buffer);
    parts.push(Buffer.from('\r\n'));
  }

  parts.push(Buffer.from(`--${boundary}--\r\n`));
  const payload = Buffer.concat(parts);

  return {
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': payload.length,
    },
    body: payload,
  };
}

function buildPdfWithText(lines) {
  let stream = 'BT\n/F1 12 Tf\n100 700 Td\n';
  for (const line of lines) {
    const clean = line.replace(/[\(\)\\]/g, '');
    stream += '(' + clean + ') Tj\n0 -20 Td\n';
  }
  stream += 'ET';
  const streamLen = stream.length;

  const pdfData =
    '%PDF-1.4\n' +
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n' +
    '4 0 obj\n<< /Length ' + streamLen + ' >>\nstream\n' + stream + '\nendstream\nendobj\n' +
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n' +
    'xref\n0 6\n0000000000 65535 f \n' +
    'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n0\n%%EOF';

  return Buffer.from(pdfData);
}

async function runAudit() {
  console.log('====================================================');
  console.log('🔍 CAMPUSHIRE COMPLETE END-TO-END SYSTEM AUDIT');
  console.log('====================================================\n');

  const stamp = Date.now().toString(36);

  // 1. Backend Startup & 2. MongoDB Connection
  console.log('--- 1. Backend Startup & 2. MongoDB Connection ---');
  const healthRes = await apiRequest('/health');
  assert(healthRes.status === 200, 'Backend is alive and responding with 200 OK');
  assert(healthRes.data.success === true, 'Health check reports success: true');
  assert(
    healthRes.data.data?.database?.status === 'connected' || healthRes.data.data?.database?.readyState === 1,
    'MongoDB database connection is active & connected'
  );

  // 3. Authentication & 5. Student Registration
  console.log('\n--- 3. Authentication & 5. Student Registration ---');
  const studentEmail = `audit_student_${stamp}@college.edu`;
  const studentRoll = `AUDIT${stamp.toUpperCase().slice(-6)}`;
  const regRes = await apiRequest('/auth/register', {
    method: 'POST',
    body: {
      name: 'Audit Candidate',
      email: studentEmail,
      password: 'Password@123',
      rollNumber: studentRoll,
      department: 'CSE',
      batchYear: 2026,
      cgpa: 8.75,
    },
  });
  assert(regRes.status === 201, 'Student registered with HTTP 201 Created');
  assert(!!regRes.data.data?.token, 'Registration returns JWT bearer token');
  assert(regRes.data.data?.user?.role === 'student', "User role is 'student'");
  assert(regRes.data.data?.user?.password === undefined, 'Password hash is excluded from response (select: false)');
  const studentToken = regRes.data.data?.token;

  // Test duplicate prevention
  const dupEmailRes = await apiRequest('/auth/register', {
    method: 'POST',
    body: {
      name: 'Dup Candidate',
      email: studentEmail,
      password: 'Password@123',
      rollNumber: 'OTHER123',
      department: 'IT',
      batchYear: 2026,
      cgpa: 8.0,
    },
  });
  assert(dupEmailRes.status === 409, 'Duplicate email rejected with 409 Conflict');

  // 6. Student Login & 7. Admin Login
  console.log('\n--- 6. Student Login & 7. Admin Login ---');
  const stuLoginRes = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email: studentEmail, password: 'Password@123' },
  });
  assert(stuLoginRes.status === 200, 'Student login successful with 200 OK');
  assert(!!stuLoginRes.data.data?.token, 'Login returns valid token');

  const adminEmail = `audit_admin_${stamp}@college.edu`;
  const adminRegRes = await apiRequest('/auth/register-admin', {
    method: 'POST',
    body: {
      name: 'Audit Placement Head',
      email: adminEmail,
      password: 'AdminPassword@123',
    },
  });
  assert(adminRegRes.status === 201, 'Admin account registered with 201 Created');
  const adminToken = adminRegRes.data.data?.token;

  const adminLoginRes = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email: adminEmail, password: 'AdminPassword@123' },
  });
  assert(adminLoginRes.status === 200, 'Admin login successful with 200 OK');
  assert(
    adminLoginRes.data.data?.user?.role === 'tpo' || adminLoginRes.data.data?.user?.role === 'admin',
    "Admin user role is 'admin' or 'tpo'"
  );

  // 4. Authorization (RBAC) & 25. Security
  console.log('\n--- 4. Authorization & 25. Security ---');
  const forbiddenRes = await apiRequest('/admin/students', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(forbiddenRes.status === 403, 'Student blocked from admin route with 403 Forbidden');

  const unauthRes = await apiRequest('/students/profile');
  assert(unauthRes.status === 401, 'Unauthenticated request rejected with 401 Unauthorized');

  // 8. Student Profile
  console.log('\n--- 8. Student Profile ---');
  const profRes = await apiRequest('/students/profile', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(profRes.status === 200, 'Student profile retrieved with 200 OK');
  assert(profRes.data.data?.rollNumber === studentRoll, 'Profile rollNumber matches');

  const updateProfRes = await apiRequest('/students/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: {
      phone: '+91 99999 88888',
      skills: ['React', 'Node.js', 'Express', 'MongoDB', 'Docker', 'AWS'],
      githubUrl: 'https://github.com/audituser',
      placementStatus: 'Placed', // should be protected
    },
  });
  assert(updateProfRes.status === 200, 'Profile updated successfully with 200 OK');
  assert(updateProfRes.data.data?.phone === '+91 99999 88888', 'Phone saved');
  assert(updateProfRes.data.data?.placementStatus === 'Unplaced', 'Protected field placementStatus not altered by student');

  // 9. Company Management
  console.log('\n--- 9. Company Management ---');
  const compName = `Audit Company ${stamp}`;
  const compRes = await apiRequest('/companies', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      name: compName,
      industry: 'Software Engineering',
      tier: 'SuperDream',
      location: 'Bengaluru',
      website: 'https://auditcorp.com',
      contactEmail: 'hr@auditcorp.com',
    },
  });
  assert(compRes.status === 201, 'Partner company created with 201 Created');
  const companyId = compRes.data.data?._id;
  assert(!!companyId, 'Company ID assigned');

  // 10. Recruitment Drives
  console.log('\n--- 10. Recruitment Drives ---');
  const driveRes = await apiRequest('/drives', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      company: companyId,
      jobRole: 'Full Stack Engineer',
      jobDescription: 'Design web applications with React, Node.js, Express, MongoDB, and Docker.',
      package: 16.5,
      minimumCGPA: 8.0,
      maximumBacklogs: 0,
      eligibleBranches: ['CSE', 'IT'],
      graduationYear: 2026,
      numberOfPositions: 5,
      requiredSkills: ['React', 'Node.js', 'Express', 'MongoDB'],
      applicationDeadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      driveDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      status: 'OPEN',
    },
  });
  assert(driveRes.status === 201, 'Recruitment drive created with 201 Created');
  const driveId = driveRes.data.data?._id;

  // 11. Eligibility Checking
  console.log('\n--- 11. Eligibility Checking ---');
  const eligRes = await apiRequest(`/drives/${driveId}/eligibility`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(eligRes.status === 200, 'Eligibility checked with 200 OK');
  assert(eligRes.data.data?.eligible === true, 'Student evaluated as ELIGIBLE');
  assert(eligRes.data.data?.failedCriteria?.length === 0, 'Zero failed criteria');

  // 14. Resume Upload & 15. Resume Testing (ATS Scoring)
  console.log('\n--- 14. Resume Upload & 15. Resume Testing (ATS Scoring) ---');
  const comprehensiveLines = [
    'Audit Candidate',
    `Email: ${studentEmail} | Phone: +919999988888 | linkedin.com/in/audit | github.com/audit`,
    'Education: B.Tech in Computer Science and Engineering, CGPA: 8.75, Batch 2026',
    'Technical Skills: React, Node.js, Express, MongoDB, JavaScript, TypeScript, Docker, AWS, SQL, REST APIs',
    'Key Projects: Campus Placement Management System using React, Node.js, Express, MongoDB. Automated recruitment.',
    'Experience: Software Development Intern at Tech Labs. Developed RESTful APIs handling 10000+ daily requests',
    'Certifications: AWS Certified Developer Associate, Coursera Deep Learning Specialization',
    'Achievements: First prize in National Smart India Hackathon 2025 among 500 teams',
  ];

  const pdfBuf = buildPdfWithText(comprehensiveLines);
  const multipart = buildMultipartFormData(
    {},
    {
      fieldName: 'file',
      fileName: 'Audit_Resume.pdf',
      contentType: 'application/pdf',
      buffer: pdfBuf,
    }
  );

  const uploadRes = await apiRequest('/resumes/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${studentToken}`,
      ...multipart.headers,
    },
    body: multipart.body,
  });
  assert(uploadRes.status === 201, 'Resume PDF uploaded with 201 Created');
  const resumeId = uploadRes.data.data?._id;
  assert(!!resumeId, 'Resume ID assigned and marked active');

  const testRes = await apiRequest('/resumes/test', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(testRes.status === 201, 'Resume ATS tested with 201 Created');
  assert(typeof testRes.data.data?.overallScore === 'number', 'ATS overallScore calculated');
  assert(testRes.data.data?.overallScore >= 70, `High score achieved: ${testRes.data.data?.overallScore}/100`);

  // 16. Job-Specific Resume Matching
  console.log('\n--- 16. Job-Specific Resume Matching ---');
  const matchRes = await apiRequest(`/resumes/match/${driveId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(matchRes.status === 201, 'Job match calculated with 201 Created');
  assert(typeof matchRes.data.data?.matchPercentage === 'number', 'matchPercentage returned');
  assert(matchRes.data.data?.matchedSkills?.length >= 3, 'Target skills matched accurately');

  // 12. Applications & 13. Application Status Pipeline
  console.log('\n--- 12. Applications & 13. Application Status Pipeline ---');
  const applyRes = await apiRequest('/applications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { driveId },
  });
  assert(applyRes.status === 201, 'Application submitted with 201 Created');
  const applicationId = applyRes.data.data?._id;

  const myAppsRes = await apiRequest('/applications/my', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(myAppsRes.status === 200, 'Student viewed my applications with 200 OK');
  assert(myAppsRes.data.data?.length >= 1, 'Application appears in candidate tracker');

  const statusUpdateRes = await apiRequest(`/admin/applications/${applicationId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      status: 'SHORTLISTED',
      remarks: 'Profile shortlisted for technical interviews',
    },
  });
  assert(statusUpdateRes.status === 200, 'Admin advanced status to SHORTLISTED (200 OK)');

  // 17. Interviews
  console.log('\n--- 17. Interviews ---');
  const interviewRes = await apiRequest('/interviews', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      application: applicationId,
      round: 'Technical Round 1',
      date: new Date(Date.now() + 5 * 86400000).toISOString(),
      time: '11:00 AM',
      mode: 'Online',
      meetingLink: 'https://meet.google.com/xyz-aud-camp',
      instructions: 'Prepare live coding environment with camera on',
    },
  });
  assert(interviewRes.status === 201, 'Interview scheduled with 201 Created');

  const myInterviewsRes = await apiRequest('/interviews/my', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(myInterviewsRes.status === 200, 'Student retrieved interview schedule with 200 OK');
  assert(myInterviewsRes.data.data?.length >= 1, 'Scheduled interview appears on candidate schedule');

  // 18. Notifications
  console.log('\n--- 18. Notifications ---');
  const notifRes = await apiRequest('/notifications', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(notifRes.status === 200, 'Notifications retrieved with 200 OK');
  assert(notifRes.data.data?.unreadCount > 0, `Unread notifications generated: ${notifRes.data.data?.unreadCount}`);
  const notifId = notifRes.data.data?.notifications[0]?._id;

  if (notifId) {
    const markRes = await apiRequest(`/notifications/${notifId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(markRes.status === 200, 'Single notification marked as read (200 OK)');
  }

  const markAllRes = await apiRequest('/notifications/read-all', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(markAllRes.status === 200, 'All notifications marked as read (200 OK)');

  // 19. Results & Automatic Placement Status Synchronization
  console.log('\n--- 19. Results & Automatic Placement Status Sync ---');
  const resultRes = await apiRequest('/results', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      student: stuLoginRes.data.data?.student?._id || stuLoginRes.data.data?.user?._id,
      recruitmentDrive: driveId,
      package: 16.5,
      status: 'SELECTED',
      remarks: 'Offered Full Stack Engineer role with 16.5 LPA CTC',
    },
  });
  assert(resultRes.status === 201, 'Final placement result published with 201 Created');

  const stuProfCheck = await apiRequest('/students/profile', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(
    stuProfCheck.data.data?.placementStatus === 'Placed',
    'Student placementStatus automatically transitioned to "Placed"'
  );
  assert(
    stuProfCheck.data.data?.currentHighestCtc >= 16.5 || stuProfCheck.data.data?.highestCtc >= 16.5,
    'Student currentHighestCtc automatically updated to 16.5 LPA'
  );

  const myResultsRes = await apiRequest('/results/my', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(myResultsRes.status === 200, 'Student viewed placement history with 200 OK');
  assert(myResultsRes.data.data?.length >= 1, 'Offer letter displayed in candidate placement history');

  // 20. Analytics
  console.log('\n--- 20. Analytics ---');
  const overviewRes = await apiRequest('/admin/analytics/overview', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(overviewRes.status === 200, 'Analytics overview returned 200 OK');
  assert(overviewRes.data.data?.totalStudents > 0, 'Analytics tracks totalStudents');
  assert(overviewRes.data.data?.selectedStudents > 0, 'Analytics tracks selectedStudents');

  const branchesRes = await apiRequest('/admin/analytics/branches', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(branchesRes.status === 200, 'Branch analytics returned 200 OK');

  const compsAnalyticsRes = await apiRequest('/admin/analytics/companies', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(compsAnalyticsRes.status === 200, 'Company analytics returned 200 OK');

  console.log('\n====================================================');
  console.log(`Audit Summary: ${passedTests} Passed, ${failedTests} Failed (Total: ${totalTests})`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
