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
  console.log('🏆 CampusHire – Phase 16: Placement Results Test Suite');
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
    // 1. Setup Test Accounts & Environment
    console.log('\n--- 1. Setting Up Test Accounts & Environment ---');
    const adminReg = await makeRequest('/auth/register-admin', 'POST', {
      name: 'TPO Placement Officer',
      email: `tpo_results_${timestamp}@college.edu`,
      password: 'AdminPassword123',
      role: 'admin',
    });
    const adminToken = adminReg.body.data.token;
    assert(adminToken, 'Admin account registered');

    // Create Company
    const compRes = await makeRequest('/companies', 'POST', {
      companyName: `Amazon Web Services ${timestamp}`,
      industry: 'Cloud Infrastructure & AI',
      website: 'https://aws.amazon.com',
      location: 'Hyderabad, India',
    }, adminToken);
    const companyId = compRes.body.data._id;
    assert(companyId, 'Hiring company created');

    // Create Recruitment Drive
    const driveRes = await makeRequest('/drives', 'POST', {
      company: companyId,
      jobRole: 'Cloud Support Associate',
      jobDescription: 'Provide tier-3 architecture and engineering support for global cloud systems.',
      package: 15.5,
      eligibleBranches: ['CSE', 'IT'],
      minimumCGPA: 7.0,
      maximumBacklogs: 0,
      graduationYear: 2026,
      requiredSkills: ['Linux', 'Cloud', 'Python'],
      applicationDeadline: new Date(Date.now() + 10 * 86400000).toISOString(),
      driveDate: new Date(Date.now() + 15 * 86400000).toISOString(),
      status: 'OPEN',
    }, adminToken);
    const driveId = driveRes.body.data._id;
    assert(driveId, 'Recruitment drive created');

    // Student 1 (Will be SELECTED)
    const s1Res = await makeRequest('/auth/register', 'POST', {
      name: 'Rahul Deshmukh',
      email: `rahul_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `CS_${timestamp.toString().slice(-4)}`,
      department: 'CSE',
      batchYear: 2026,
    });
    const s1Token = s1Res.body.data.token;
    await makeRequest('/students/profile', 'PUT', { cgpa: 9.2 }, s1Token);
    const s1Profile = await makeRequest('/students/profile', 'GET', null, s1Token);
    const s1StudentId = s1Profile.body.data._id;

    // Student 2 (Will be WAITLISTED)
    const s2Res = await makeRequest('/auth/register', 'POST', {
      name: 'Meera Nambiar',
      email: `meera_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `IT_${timestamp.toString().slice(-4)}`,
      department: 'IT',
      batchYear: 2026,
    });
    const s2Token = s2Res.body.data.token;
    await makeRequest('/students/profile', 'PUT', { cgpa: 8.6 }, s2Token);
    const s2Profile = await makeRequest('/students/profile', 'GET', null, s2Token);
    const s2StudentId = s2Profile.body.data._id;

    // Student 3 (Will be REJECTED)
    const s3Res = await makeRequest('/auth/register', 'POST', {
      name: 'Kunal Kapoor',
      email: `kunal_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `CS_${(timestamp + 1).toString().slice(-4)}`,
      department: 'CSE',
      batchYear: 2026,
    });
    const s3Token = s3Res.body.data.token;
    await makeRequest('/students/profile', 'PUT', { cgpa: 7.9 }, s3Token);
    const s3Profile = await makeRequest('/students/profile', 'GET', null, s3Token);
    const s3StudentId = s3Profile.body.data._id;

    // All 3 students apply to drive
    const app1 = await makeRequest('/applications', 'POST', { driveId }, s1Token);
    const app2 = await makeRequest('/applications', 'POST', { driveId }, s2Token);
    const app3 = await makeRequest('/applications', 'POST', { driveId }, s3Token);
    assert(app1.statusCode === 201 && app2.statusCode === 201 && app3.statusCode === 201, 'All candidate students applied to drive');

    // 2. Testing Input & Status Validations on POST /api/results
    console.log('\n--- 2. Testing Input Validations on Result Publication ---');
    // Invalid Status
    const badStatusRes = await makeRequest('/results', 'POST', {
      student: s1StudentId,
      recruitmentDrive: driveId,
      status: 'INVALID_STATUS',
    }, adminToken);
    assert(badStatusRes.statusCode === 400, 'Invalid status rejected with 400 Bad Request');

    // Missing Student
    const noStudentRes = await makeRequest('/results', 'POST', {
      recruitmentDrive: driveId,
      status: 'SELECTED',
    }, adminToken);
    assert(noStudentRes.statusCode === 400, 'Missing student rejected with 400 Bad Request');

    // Missing Drive
    const noDriveRes = await makeRequest('/results', 'POST', {
      student: s1StudentId,
      status: 'SELECTED',
    }, adminToken);
    assert(noDriveRes.statusCode === 400, 'Missing recruitmentDrive rejected with 400 Bad Request');

    // Negative package
    const badPkgRes = await makeRequest('/results', 'POST', {
      student: s1StudentId,
      recruitmentDrive: driveId,
      package: -5,
      status: 'SELECTED',
    }, adminToken);
    assert(badPkgRes.statusCode === 400, 'Negative package rejected with 400 Bad Request');

    // 3. Publishing Results for All 3 Statuses (SELECTED, WAITLISTED, REJECTED)
    console.log('\n--- 3. Publishing Results (SELECTED, WAITLISTED, REJECTED) ---');
    // Publish SELECTED for Student 1
    const res1 = await makeRequest('/results', 'POST', {
      student: s1StudentId,
      recruitmentDrive: driveId,
      company: companyId,
      jobRole: 'Cloud Support Associate',
      package: 15.5,
      status: 'SELECTED',
      resultDate: new Date().toISOString(),
      remarks: 'Offered position with joining in July 2026',
    }, adminToken);

    assert(res1.statusCode === 201, 'Student 1 result published as SELECTED (201 Created)');
    assert(res1.body.data.status === 'SELECTED', 'Status recorded as SELECTED');
    assert(res1.body.data.package === 15.5, 'Package recorded as 15.5 LPA');
    const result1Id = res1.body.data._id;

    // Verify Student 1 profile placement status updated to Placed and CTC updated
    const updatedS1Profile = await makeRequest('/students/profile', 'GET', null, s1Token);
    assert(updatedS1Profile.body.data.placementStatus === 'Placed', 'Student 1 placementStatus updated to "Placed"');
    assert(updatedS1Profile.body.data.currentHighestCtc === 15.5, 'Student 1 currentHighestCtc updated to 15.5 LPA');

    // Verify Student 1 application status transitioned to SELECTED
    const app1Check = await makeRequest(`/applications/${app1.body.data._id}`, 'GET', null, s1Token);
    assert(app1Check.body.data.status === 'SELECTED', 'Student 1 application status transitioned to SELECTED');

    // Publish WAITLISTED for Student 2
    const res2 = await makeRequest('/results', 'POST', {
      student: s2StudentId,
      recruitmentDrive: driveId,
      company: companyId,
      jobRole: 'Cloud Support Associate',
      package: 15.5,
      status: 'WAITLISTED',
      remarks: 'Waitlist position #1',
    }, adminToken);

    assert(res2.statusCode === 201, 'Student 2 result published as WAITLISTED (201 Created)');
    assert(res2.body.data.status === 'WAITLISTED', 'Status recorded as WAITLISTED');
    const updatedS2Profile = await makeRequest('/students/profile', 'GET', null, s2Token);
    assert(updatedS2Profile.body.data.placementStatus === 'Unplaced', 'Student 2 placementStatus remains "Unplaced"');
    const result2Id = res2.body.data._id;

    // Publish REJECTED for Student 3
    const res3 = await makeRequest('/results', 'POST', {
      student: s3StudentId,
      recruitmentDrive: driveId,
      company: companyId,
      jobRole: 'Cloud Support Associate',
      package: 15.5,
      status: 'REJECTED',
      remarks: 'Did not clear final interview round',
    }, adminToken);

    assert(res3.statusCode === 201, 'Student 3 result published as REJECTED (201 Created)');
    assert(res3.body.data.status === 'REJECTED', 'Status recorded as REJECTED');
    const updatedS3Profile = await makeRequest('/students/profile', 'GET', null, s3Token);
    assert(updatedS3Profile.body.data.placementStatus === 'Unplaced', 'Student 3 placementStatus remains "Unplaced"');
    const app3Check = await makeRequest(`/applications/${app3.body.data._id}`, 'GET', null, s3Token);
    assert(app3Check.body.data.status === 'REJECTED', 'Student 3 application status transitioned to REJECTED');

    // 4. Testing GET /api/results/my (Students view their own results)
    console.log('\n--- 4. Testing GET /api/results/my (Student Isolation) ---');
    const s1MyResults = await makeRequest('/results/my', 'GET', null, s1Token);
    assert(s1MyResults.statusCode === 200, 'Student 1 fetched GET /api/results/my');
    assert(Array.isArray(s1MyResults.body.data), 'Returns results array');
    assert(s1MyResults.body.data.length === 1, 'Student 1 sees exactly 1 result');
    assert(s1MyResults.body.data[0].status === 'SELECTED', 'Student 1 result is SELECTED');
    const compName = s1MyResults.body.data[0].company.companyName || s1MyResults.body.data[0].company.name;
    assert(compName && compName.includes('Amazon'), 'Company details populated in result');


    const s2MyResults = await makeRequest('/results/my', 'GET', null, s2Token);
    assert(s2MyResults.body.data.length === 1, 'Student 2 sees exactly 1 result');
    assert(s2MyResults.body.data[0].status === 'WAITLISTED', 'Student 2 result is WAITLISTED');

    // 5. Testing Privacy Barrier on GET /api/results/:id
    console.log('\n--- 5. Testing Privacy Barrier on GET /api/results/:id ---');
    // Student 1 views their own result details -> 200 OK
    const s1OwnDetail = await makeRequest(`/results/${result1Id}`, 'GET', null, s1Token);
    assert(s1OwnDetail.statusCode === 200, 'Student 1 can view their own result details (200 OK)');
    assert(s1OwnDetail.body.data.package === 15.5, 'Package details visible to recipient');

    // Student 2 attempts to view Student 1's result details -> 403 Forbidden
    const s2Unauthorized = await makeRequest(`/results/${result1Id}`, 'GET', null, s2Token);
    assert(s2Unauthorized.statusCode === 403, 'Student 2 blocked from viewing Student 1 result with 403 Forbidden');

    // Admin can view any result details -> 200 OK
    const adminDetail = await makeRequest(`/results/${result1Id}`, 'GET', null, adminToken);
    assert(adminDetail.statusCode === 200, 'Admin can view candidate result details (200 OK)');

    // 6. Testing GET /api/results & GET /api/admin/results (Admin Views All Results)
    console.log('\n--- 6. Testing GET /api/results & /api/admin/results ---');
    const adminResults = await makeRequest('/results', 'GET', null, adminToken);
    assert(adminResults.statusCode === 200, 'Admin fetched GET /api/results (200 OK)');
    assert(Array.isArray(adminResults.body.data.results), 'Admin received results array');
    assert(adminResults.body.data.results.length >= 3, 'All published results included in admin list');
    assert(adminResults.body.data.pagination && adminResults.body.data.pagination.total >= 3, 'Pagination metadata attached');

    // Admin endpoint alias: /api/admin/results
    const adminAlias = await makeRequest('/admin/results', 'GET', null, adminToken);
    assert(adminAlias.statusCode === 200, 'GET /api/admin/results alias returns 200 OK');

    // Filter by status=SELECTED
    const filterSelected = await makeRequest('/results?status=SELECTED', 'GET', null, adminToken);
    assert(filterSelected.statusCode === 200, 'Filter by status=SELECTED returns 200 OK');
    assert(
      filterSelected.body.data.results.every(r => r.status === 'SELECTED'),
      'All returned results have status SELECTED'
    );

    // 7. Security: Student blocked from Admin routes
    console.log('\n--- 7. Security & Authorization Checks ---');
    // Student blocked from publishing results
    const studentPublish = await makeRequest('/results', 'POST', {
      student: s1StudentId,
      recruitmentDrive: driveId,
      status: 'SELECTED',
    }, s1Token);
    assert(studentPublish.statusCode === 403, 'Student blocked from POST /api/results with 403 Forbidden');

    // Student blocked from GET /api/results (all results)
    const studentAllResults = await makeRequest('/results', 'GET', null, s1Token);
    assert(studentAllResults.statusCode === 403, 'Student blocked from GET /api/results (all results) with 403 Forbidden');

    // Student blocked from GET /api/admin/results
    const studentAdminAlias = await makeRequest('/admin/results', 'GET', null, s1Token);
    assert(studentAdminAlias.statusCode === 403, 'Student blocked from GET /api/admin/results with 403 Forbidden');

    // Unauthenticated access
    const noAuth = await makeRequest('/results/my', 'GET');
    assert(noAuth.statusCode === 401, 'Unauthenticated request rejected with 401 Unauthorized');

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
