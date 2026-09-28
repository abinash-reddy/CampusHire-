/**
 * CampusHire - Placement Analytics Test Suite (Phase 17)
 * Tests:
 * 1. Admin Analytics Overview (Total/Registered Students, Companies, Active Drives, Applications, Shortlisted, Selected, Rejected)
 * 2. Branch-Wise Placement Counts suitable for dashboard charts
 * 3. Company-Wise Application Counts suitable for dashboard charts
 * 4. Drive-Wise Application Counts
 * 5. Strict Role-Based Access Control (Admin/TPO only, Students forbidden, unauthenticated 401)
 */

const http = require('http');

const PORT = process.env.PORT || 5000;
const BASE_HOST = '127.0.0.1';

let passedTests = 0;
let failedTests = 0;

const assert = (condition, message) => {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failedTests++;
  }
};

const makeRequest = (path, method = 'GET', data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const options = {
      hostname: BASE_HOST,
      port: PORT,
      path: path.startsWith('/api') ? path : `/api${path}`,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ statusCode: res.statusCode, body: parsed, raw: body });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body, raw: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
};

const runAnalyticsTestSuite = async () => {
  console.log('====================================================');
  console.log('📊 CampusHire – Phase 17: Placement Analytics Test Suite');
  console.log('====================================================\n');

  try {
    const timestamp = Date.now();

    // 1. Setup Admin Account
    console.log('--- 1. Setting Up Test Accounts & Environment ---');
    const adminEmail = `analytics_admin_${timestamp}@campushire.edu`;
    const adminRegister = await makeRequest('/auth/register-admin', 'POST', {
      name: 'Dr. Placement Director',
      email: adminEmail,
      password: 'AdminPassword@123',
      role: 'admin',
    });
    assert(adminRegister.statusCode === 201, 'Admin account registered successfully');
    const adminToken = adminRegister.body.data.token;

    // 2. Setup Companies
    const company1Res = await makeRequest('/companies', 'POST', {
      name: `Apex Analytics Corp ${timestamp}`,
      industry: 'IT / Software',
      tier: 'SuperDream',
      website: 'https://apexcorp.io',
      location: 'Hyderabad, India',
    }, adminToken);
    assert(company1Res.statusCode === 201, 'Hiring Partner Company 1 created');
    const company1Id = company1Res.body.data._id;

    const company2Res = await makeRequest('/companies', 'POST', {
      name: `Core Systems Ltd ${timestamp}`,
      industry: 'Core Engineering',
      tier: 'Dream',
      website: 'https://coresystems.com',
      location: 'Bengaluru, India',
    }, adminToken);
    assert(company2Res.statusCode === 201, 'Hiring Partner Company 2 created');
    const company2Id = company2Res.body.data._id;

    // 3. Setup Recruitment Drives (Active OPEN drives + CLOSED drive)
    const deadlineFuture = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const driveDateFuture = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const drive1Res = await makeRequest('/drives', 'POST', {
      company: company1Id,
      jobRole: 'Software Development Engineer',
      jobDescription: 'Design scalable full-stack applications',
      package: 18.0,
      eligibleBranches: ['CSE', 'IT', 'ECE'],
      minimumCGPA: 7.0,
      maximumBacklogs: 0,
      graduationYear: 2026,
      applicationDeadline: deadlineFuture,
      driveDate: driveDateFuture,
      status: 'OPEN',
    }, adminToken);
    assert(drive1Res.statusCode === 201, 'Active Recruitment Drive 1 created (OPEN)');
    const drive1Id = drive1Res.body.data._id;

    const drive2Res = await makeRequest('/drives', 'POST', {
      company: company2Id,
      jobRole: 'Hardware Embedded Engineer',
      jobDescription: 'Firmware and IoT systems development',
      package: 12.0,
      eligibleBranches: ['ECE', 'EEE'],
      minimumCGPA: 6.5,
      maximumBacklogs: 1,
      graduationYear: 2026,
      applicationDeadline: deadlineFuture,
      driveDate: driveDateFuture,
      status: 'OPEN',
    }, adminToken);
    assert(drive2Res.statusCode === 201, 'Active Recruitment Drive 2 created (OPEN)');
    const drive2Id = drive2Res.body.data._id;

    // Closed Drive (for testing active filter)
    const driveClosedRes = await makeRequest('/drives', 'POST', {
      company: company1Id,
      jobRole: 'Frontend Intern',
      jobDescription: 'Archived internship drive',
      package: 6.0,
      eligibleBranches: ['CSE', 'IT'],
      minimumCGPA: 6.0,
      maximumBacklogs: 0,
      graduationYear: 2026,
      applicationDeadline: deadlineFuture,
      driveDate: driveDateFuture,
      status: 'CLOSED',
    }, adminToken);
    assert(driveClosedRes.statusCode === 201, 'Closed Drive created');

    // 4. Register Students across various branches (CSE, IT, ECE)
    // Student 1 (CSE)
    const s1Res = await makeRequest('/auth/register', 'POST', {
      name: 'Aarav Sharma',
      email: `aarav_cse_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `CSE_${timestamp.toString().slice(-4)}`,
      department: 'CSE',
      batchYear: 2026,
    });
    const s1Token = s1Res.body.data.token;
    await makeRequest('/students/profile', 'PUT', { cgpa: 9.1 }, s1Token);
    const s1Profile = await makeRequest('/students/profile', 'GET', null, s1Token);
    const s1StudentId = s1Profile.body.data._id;

    // Student 2 (IT)
    const s2Res = await makeRequest('/auth/register', 'POST', {
      name: 'Diya Patel',
      email: `diya_it_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `IT_${(timestamp + 1).toString().slice(-4)}`,
      department: 'IT',
      batchYear: 2026,
    });
    const s2Token = s2Res.body.data.token;
    await makeRequest('/students/profile', 'PUT', { cgpa: 8.8 }, s2Token);
    const s2Profile = await makeRequest('/students/profile', 'GET', null, s2Token);
    const s2StudentId = s2Profile.body.data._id;

    // Student 3 (ECE)
    const s3Res = await makeRequest('/auth/register', 'POST', {
      name: 'Rohan Verma',
      email: `rohan_ece_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `ECE_${(timestamp + 2).toString().slice(-4)}`,
      department: 'ECE',
      batchYear: 2026,
    });
    const s3Token = s3Res.body.data.token;
    await makeRequest('/students/profile', 'PUT', { cgpa: 7.8 }, s3Token);
    const s3Profile = await makeRequest('/students/profile', 'GET', null, s3Token);
    const s3StudentId = s3Profile.body.data._id;

    // Student 4 (ECE)
    const s4Res = await makeRequest('/auth/register', 'POST', {
      name: 'Sneha Reddy',
      email: `sneha_ece_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `ECE_${(timestamp + 3).toString().slice(-4)}`,
      department: 'ECE',
      batchYear: 2026,
    });
    const s4Token = s4Res.body.data.token;
    await makeRequest('/students/profile', 'PUT', { cgpa: 8.2 }, s4Token);
    const s4Profile = await makeRequest('/students/profile', 'GET', null, s4Token);
    const s4StudentId = s4Profile.body.data._id;

    // 5. Submit Applications
    const app1 = await makeRequest('/applications', 'POST', { driveId: drive1Id }, s1Token);
    const app2 = await makeRequest('/applications', 'POST', { driveId: drive1Id }, s2Token);
    const app3 = await makeRequest('/applications', 'POST', { driveId: drive1Id }, s3Token);
    const app4 = await makeRequest('/applications', 'POST', { driveId: drive2Id }, s4Token);
    assert(
      app1.statusCode === 201 && app2.statusCode === 201 && app3.statusCode === 201 && app4.statusCode === 201,
      'Candidates submitted applications successfully'
    );

    // Shortlist applications
    await makeRequest(`/admin/applications/${app1.body.data._id}/status`, 'PUT', { status: 'SHORTLISTED' }, adminToken);
    await makeRequest(`/admin/applications/${app2.body.data._id}/status`, 'PUT', { status: 'SHORTLISTED' }, adminToken);
    await makeRequest(`/admin/applications/${app4.body.data._id}/status`, 'PUT', { status: 'SHORTLISTED' }, adminToken);

    // 6. Publish Placement Results
    // S1 -> SELECTED at 18.0 LPA
    const r1 = await makeRequest('/results', 'POST', {
      student: s1StudentId,
      recruitmentDrive: drive1Id,
      company: company1Id,
      jobRole: 'Software Development Engineer',
      package: 18.0,
      status: 'SELECTED',
    }, adminToken);
    assert(r1.statusCode === 201, 'Placement result published: Student 1 (CSE) SELECTED at 18 LPA');

    // S2 -> SELECTED at 18.0 LPA
    const r2 = await makeRequest('/results', 'POST', {
      student: s2StudentId,
      recruitmentDrive: drive1Id,
      company: company1Id,
      jobRole: 'Software Development Engineer',
      package: 18.0,
      status: 'SELECTED',
    }, adminToken);
    assert(r2.statusCode === 201, 'Placement result published: Student 2 (IT) SELECTED at 18 LPA');

    // S3 -> REJECTED
    const r3 = await makeRequest('/results', 'POST', {
      student: s3StudentId,
      recruitmentDrive: drive1Id,
      company: company1Id,
      jobRole: 'Software Development Engineer',
      package: 18.0,
      status: 'REJECTED',
    }, adminToken);
    assert(r3.statusCode === 201, 'Placement result published: Student 3 (ECE) REJECTED');

    // S4 -> WAITLISTED
    const r4 = await makeRequest('/results', 'POST', {
      student: s4StudentId,
      recruitmentDrive: drive2Id,
      company: company2Id,
      jobRole: 'Hardware Embedded Engineer',
      package: 12.0,
      status: 'WAITLISTED',
    }, adminToken);
    assert(r4.statusCode === 201, 'Placement result published: Student 4 (ECE) WAITLISTED');

    // 2. Testing GET /api/admin/analytics/overview
    console.log('\n--- 2. Testing GET /api/admin/analytics/overview ---');
    const overviewRes = await makeRequest('/admin/analytics/overview', 'GET', null, adminToken);
    assert(overviewRes.statusCode === 200, 'GET /api/admin/analytics/overview returns 200 OK');
    assert(overviewRes.body.success === true, 'Response payload has success: true');

    const overview = overviewRes.body.data;
    assert(typeof overview.totalStudents === 'number' && overview.totalStudents >= 4, 'Reports totalStudents >= 4');
    assert(typeof overview.registeredStudents === 'number' && overview.registeredStudents >= 4, 'Reports registeredStudents >= 4');
    assert(typeof overview.totalCompanies === 'number' && overview.totalCompanies >= 2, 'Reports totalCompanies >= 2');
    assert(typeof overview.activeRecruitmentDrives === 'number' && overview.activeRecruitmentDrives >= 2, 'Reports activeRecruitmentDrives (OPEN drives)');
    assert(typeof overview.totalApplications === 'number' && overview.totalApplications >= 4, 'Reports totalApplications >= 4');
    assert(typeof overview.shortlistedStudents === 'number' && overview.shortlistedStudents >= 1, 'Reports shortlistedStudents count');
    assert(typeof overview.selectedStudents === 'number' && overview.selectedStudents >= 2, 'Reports selectedStudents >= 2');
    assert(typeof overview.rejectedStudents === 'number' && overview.rejectedStudents >= 1, 'Reports rejectedStudents >= 1');
    assert(typeof overview.placementRate === 'number' && overview.placementRate > 0, 'Computes college placementRate %');
    assert(Array.isArray(overview.branchWisePlacementCounts), 'Provides branchWisePlacementCounts array in overview');
    assert(Array.isArray(overview.companyWiseApplicationCounts), 'Provides companyWiseApplicationCounts array in overview');
    assert(Array.isArray(overview.driveWiseApplicationCounts), 'Provides driveWiseApplicationCounts array in overview');

    // 3. Testing GET /api/admin/analytics/branches
    console.log('\n--- 3. Testing GET /api/admin/analytics/branches ---');
    const branchRes = await makeRequest('/admin/analytics/branches', 'GET', null, adminToken);
    assert(branchRes.statusCode === 200, 'GET /api/admin/analytics/branches returns 200 OK');
    assert(branchRes.body.success === true, 'Branches endpoint has success: true');

    const branches = Array.isArray(branchRes.body.data) ? branchRes.body.data : branchRes.body.branches;
    assert(Array.isArray(branches), 'Returns an array of branch analytics suitable for charts');
    assert(branches.length >= 3, 'Contains branch statistics for at least CSE, IT, and ECE');

    const cseBranch = branches.find((b) => b.branch === 'CSE' || b.department === 'CSE');
    assert(cseBranch !== undefined, 'CSE branch is present in branch analytics');
    assert(cseBranch.totalStudents >= 1, 'CSE branch tracks totalStudents');
    assert(cseBranch.placedStudents >= 1, 'CSE branch tracks placedStudents >= 1');
    assert(typeof cseBranch.placementRate === 'number' && cseBranch.placementRate > 0, 'CSE branch reports positive placement rate');
    assert(cseBranch.highestPackage === 18.0, 'CSE branch reports highestPackage of 18 LPA');

    const itBranch = branches.find((b) => b.branch === 'IT' || b.department === 'IT');
    assert(itBranch !== undefined, 'IT branch is present in branch analytics');
    assert(itBranch.placedStudents >= 1, 'IT branch tracks placedStudents');

    const eceBranch = branches.find((b) => b.branch === 'ECE' || b.department === 'ECE');
    assert(eceBranch !== undefined, 'ECE branch is present in branch analytics');
    assert(eceBranch.totalStudents >= 2, 'ECE branch tracks 2 students');

    // 4. Testing GET /api/admin/analytics/companies
    console.log('\n--- 4. Testing GET /api/admin/analytics/companies ---');
    const companyRes = await makeRequest('/admin/analytics/companies', 'GET', null, adminToken);
    assert(companyRes.statusCode === 200, 'GET /api/admin/analytics/companies returns 200 OK');
    assert(companyRes.body.success === true, 'Companies endpoint has success: true');

    const companies = Array.isArray(companyRes.body.data) ? companyRes.body.data : companyRes.body.companies;
    assert(Array.isArray(companies), 'Returns an array of company analytics suitable for charts');
    assert(companies.length >= 2, 'Contains company statistics for created hiring partners');

    const comp1Data = companies.find((c) => String(c.companyId) === String(company1Id));
    assert(comp1Data !== undefined, 'Company 1 found in company analytics');
    assert(comp1Data.companyName.includes('Apex Analytics Corp'), 'Reports accurate company name');
    assert(comp1Data.totalApplications >= 3, 'Company 1 reports totalApplications >= 3');
    assert(comp1Data.selectedCount >= 2, 'Company 1 reports selectedCount >= 2');
    assert(typeof comp1Data.shortlistedCount === 'number', 'Company 1 reports shortlistedCount (numeric)');
    assert(comp1Data.rejectedCount >= 1, 'Company 1 reports rejectedCount >= 1');
    assert(comp1Data.drivesCount >= 2, 'Company 1 tracks associated recruitment drives count');

    const comp2Data = companies.find((c) => String(c.companyId) === String(company2Id));
    assert(comp2Data !== undefined, 'Company 2 found in company analytics');
    assert(comp2Data.totalApplications >= 1, 'Company 2 reports totalApplications >= 1');
    assert(comp2Data.shortlistedCount >= 1, 'Company 2 reports shortlistedCount >= 1');

    // 5. Testing GET /api/admin/analytics/drives
    console.log('\n--- 5. Testing GET /api/admin/analytics/drives ---');
    const driveRes = await makeRequest('/admin/analytics/drives', 'GET', null, adminToken);
    assert(driveRes.statusCode === 200, 'GET /api/admin/analytics/drives returns 200 OK');
    const drivesData = Array.isArray(driveRes.body.data) ? driveRes.body.data : driveRes.body.drives;
    assert(Array.isArray(drivesData), 'Drive-wise analytics returned as array');
    const drive1Stats = drivesData.find((d) => String(d.driveId) === String(drive1Id));
    assert(drive1Stats !== undefined, 'Drive 1 found in drive analytics');
    assert(drive1Stats.totalApplications >= 3, 'Drive 1 tracks 3 total applications');
    assert(drive1Stats.selectedStudents >= 2, 'Drive 1 tracks 2 selected students');

    // 6. Testing Role-Based Access Control (Admin-only)
    console.log('\n--- 6. Testing Role-Based Access Control & Security ---');
    // Student blocked from /overview
    const studentOverview = await makeRequest('/admin/analytics/overview', 'GET', null, s1Token);
    assert(studentOverview.statusCode === 403, 'Student blocked from GET /api/admin/analytics/overview with 403 Forbidden');

    // Student blocked from /branches
    const studentBranches = await makeRequest('/admin/analytics/branches', 'GET', null, s1Token);
    assert(studentBranches.statusCode === 403, 'Student blocked from GET /api/admin/analytics/branches with 403 Forbidden');

    // Student blocked from /companies
    const studentCompanies = await makeRequest('/admin/analytics/companies', 'GET', null, s1Token);
    assert(studentCompanies.statusCode === 403, 'Student blocked from GET /api/admin/analytics/companies with 403 Forbidden');

    // Unauthenticated request rejected
    const unauthRes = await makeRequest('/admin/analytics/overview', 'GET');
    assert(unauthRes.statusCode === 401, 'Unauthenticated request rejected with 401 Unauthorized');

    console.log('\n====================================================');
    console.log(`Test Results: ${passedTests} Passed, ${failedTests} Failed`);
    console.log('====================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal test runner error:', error);
    process.exit(1);
  }
};

runAnalyticsTestSuite();
