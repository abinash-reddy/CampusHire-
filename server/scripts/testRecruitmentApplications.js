const http = require('http');

const API_BASE = 'http://localhost:5000/api';

const makeRequest = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const postData = body ? JSON.stringify(body) : null;

    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(rawData);
          } catch (e) {
            parsed = rawData;
          }
          resolve({
            statusCode: res.statusCode,
            body: parsed,
          });
        });
      }
    );

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('====================================================');
  console.log('📝 CampusHire – Recruitment Application Flow Test Suite');
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
    // 1. Setup: Admin, Company, Drives
    console.log('\n--- 1. Setting Up Test Accounts, Drives & Candidates ---');
    const adminRes = await makeRequest('/auth/register-admin', 'POST', {
      name: 'Placement Dean',
      email: `dean_app_${timestamp}@college.edu`,
      password: 'AdminPassword123',
      role: 'admin',
    });
    const adminToken = adminRes.body.data.token;

    const compRes = await makeRequest('/companies', 'POST', {
      companyName: `Oracle Cloud Systems ${timestamp}`,
      industry: 'IT / Software',
    }, adminToken);
    const companyId = compRes.body.data._id;

    // Drive A: Valid Open Drive (Deadline in future)
    const openDriveRes = await makeRequest('/drives', 'POST', {
      company: companyId,
      jobRole: 'Cloud Software Engineer',
      jobDescription: 'Build enterprise cloud systems.',
      package: 12.0,
      eligibleBranches: ['CSE', 'IT'],
      minimumCGPA: 7.5,
      maximumBacklogs: 0,
      graduationYear: 2026,
      applicationDeadline: new Date(Date.now() + 10 * 86400000),
      driveDate: new Date(Date.now() + 20 * 86400000),
      status: 'OPEN',
    }, adminToken);
    const openDriveId = openDriveRes.body.data._id;

    // Drive B: Closed Drive
    const closedDriveRes = await makeRequest('/drives', 'POST', {
      company: companyId,
      jobRole: 'Archived Role',
      jobDescription: 'Archived',
      package: 8.0,
      graduationYear: 2026,
      applicationDeadline: new Date(Date.now() + 10 * 86400000),
      driveDate: new Date(Date.now() + 20 * 86400000),
      status: 'CLOSED',
    }, adminToken);
    const closedDriveId = closedDriveRes.body.data._id;

    // Drive C: Expired Deadline Drive
    const expiredDriveRes = await makeRequest('/drives', 'POST', {
      company: companyId,
      jobRole: 'Past Deadline Role',
      jobDescription: 'Past deadline',
      package: 9.0,
      graduationYear: 2026,
      applicationDeadline: new Date(Date.now() - 86400000), // Yesterday
      driveDate: new Date(Date.now() + 86400000),
      status: 'OPEN',
    }, adminToken);
    const expiredDriveId = expiredDriveRes.body.data._id;

    // Student 1: Eligible (CSE, 8.8 CGPA, 0 backlogs, 2026)
    const s1Res = await makeRequest('/auth/register', 'POST', {
      name: 'Aditya Kashyap',
      email: `aditya_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `CS_${timestamp.toString().slice(-4)}`,
      department: 'CSE',
      batchYear: 2026,
      cgpa: 8.8,
    });
    const s1Token = s1Res.body.data.token;
    const s1Id = s1Res.body.data.student._id;

    // Student 2: Ineligible (MECH department)
    const s2Res = await makeRequest('/auth/register', 'POST', {
      name: 'Vikram Seth',
      email: `vikram_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `ME_${timestamp.toString().slice(-4)}`,
      department: 'MECH',
      batchYear: 2026,
      cgpa: 8.5,
    });
    const s2Token = s2Res.body.data.token;

    // Student 3: Eligible Peer
    const s3Res = await makeRequest('/auth/register', 'POST', {
      name: 'Megha Rao',
      email: `megha_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `IT_${timestamp.toString().slice(-4)}`,
      department: 'IT',
      batchYear: 2026,
      cgpa: 8.1,
    });
    const s3Token = s3Res.body.data.token;

    assert(openDriveId && s1Token && s2Token && s3Token, 'Test environment initialized');

    // 2. Ineligible Student Application Attempt
    console.log('\n--- 2. Testing Ineligible Student Rejection ---');
    const ineligApplyRes = await makeRequest('/applications', 'POST', {
      driveId: openDriveId,
    }, s2Token);
    assert(ineligApplyRes.statusCode === 400, 'Ineligible student blocked with HTTP 400 Bad Request', `Got: ${ineligApplyRes.statusCode}`);

    // 3. Application to Closed Drive
    console.log('\n--- 3. Testing Closed Drive Rejection ---');
    const closedApplyRes = await makeRequest('/applications', 'POST', {
      driveId: closedDriveId,
    }, s1Token);
    assert(closedApplyRes.statusCode === 400, 'Closed drive application rejected with HTTP 400 Bad Request');

    // 4. Application to Expired Deadline Drive
    console.log('\n--- 4. Testing Expired Deadline Rejection ---');
    const expiredApplyRes = await makeRequest('/applications', 'POST', {
      driveId: expiredDriveId,
    }, s1Token);
    assert(expiredApplyRes.statusCode === 400, 'Expired deadline application rejected with HTTP 400 Bad Request');

    // 5. Successful Application Submission
    console.log('\n--- 5. Testing Successful Application Submission ---');
    const validApplyRes = await makeRequest('/applications', 'POST', {
      driveId: openDriveId,
    }, s1Token);
    assert(validApplyRes.statusCode === 201, 'Application submitted with HTTP 201 Created', `Got: ${validApplyRes.statusCode}`);
    assert(validApplyRes.body.data.status === 'APPLIED', 'Application initial status is APPLIED');
    assert(validApplyRes.body.data.statusHistory.length === 1, 'Initial status history recorded');
    const applicationId = validApplyRes.body.data._id;

    // 6. Duplicate Application Prevention
    console.log('\n--- 6. Testing Duplicate Application Prevention ---');
    const dupApplyRes = await makeRequest('/applications', 'POST', {
      driveId: openDriveId,
    }, s1Token);
    assert(dupApplyRes.statusCode === 409, 'Duplicate application rejected with HTTP 409 Conflict', `Got: ${dupApplyRes.statusCode}`);

    // 7. Student views own applications (GET /api/applications/my)
    console.log('\n--- 7. Testing View My Applications (GET /api/applications/my) ---');
    const myAppsRes = await makeRequest('/applications/my', 'GET', null, s1Token);
    assert(myAppsRes.statusCode === 200, 'Student fetched applications list with HTTP 200 OK');
    assert(myAppsRes.body.data.some((a) => a._id === applicationId), 'Submitted application present in my list');
    assert(myAppsRes.body.data[0].recruitmentDrive.jobRole === 'Cloud Software Engineer', 'Drive details populated');

    // 8. View Single Application (GET /api/applications/:id)
    console.log('\n--- 8. Testing Application Details & Authorization ---');
    const singleAppRes = await makeRequest(`/applications/${applicationId}`, 'GET', null, s1Token);
    assert(singleAppRes.statusCode === 200, 'Application details fetched by candidate with HTTP 200 OK');

    // Peer Student 3 blocked from viewing Student 1's application
    const peerForbiddenRes = await makeRequest(`/applications/${applicationId}`, 'GET', null, s3Token);
    assert(peerForbiddenRes.statusCode === 403, 'Peer student blocked with HTTP 403 Forbidden');

    // 9. Admin lists all applications (GET /api/admin/applications)
    console.log('\n--- 9. Testing Admin View All Applications ---');
    const adminAppsRes = await makeRequest('/admin/applications', 'GET', null, adminToken);
    assert(adminAppsRes.statusCode === 200, 'Admin fetched all applications with HTTP 200 OK');
    assert(adminAppsRes.body.data.applications.some((a) => a._id === applicationId), 'Application found in admin list');
    assert(adminAppsRes.body.data.pagination.total >= 1, 'Pagination metadata attached');

    // 10. Admin updates application status through recruitment pipeline
    console.log('\n--- 10. Testing Application Status Pipeline Transitions ---');
    // Shortlist
    const shortlistRes = await makeRequest(`/admin/applications/${applicationId}/status`, 'PUT', {
      status: 'SHORTLISTED',
      stage: 'Shortlisted for Assessment',
      remarks: 'CGPA criteria met. Selected for Online Assessment.',
    }, adminToken);
    assert(shortlistRes.statusCode === 200, 'Status updated to SHORTLISTED');
    assert(shortlistRes.body.data.status === 'SHORTLISTED', 'Response reflects SHORTLISTED status');

    // Technical Interview
    const techRes = await makeRequest(`/admin/applications/${applicationId}/status`, 'PUT', {
      status: 'TECHNICAL_INTERVIEW',
      stage: 'Technical Round 1',
      remarks: 'Online Assessment cleared with 92% score.',
    }, adminToken);
    assert(techRes.statusCode === 200, 'Status updated to TECHNICAL_INTERVIEW');

    // Final Selection & Placement Record Automation
    console.log('\n--- 11. Testing Selection & Placement Offer Creation ---');
    const selectRes = await makeRequest(`/admin/applications/${applicationId}/status`, 'PUT', {
      status: 'SELECTED',
      stage: 'Final Offer Extended',
      remarks: 'Cleared all rounds. Offered Cloud Software Engineer position at 12 LPA.',
    }, adminToken);
    assert(selectRes.statusCode === 200, 'Status updated to SELECTED');
    assert(selectRes.body.data.status === 'SELECTED', 'Status confirmed SELECTED');

    // Verify student placement status updated to 'Placed' in profile
    const profileCheckRes = await makeRequest('/students/profile', 'GET', null, s1Token);
    assert(profileCheckRes.body.data.placementStatus === 'Placed', 'Student profile automatically marked as "Placed"');
    assert(profileCheckRes.body.data.currentHighestCtc === 12.0, 'Student currentHighestCtc updated to 12.0 LPA');

    // 12. Invalid status rejection
    console.log('\n--- 12. Testing Invalid Status Rejection ---');
    const invalidStatusRes = await makeRequest(`/admin/applications/${applicationId}/status`, 'PUT', {
      status: 'INVALID_CUSTOM_STATUS',
    }, adminToken);
    assert(invalidStatusRes.statusCode === 400, 'Invalid status rejected with HTTP 400 Bad Request');

    console.log('\n====================================================');
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
};

runTests();
