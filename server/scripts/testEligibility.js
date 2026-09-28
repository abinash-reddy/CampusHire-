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
  console.log('🧠 CampusHire – Student Eligibility Engine Test Suite');
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
    // 1. Setup: Admin, Company, and Recruitment Drive
    console.log('\n--- 1. Setting Up Recruitment Drive ---');
    const adminRes = await makeRequest('/auth/register-admin', 'POST', {
      name: 'Eligibility Officer',
      email: `admin_elig_${timestamp}@college.edu`,
      password: 'AdminPassword123',
      role: 'admin',
    });
    const adminToken = adminRes.body.data.token;

    const compRes = await makeRequest('/companies', 'POST', {
      companyName: `Amazon Web Services ${timestamp}`,
      industry: 'IT / Software',
    }, adminToken);
    const companyId = compRes.body.data._id;

    // Drive criteria: CSE / IT, CGPA >= 7.5, Backlogs <= 0, Batch 2026, Package 10 LPA
    const driveRes = await makeRequest('/drives', 'POST', {
      company: companyId,
      jobRole: 'Software Engineer',
      jobDescription: 'Build high-scale distributed systems.',
      package: 10.0,
      eligibleBranches: ['CSE', 'IT'],
      minimumCGPA: 7.5,
      maximumBacklogs: 0,
      graduationYear: 2026,
      requiredSkills: ['React', 'Node.js', 'MongoDB', 'Docker'],
      applicationDeadline: new Date(Date.now() + 10 * 86400000),
      driveDate: new Date(Date.now() + 20 * 86400000),
      status: 'OPEN',
    }, adminToken);
    const driveId = driveRes.body.data._id;
    assert(driveId, 'Recruitment Drive created with target eligibility thresholds');

    // 2. Scenario 1: Fully Eligible Student
    console.log('\n--- 2. Scenario: Fully Eligible Student ---');
    const eligibleStudentRes = await makeRequest('/auth/register', 'POST', {
      name: 'Anil Kumar',
      email: `anil_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `CS_${timestamp.toString().slice(-4)}`,
      department: 'CSE',
      batchYear: 2026,
      cgpa: 8.5,
      skills: ['React', 'Node.js'],
    });
    const eligibleStudentToken = eligibleStudentRes.body.data.token;

    const eval1Res = await makeRequest(`/drives/${driveId}/eligibility`, 'GET', null, eligibleStudentToken);
    assert(eval1Res.statusCode === 200, 'Eligibility evaluation returned HTTP 200 OK');
    assert(eval1Res.body.data.eligible === true, 'Student evaluated as ELIGIBLE (true)');
    assert(eval1Res.body.data.failedCriteria.length === 0, 'No criteria failed');
    assert(eval1Res.body.data.skillMatch.matched.includes('react'), 'React detected in matched skills');
    assert(eval1Res.body.data.skillMatch.missing.includes('docker'), 'Docker detected in missing skills gap');

    // 3. Scenario 2: Ineligible - CGPA Failure
    console.log('\n--- 3. Scenario: Ineligible (CGPA Below 7.5) ---');
    const lowCgpaStudentRes = await makeRequest('/auth/register', 'POST', {
      name: 'Ravi Teja',
      email: `ravi_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `CS2_${timestamp.toString().slice(-4)}`,
      department: 'CSE',
      batchYear: 2026,
      cgpa: 7.1, // Below 7.5
    });
    const lowCgpaToken = lowCgpaStudentRes.body.data.token;

    const eval2Res = await makeRequest(`/drives/${driveId}/eligibility`, 'GET', null, lowCgpaToken);
    assert(eval2Res.body.data.eligible === false, 'Student evaluated as NOT ELIGIBLE (false)');
    assert(
      eval2Res.body.data.failedCriteria.some((f) => f.includes("Required CGPA is 7.50 but student's CGPA is 7.10")),
      'Accurate failure reason generated for low CGPA'
    );

    // 4. Scenario 3: Ineligible - Branch Failure
    console.log('\n--- 4. Scenario: Ineligible (Ineligible Branch: MECH) ---');
    const mechStudentRes = await makeRequest('/auth/register', 'POST', {
      name: 'Suresh Raina',
      email: `suresh_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `ME_${timestamp.toString().slice(-4)}`,
      department: 'MECH', // Not in CSE, IT
      batchYear: 2026,
      cgpa: 8.9,
    });
    const mechToken = mechStudentRes.body.data.token;

    const eval3Res = await makeRequest(`/drives/${driveId}/eligibility`, 'GET', null, mechToken);
    assert(eval3Res.body.data.eligible === false, 'Branch mismatch evaluated as NOT ELIGIBLE');
    assert(
      eval3Res.body.data.failedCriteria.some((f) => f.includes("Eligible branches are [CSE, IT] but student's branch is MECH")),
      'Accurate failure reason generated for branch mismatch'
    );

    // 5. Scenario 4: Ineligible - Backlog Failure
    console.log('\n--- 5. Scenario: Ineligible (Active Backlogs) ---');
    const backlogStudentRes = await makeRequest('/auth/register', 'POST', {
      name: 'Deepak Chahar',
      email: `deepak_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `IT_${timestamp.toString().slice(-4)}`,
      department: 'IT',
      batchYear: 2026,
      cgpa: 8.0,
    });
    const backlogStudentToken = backlogStudentRes.body.data.token;
    // Set 1 active backlog via profile update
    await makeRequest('/students/profile', 'PUT', { activeBacklogs: 1 }, backlogStudentToken);

    const eval4Res = await makeRequest(`/drives/${driveId}/eligibility`, 'GET', null, backlogStudentToken);
    assert(eval4Res.body.data.eligible === false, 'Backlog student evaluated as NOT ELIGIBLE');
    assert(
      eval4Res.body.data.failedCriteria.some((f) => f.includes('Maximum allowed active backlogs is 0 but student has 1 active backlog(s)')),
      'Accurate failure reason generated for active backlogs'
    );

    // 6. Scenario 5: Ineligible - Graduation Year Mismatch
    console.log('\n--- 6. Scenario: Ineligible (Batch Year Mismatch) ---');
    const wrongYearStudentRes = await makeRequest('/auth/register', 'POST', {
      name: 'Manoj Kumar',
      email: `manoj_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `CS3_${timestamp.toString().slice(-4)}`,
      department: 'CSE',
      batchYear: 2025, // 2025 batch when drive is 2026
      cgpa: 8.5,
    });
    const wrongYearToken = wrongYearStudentRes.body.data.token;

    const eval5Res = await makeRequest(`/drives/${driveId}/eligibility`, 'GET', null, wrongYearToken);
    assert(eval5Res.body.data.eligible === false, 'Batch year mismatch evaluated as NOT ELIGIBLE');
    assert(
      eval5Res.body.data.failedCriteria.some((f) => f.includes('Eligible graduation year is 2026 but student\'s graduation year is 2025')),
      'Accurate failure reason generated for batch year mismatch'
    );

    // 7. Admin Endpoint: View Eligible Students for Drive
    console.log('\n--- 7. Testing Admin Eligible Students Endpoint ---');
    const adminEligListRes = await makeRequest(`/drives/${driveId}/eligible-students`, 'GET', null, adminToken);
    assert(adminEligListRes.statusCode === 200, 'Admin fetched eligible students list with HTTP 200 OK');
    assert(Array.isArray(adminEligListRes.body.data.students), 'Students returned as an array');
    assert(adminEligListRes.body.data.pagination.total >= 1, 'At least 1 eligible student found in college database');

    // Student blocked from /eligible-students endpoint
    const studentBlockedRes = await makeRequest(`/drives/${driveId}/eligible-students`, 'GET', null, eligibleStudentToken);
    assert(studentBlockedRes.statusCode === 403, 'Student blocked from /eligible-students with HTTP 403 Forbidden');

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
