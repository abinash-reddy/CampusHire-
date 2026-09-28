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
  console.log('🏢 CampusHire – Company Management Test Suite');
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
    console.log('\n--- 1. Setting Up Test Accounts ---');
    const adminRes = await makeRequest('/auth/register-admin', 'POST', {
      name: 'TPO Corporate Relations',
      email: `tpo_comp_${timestamp}@college.edu`,
      password: 'AdminPassword123',
      role: 'tpo',
    });
    const adminToken = adminRes.body.data.token;

    const studentRes = await makeRequest('/auth/register', 'POST', {
      name: 'Sneha Patel',
      email: `sneha_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `CS_${timestamp.toString().slice(-4)}`,
      department: 'CSE',
      batchYear: 2026,
    });
    const studentToken = studentRes.body.data.token;
    assert(adminToken && studentToken, 'Admin and Student tokens acquired');

    // 2. Security: Student blocked from adding company
    console.log('\n--- 2. Testing RBAC on Company Creation ---');
    const studentCreateRes = await makeRequest('/companies', 'POST', {
      companyName: 'Unauthorized Tech Inc',
    }, studentToken);
    assert(studentCreateRes.statusCode === 403, 'Student blocked from POST /api/companies with HTTP 403 Forbidden');

    // 3. Admin creates valid company
    console.log('\n--- 3. Testing Company Creation by Admin ---');
    const testCompanyName = `Infosys Technologies ${timestamp}`;
    const createRes = await makeRequest('/companies', 'POST', {
      companyName: testCompanyName,
      description: 'Global leader in next-generation digital services and consulting.',
      website: 'https://www.infosys.com',
      industry: 'IT / Software',
      location: 'Bengaluru / Pune / Hyderabad',
      contactEmail: 'campus.recruitment@infosys.com',
      jobRoles: ['Systems Engineer', 'Specialist Programmer', 'Digital Specialist Engineer'],
      tier: 'Dream',
      contactPerson: {
        name: 'Arjun Mehta',
        email: 'arjun.mehta@infosys.com',
        phone: '9812345678',
      },
    }, adminToken);

    assert(createRes.statusCode === 201, 'Company created with HTTP 201 Created', `Got: ${createRes.statusCode}`);
    assert(createRes.body.data.name === testCompanyName, 'Company name stored properly');
    assert(createRes.body.data.tier === 'Dream', 'Company tier stored as Dream');
    assert(createRes.body.data.jobRoles.length === 3, '3 job roles registered');
    assert(createRes.body.data.isActive === true, 'Company active by default');
    const companyId = createRes.body.data._id;

    // 4. Duplicate Company Name Check
    console.log('\n--- 4. Testing Duplicate Company Name Prevention ---');
    const dupRes = await makeRequest('/companies', 'POST', {
      companyName: testCompanyName,
    }, adminToken);
    assert(dupRes.statusCode === 409, 'Duplicate company name rejected with HTTP 409 Conflict');

    // 5. Input Validation (Invalid URL and Email)
    console.log('\n--- 5. Testing URL & Email Validations ---');
    const invalidUrlRes = await makeRequest('/companies', 'POST', {
      companyName: `Invalid URL Co ${timestamp}`,
      website: 'not-valid-url',
    }, adminToken);
    assert(invalidUrlRes.statusCode === 400, 'Invalid website URL rejected with HTTP 400 Bad Request');

    const invalidEmailRes = await makeRequest('/companies', 'POST', {
      companyName: `Invalid Email Co ${timestamp}`,
      contactEmail: 'not-an-email',
    }, adminToken);
    assert(invalidEmailRes.statusCode === 400, 'Invalid contact email rejected with HTTP 400 Bad Request');

    // 6. Create Deactivated Company to test student isolation
    console.log('\n--- 6. Testing Active vs Inactive Visibility ---');
    const inactiveCompanyName = `Legacy Motors ${timestamp}`;
    const inactiveCompanyRes = await makeRequest('/companies', 'POST', {
      companyName: inactiveCompanyName,
      industry: 'Core Engineering',
      isActive: false,
    }, adminToken);
    const inactiveCompanyId = inactiveCompanyRes.body.data._id;

    // Student view list: must NOT see inactive company
    const studentListRes = await makeRequest('/companies', 'GET', null, studentToken);
    assert(studentListRes.statusCode === 200, 'Student fetched companies list');
    const studentSeesInactive = studentListRes.body.data.companies.some((c) => c._id === inactiveCompanyId);
    assert(!studentSeesInactive, 'Student CANNOT see inactive/deactivated companies');

    // Admin view list: CAN see inactive company
    const adminListRes = await makeRequest('/companies', 'GET', null, adminToken);
    assert(adminListRes.statusCode === 200, 'Admin fetched companies list');
    const adminSeesInactive = adminListRes.body.data.companies.some((c) => c._id === inactiveCompanyId);
    assert(adminSeesInactive, 'Admin CAN see all companies including inactive ones');

    // 7. Search Companies
    console.log('\n--- 7. Testing Company Search ---');
    const searchRes = await makeRequest(`/companies?search=Specialist`, 'GET', null, studentToken);
    assert(searchRes.statusCode === 200, 'Search query returned HTTP 200');
    assert(searchRes.body.data.companies.some((c) => c._id === companyId), 'Company found by matching job role search');

    // 8. View Single Company Details & Recruitment History
    console.log('\n--- 8. Testing Company Details & Recruitment History ---');
    const detailsRes = await makeRequest(`/companies/${companyId}`, 'GET', null, studentToken);
    assert(detailsRes.statusCode === 200, 'Company details fetched with HTTP 200 OK');
    assert(detailsRes.body.data.name === testCompanyName, 'Company name matches');
    assert(detailsRes.body.data.recruitmentHistory !== undefined, 'Recruitment history object attached');
    assert(detailsRes.body.data.recruitmentHistory.totalDrives === 0, 'Drives count tracked (0 for new company)');

    // Student viewing inactive company by ID should get 404
    const studentInactiveDetailRes = await makeRequest(`/companies/${inactiveCompanyId}`, 'GET', null, studentToken);
    assert(studentInactiveDetailRes.statusCode === 404, 'Student accessing deactivated company gets HTTP 404 Not Found');

    // 9. Update Company (PUT /api/companies/:id)
    console.log('\n--- 9. Testing Company Update ---');
    const updateRes = await makeRequest(`/companies/${companyId}`, 'PUT', {
      location: 'Pan India / Remote Options',
      tier: 'SuperDream',
      jobRoles: ['Principal Specialist Programmer', 'AI Engineer'],
    }, adminToken);
    assert(updateRes.statusCode === 200, 'Company updated with HTTP 200 OK');
    assert(updateRes.body.data.tier === 'SuperDream', 'Tier updated to SuperDream');
    assert(updateRes.body.data.location === 'Pan India / Remote Options', 'Location updated');

    // 10. Deactivate Company (DELETE /api/companies/:id)
    console.log('\n--- 10. Testing Company Deactivation (Soft Delete) ---');
    const deleteRes = await makeRequest(`/companies/${companyId}`, 'DELETE', null, adminToken);
    assert(deleteRes.statusCode === 200, 'Company deactivated with HTTP 200 OK');
    assert(deleteRes.body.data.isActive === false, 'Company status is now false (deactivated)');

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
