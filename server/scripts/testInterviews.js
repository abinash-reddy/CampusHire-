const http = require('http');

const API_BASE = 'http://localhost:5000/api';

const makeRequest = (urlPath, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${urlPath}`);
    const postData = body ? JSON.stringify(body) : null;

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData);

    const req = http.request(url, { method, headers }, (res) => {
      let rawData = '';
      res.on('data', (chunk) => (rawData += chunk));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(rawData); } catch (e) { parsed = rawData; }
        resolve({ statusCode: res.statusCode, body: parsed });
      });
    });

    req.on('error', (e) => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
};

const runTests = async () => {
  console.log('====================================================');
  console.log('📅 CampusHire – Phase 13: Interview Management Test Suite');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title} - ${details}`);
      failed++;
    }
  };

  const timestamp = Date.now();

  try {
    // 1. Setup: Admin, Company, Drive, Candidate Student, Peer Student, and Application
    console.log('\n--- 1. Setting Up Test Environment ---');
    const adminReg = await makeRequest('/auth/register-admin', 'POST', {
      name: 'TPO Interview Coordinator',
      email: `tpo_interviews_${timestamp}@college.edu`,
      password: 'AdminPassword123',
      role: 'tpo',
    });
    const adminToken = adminReg.body.data.token;
    assert(adminToken, 'Admin/TPO coordinator registered');

    // Create Company
    const compRes = await makeRequest('/companies', 'POST', {
      companyName: `Oracle Cloud Labs ${timestamp}`,
      industry: 'Enterprise Software & Cloud',
      website: 'https://oracle.example.com',
      location: 'Hyderabad, India',
    }, adminToken);
    const companyId = compRes.body.data._id;

    // Create Recruitment Drive
    const driveRes = await makeRequest('/drives', 'POST', {
      company: companyId,
      jobRole: 'Cloud Infrastructure Associate',
      jobDescription: 'Build enterprise cloud tools and scalable storage services.',
      package: 18.0,
      eligibleBranches: ['CSE', 'IT'],
      minimumCGPA: 7.0,
      maximumBacklogs: 0,
      graduationYear: 2026,
      requiredSkills: ['Java', 'Cloud', 'SQL'],
      applicationDeadline: new Date(Date.now() + 10 * 86400000).toISOString(),
      driveDate: new Date(Date.now() + 15 * 86400000).toISOString(),
    }, adminToken);
    const driveId = driveRes.body.data._id;
    assert(driveId, 'Recruitment drive created');

    // Candidate Student
    const s1Res = await makeRequest('/auth/register', 'POST', {
      name: 'Ananya Sharma',
      email: `ananya_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `CS_${timestamp.toString().slice(-4)}`,
      department: 'CSE',
      batchYear: 2026,
    });
    const s1Token = s1Res.body.data.token;
    await makeRequest('/students/profile', 'PUT', { cgpa: 8.5 }, s1Token);

    // Peer Student
    const s2Res = await makeRequest('/auth/register', 'POST', {
      name: 'Karan Mehra',
      email: `karan_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `IT_${timestamp.toString().slice(-4)}`,
      department: 'IT',
      batchYear: 2026,
    });
    const s2Token = s2Res.body.data.token;
    await makeRequest('/students/profile', 'PUT', { cgpa: 8.2 }, s2Token);

    // Candidate applies to Drive
    const appRes = await makeRequest('/applications', 'POST', { driveId: driveId }, s1Token);
    const applicationId = appRes.body.data._id;
    assert(appRes.statusCode === 201 && applicationId, 'Student applied to recruitment drive');


    // 2. Testing Date and Time Validations on POST /api/interviews
    console.log('\n--- 2. Testing Input & Date/Time Validations ---');
    // Invalid Date
    const invalidDateRes = await makeRequest('/interviews', 'POST', {
      application: applicationId,
      round: 'Technical Interview',
      date: 'not-a-valid-date',
      time: '10:30 AM',
    }, adminToken);
    assert(invalidDateRes.statusCode === 400, 'Invalid date rejected with 400 Bad Request');

    // Invalid Time
    const invalidTimeRes = await makeRequest('/interviews', 'POST', {
      application: applicationId,
      round: 'Technical Interview',
      date: new Date(Date.now() + 5 * 86400000).toISOString(),
      time: 'invalid-time',
    }, adminToken);
    assert(invalidTimeRes.statusCode === 400, 'Invalid time format rejected with 400 Bad Request');

    // Missing Round Name
    const missingRoundRes = await makeRequest('/interviews', 'POST', {
      application: applicationId,
      round: '',
      date: new Date(Date.now() + 5 * 86400000).toISOString(),
      time: '10:00 AM',
    }, adminToken);
    assert(missingRoundRes.statusCode === 400, 'Missing round name rejected with 400 Bad Request');

    // 3. Testing POST /api/interviews (Admin Creates Valid Schedule)
    console.log('\n--- 3. Testing POST /api/interviews (Admin Scheduling) ---');
    const interviewDate = new Date(Date.now() + 3 * 86400000).toISOString();
    const createRes = await makeRequest('/interviews', 'POST', {
      application: applicationId,
      round: 'Technical Round 1 - Problem Solving',
      date: interviewDate,
      time: '10:30 AM',
      mode: 'Online',
      meetingLink: 'https://meet.google.com/abc-interview-test',
      instructions: 'Please be online 10 minutes prior with photo ID card.',
      status: 'SCHEDULED',
    }, adminToken);

    assert(createRes.statusCode === 201, 'POST /api/interviews returns 201 Created');
    const interviewData = createRes.body.data;
    assert(interviewData && interviewData._id, 'Interview schedule record generated with ID');
    assert(interviewData.round === 'Technical Round 1 - Problem Solving', 'Interview round stored accurately');
    assert(interviewData.time === '10:30 AM', 'Interview time stored accurately');
    assert(interviewData.mode === 'Online', 'Mode recorded as Online');
    assert(interviewData.meetingLink === 'https://meet.google.com/abc-interview-test', 'Meeting link recorded accurately');
    assert(interviewData.status === 'SCHEDULED', 'Initial status set to SCHEDULED');
    assert(interviewData.student && (interviewData.student.rollNumber || interviewData.student.user), 'Student details auto-populated');
    assert(interviewData.recruitmentDrive && interviewData.recruitmentDrive.jobRole, 'Drive details auto-populated');


    const interviewId = interviewData._id;

    // Verify Application Status updated to TECHNICAL_INTERVIEW
    const checkAppRes = await makeRequest(`/applications/${applicationId}`, 'GET', null, s1Token);
    assert(checkAppRes.body.data.status === 'TECHNICAL_INTERVIEW', 'Application automatically advanced to TECHNICAL_INTERVIEW');

    // 4. Testing GET /api/interviews/my (Student Viewing Own Interviews)
    console.log('\n--- 4. Testing GET /api/interviews/my (Student Route) ---');
    const myInterviewsRes = await makeRequest('/interviews/my', 'GET', null, s1Token);
    assert(myInterviewsRes.statusCode === 200, 'GET /api/interviews/my returns 200 OK');
    assert(Array.isArray(myInterviewsRes.body.data), 'Returns an array of interviews');
    assert(myInterviewsRes.body.data.length === 1, 'Candidate sees their 1 scheduled interview');
    assert(myInterviewsRes.body.data[0]._id === interviewId, 'Returned interview matches scheduled ID');
    assert(myInterviewsRes.body.data[0].recruitmentDrive.jobRole === 'Cloud Infrastructure Associate', 'Drive role populated in student view');

    // Peer Student Isolation
    const peerInterviewsRes = await makeRequest('/interviews/my', 'GET', null, s2Token);
    assert(peerInterviewsRes.statusCode === 200, 'Peer student accesses GET /api/interviews/my');
    assert(peerInterviewsRes.body.data.length === 0, 'Peer student cannot see candidate interview (0 interviews returned)');

    // 5. Testing GET /api/admin/interviews (Admin List & Filters)
    console.log('\n--- 5. Testing GET /api/admin/interviews ---');
    const adminInterviewsRes = await makeRequest('/admin/interviews', 'GET', null, adminToken);
    assert(adminInterviewsRes.statusCode === 200, 'GET /api/admin/interviews returns 200 OK');
    assert(Array.isArray(adminInterviewsRes.body.data.interviews), 'Admin returns interviews array');
    assert(adminInterviewsRes.body.data.pagination && adminInterviewsRes.body.data.pagination.total >= 1, 'Pagination metadata attached');

    // Filter by driveId
    const filterDriveRes = await makeRequest(`/admin/interviews?driveId=${driveId}`, 'GET', null, adminToken);
    assert(filterDriveRes.statusCode === 200 && filterDriveRes.body.data.interviews.length >= 1, 'Filtering admin interviews by driveId works');

    // Filter by non-matching status
    const filterStatusRes = await makeRequest(`/admin/interviews?status=CANCELLED`, 'GET', null, adminToken);
    assert(filterStatusRes.body.data.interviews.length === 0, 'Filtering admin interviews by status works');

    // 6. Testing PUT /api/interviews/:id (Admin Reschedules / Updates)
    console.log('\n--- 6. Testing PUT /api/interviews/:id (Admin Update) ---');
    const newDate = new Date(Date.now() + 4 * 86400000).toISOString();
    const updateRes = await makeRequest(`/interviews/${interviewId}`, 'PUT', {
      time: '02:30 PM',
      date: newDate,
      instructions: 'Updated: Bring a physical copy of your resume.',
      status: 'CLEARED',
      feedback: 'Strong understanding of data structures and cloud concepts.',
    }, adminToken);

    assert(updateRes.statusCode === 200, 'PUT /api/interviews/:id returns 200 OK');
    assert(updateRes.body.data.time === '02:30 PM', 'Interview time updated to 02:30 PM');
    assert(updateRes.body.data.status === 'CLEARED', 'Interview status updated to CLEARED');
    assert(updateRes.body.data.feedback.includes('Strong understanding'), 'Feedback updated successfully');

    // Invalid Status on Update
    const badStatusRes = await makeRequest(`/interviews/${interviewId}`, 'PUT', {
      status: 'UNKNOWN_STATUS',
    }, adminToken);
    assert(badStatusRes.statusCode === 400, 'Invalid status on update rejected with 400 Bad Request');

    // 7. Security & Authorization
    console.log('\n--- 7. Security & RBAC Enforcement ---');
    // Student blocked from creating interviews
    const studentCreateRes = await makeRequest('/interviews', 'POST', {
      application: applicationId,
      round: 'Hacked Round',
      date: interviewDate,
      time: '10:00 AM',
    }, s1Token);
    assert(studentCreateRes.statusCode === 403, 'Student blocked from POST /api/interviews with 403 Forbidden');

    // Student blocked from admin interview list
    const studentAdminListRes = await makeRequest('/admin/interviews', 'GET', null, s1Token);
    assert(studentAdminListRes.statusCode === 403, 'Student blocked from GET /api/admin/interviews with 403 Forbidden');

    // Student blocked from updating interview
    const studentUpdateRes = await makeRequest(`/interviews/${interviewId}`, 'PUT', { status: 'CLEARED' }, s1Token);
    assert(studentUpdateRes.statusCode === 403, 'Student blocked from PUT /api/interviews/:id with 403 Forbidden');

    // Unauthenticated request
    const noAuthRes = await makeRequest('/interviews/my', 'GET');
    assert(noAuthRes.statusCode === 401, 'Unauthenticated access rejected with 401 Unauthorized');

    console.log('\n====================================================');
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test execution error:', err);
    process.exit(1);
  }
};

runTests();
