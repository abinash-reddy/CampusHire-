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
  console.log('🚀 CampusHire – Recruitment Drive Management Test Suite');
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
    // 1. Setup: Admin & Student Accounts
    console.log('\n--- 1. Setting Up Test Accounts & Partner Company ---');
    const adminRes = await makeRequest('/auth/register-admin', 'POST', {
      name: 'TPO Drive Head',
      email: `tpo_drive_${timestamp}@college.edu`,
      password: 'AdminPassword123',
      role: 'tpo',
    });
    const adminToken = adminRes.body.data.token;

    const studentRes = await makeRequest('/auth/register', 'POST', {
      name: 'Vikas Gupta',
      email: `vikas_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `CS_${timestamp.toString().slice(-4)}`,
      department: 'CSE',
      batchYear: 2026,
    });
    const studentToken = studentRes.body.data.token;

    // Create Company for Drive
    const compRes = await makeRequest('/companies', 'POST', {
      companyName: `Microsoft IDC ${timestamp}`,
      industry: 'IT / Software',
      website: 'https://careers.microsoft.com',
      tier: 'SuperDream',
    }, adminToken);
    const companyId = compRes.body.data._id;
    assert(companyId, 'Hiring company created for drive assignment');

    // 2. Security: Student blocked from creating drive
    console.log('\n--- 2. Testing RBAC on Drive Creation ---');
    const studentCreateRes = await makeRequest('/drives', 'POST', {
      company: companyId,
      jobRole: 'Software Engineer',
      package: 15,
      graduationYear: 2026,
      applicationDeadline: new Date(Date.now() + 86400000),
      driveDate: new Date(Date.now() + 172800000),
    }, studentToken);
    assert(studentCreateRes.statusCode === 403, 'Student blocked from POST /api/drives with HTTP 403 Forbidden');

    // 3. Date Validation: Drive Date < Application Deadline
    console.log('\n--- 3. Testing Date Validation Logic ---');
    const invalidDateRes = await makeRequest('/drives', 'POST', {
      company: companyId,
      jobRole: 'Cloud Solution Architect',
      jobDescription: 'Architecting scalable cloud solutions on Azure.',
      package: 18.0,
      graduationYear: 2026,
      applicationDeadline: new Date('2026-11-20'),
      driveDate: new Date('2026-11-10'), // Earlier than deadline!
    }, adminToken);
    assert(invalidDateRes.statusCode === 400, 'Drive date earlier than deadline rejected with HTTP 400 Bad Request', `Got: ${invalidDateRes.statusCode}`);

    // 4. Admin creates valid drive
    console.log('\n--- 4. Testing Recruitment Drive Creation by Admin ---');
    const deadline = new Date(Date.now() + 7 * 86400000); // 7 days in future
    const driveDate = new Date(Date.now() + 14 * 86400000); // 14 days in future

    const createDriveRes = await makeRequest('/drives', 'POST', {
      company: companyId,
      jobRole: 'Software Development Engineer - Trainee',
      jobDescription: 'Develop modern full-stack web and cloud systems.',
      package: 14.5,
      location: 'Hyderabad / Bengaluru',
      employmentType: 'Full-Time',
      eligibleBranches: ['CSE', 'IT', 'AI&DS'],
      minimumCGPA: 7.5,
      maximumBacklogs: 0,
      graduationYear: 2026,
      numberOfPositions: 20,
      requiredSkills: ['React', 'Node.js', 'MongoDB', 'System Design'],
      selectionProcess: ['Online Assessment', 'Technical Round 1', 'HR Round'],
      applicationDeadline: deadline,
      driveDate: driveDate,
      status: 'OPEN',
    }, adminToken);

    assert(createDriveRes.statusCode === 201, 'Drive created with HTTP 201 Created', `Got: ${createDriveRes.statusCode}`);
    assert(createDriveRes.body.data.package === 14.5, 'Package stored as 14.5 LPA');
    assert(createDriveRes.body.data.minimumCGPA === 7.5, 'Minimum CGPA threshold stored as 7.5');
    assert(createDriveRes.body.data.status === 'OPEN', 'Status stored as OPEN');
    assert(createDriveRes.body.data.company.name.includes('Microsoft IDC'), 'Company populated in response');
    const driveId = createDriveRes.body.data._id;

    // 5. Create a Closed Drive to test Student vs Admin filtering
    console.log('\n--- 5. Testing Role-Based Status Visibility ---');
    const closedDriveRes = await makeRequest('/drives', 'POST', {
      company: companyId,
      jobRole: 'Archived Past Drive',
      jobDescription: 'Drive from previous semester.',
      package: 8.0,
      graduationYear: 2025,
      applicationDeadline: new Date(Date.now() + 86400000),
      driveDate: new Date(Date.now() + 172800000),
      status: 'CLOSED',
    }, adminToken);
    const closedDriveId = closedDriveRes.body.data._id;

    // Student view list: must NOT see CLOSED drive
    const studentListRes = await makeRequest('/drives', 'GET', null, studentToken);
    assert(studentListRes.statusCode === 200, 'Student fetched drives list');
    const studentSeesClosed = studentListRes.body.data.drives.some((d) => d._id === closedDriveId);
    assert(!studentSeesClosed, 'Student CANNOT view CLOSED/archived drives');

    // Admin view list: CAN see CLOSED drive
    const adminListRes = await makeRequest('/drives', 'GET', null, adminToken);
    assert(adminListRes.statusCode === 200, 'Admin fetched drives list');
    const adminSeesClosed = adminListRes.body.data.drives.some((d) => d._id === closedDriveId);
    assert(adminSeesClosed, 'Admin CAN view all drives including CLOSED status');

    // 6. Search Drives
    console.log('\n--- 6. Testing Drive Search ---');
    const searchRes = await makeRequest('/drives?search=Trainee', 'GET', null, studentToken);
    assert(searchRes.statusCode === 200, 'Search query executed');
    assert(searchRes.body.data.drives.some((d) => d._id === driveId), 'Drive found by matching job role search');

    // 7. Branch & Year Filtering
    console.log('\n--- 7. Testing Branch & Year Filters ---');
    const branchRes = await makeRequest('/drives?branch=CSE', 'GET', null, studentToken);
    assert(branchRes.statusCode === 200, 'Branch filter executed');
    assert(branchRes.body.data.drives.some((d) => d.eligibleBranches.includes('CSE')), 'Eligible branches match CSE filter');

    const yearRes = await makeRequest('/drives?year=2026', 'GET', null, studentToken);
    assert(yearRes.statusCode === 200, 'Year filter executed');
    assert(yearRes.body.data.drives.every((d) => d.graduationYear === 2026), 'Graduation year matches 2026');

    // 8. Package Filter
    console.log('\n--- 8. Testing Minimum CTC Filter ---');
    const pkgRes = await makeRequest('/drives?minPackage=10', 'GET', null, studentToken);
    assert(pkgRes.statusCode === 200, 'Min package filter executed');
    assert(pkgRes.body.data.drives.every((d) => d.package >= 10), 'All returned drives have package >= 10 LPA');

    // 9. View Single Drive Details
    console.log('\n--- 9. Testing Drive Details (GET /api/drives/:id) ---');
    const singleDriveRes = await makeRequest(`/drives/${driveId}`, 'GET', null, studentToken);
    assert(singleDriveRes.statusCode === 200, 'Drive details fetched with HTTP 200 OK');
    assert(singleDriveRes.body.data.applicantCount === 0, 'Applicant count initialized to 0');
    assert(singleDriveRes.body.data.company.website === 'https://careers.microsoft.com', 'Company website populated');

    // 10. Update Drive (PUT /api/drives/:id)
    console.log('\n--- 10. Testing Drive Update ---');
    const updateRes = await makeRequest(`/drives/${driveId}`, 'PUT', {
      package: 16.0,
      numberOfPositions: 25,
      status: 'ONGOING',
    }, adminToken);
    assert(updateRes.statusCode === 200, 'Drive updated with HTTP 200 OK');
    assert(updateRes.body.data.package === 16.0, 'Package updated to 16.0 LPA');
    assert(updateRes.body.data.status === 'ONGOING', 'Status updated to ONGOING');

    // 11. Delete Drive (DELETE /api/drives/:id)
    console.log('\n--- 11. Testing Drive Deletion / Cancellation ---');
    const deleteRes = await makeRequest(`/drives/${closedDriveId}`, 'DELETE', null, adminToken);
    assert(deleteRes.statusCode === 200, 'Drive deleted with HTTP 200 OK');

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
