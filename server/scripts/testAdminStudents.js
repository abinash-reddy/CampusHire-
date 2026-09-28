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
  console.log('🏛️  CampusHire – Admin Student Management Test Suite');
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
    // 1. Setup: Register Admin
    console.log('\n--- 1. Setting Up Admin Account ---');
    const adminRes = await makeRequest('/auth/register-admin', 'POST', {
      name: 'Director of Placements',
      email: `admin_dir_${timestamp}@college.edu`,
      password: 'AdminPassword123',
      role: 'admin',
    });
    assert(adminRes.statusCode === 201, 'Admin account created');
    const adminToken = adminRes.body.data.token;

    // 2. Setup: Register 3 Diverse Students
    console.log('\n--- 2. Creating Diverse Test Students ---');
    const student1 = await makeRequest('/auth/register', 'POST', {
      name: 'Priya Sharma',
      email: `priya_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `CS_${timestamp.toString().slice(-4)}`,
      department: 'CSE',
      batchYear: 2026,
      cgpa: 9.4,
      skills: ['Python', 'Django', 'React'],
    });

    const student2 = await makeRequest('/auth/register', 'POST', {
      name: 'Karan Patel',
      email: `karan_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `EC_${timestamp.toString().slice(-4)}`,
      department: 'ECE',
      batchYear: 2025,
      cgpa: 7.8,
      skills: ['Embedded Systems', 'VLSI', 'C++'],
    });

    const student3 = await makeRequest('/auth/register', 'POST', {
      name: 'Ananya Roy',
      email: `ananya_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `IT_${timestamp.toString().slice(-4)}`,
      department: 'IT',
      batchYear: 2026,
      cgpa: 8.9,
      skills: ['Java', 'Spring Boot', 'SQL'],
    });

    assert(student1.statusCode === 201 && student2.statusCode === 201 && student3.statusCode === 201, '3 test students created');
    const studentToken = student1.body.data.token;
    const student1Id = student1.body.data.student._id;

    // 3. Security: Role and Authentication Guards
    console.log('\n--- 3. Testing RBAC Security on Admin Endpoints ---');
    const noTokenRes = await makeRequest('/admin/students', 'GET');
    assert(noTokenRes.statusCode === 401, 'Missing token rejected with HTTP 401 Unauthorized');

    const studentForbiddenRes = await makeRequest('/admin/students', 'GET', null, studentToken);
    assert(studentForbiddenRes.statusCode === 403, 'Student blocked from /api/admin/students with HTTP 403 Forbidden');

    // 4. View All Students as Admin
    console.log('\n--- 4. Testing Admin View Students (GET /api/admin/students) ---');
    const allStudentsRes = await makeRequest('/admin/students', 'GET', null, adminToken);
    assert(allStudentsRes.statusCode === 200, 'Admin fetched students list with HTTP 200 OK');
    assert(Array.isArray(allStudentsRes.body.data.students), 'Students returned as an array');
    assert(allStudentsRes.body.data.pagination.total >= 3, 'Total count includes registered students');
    assert(allStudentsRes.body.data.students[0].user.password === undefined, 'Passwords strictly stripped from user records');

    // 5. Pagination
    console.log('\n--- 5. Testing Pagination ---');
    const pagedRes = await makeRequest('/admin/students?page=1&limit=2', 'GET', null, adminToken);
    assert(pagedRes.statusCode === 200, 'Paginated query executed successfully');
    assert(pagedRes.body.data.students.length <= 2, 'Page size limited to 2 items');
    assert(pagedRes.body.data.pagination.limit === 2, 'Pagination limit metadata correct');
    assert(pagedRes.body.data.pagination.page === 1, 'Pagination current page metadata correct');

    // 6. Branch / Department Filter
    console.log('\n--- 6. Testing Branch Filter ---');
    const eceRes = await makeRequest('/admin/students?branch=ECE', 'GET', null, adminToken);
    assert(eceRes.statusCode === 200, 'Branch filter returned HTTP 200');
    const onlyEce = eceRes.body.data.students.every((s) => s.department === 'ECE');
    assert(onlyEce, 'All filtered results have department === ECE');

    // 7. Year Filter
    console.log('\n--- 7. Testing Year Filter ---');
    const year2025Res = await makeRequest('/admin/students?year=2025', 'GET', null, adminToken);
    assert(year2025Res.statusCode === 200, 'Year filter returned HTTP 200');
    const only2025 = year2025Res.body.data.students.every((s) => s.batchYear === 2025);
    assert(only2025, 'All filtered results have batchYear === 2025');

    // 8. Search Filter (by Name or Skill)
    console.log('\n--- 8. Testing Search (by Name and Skill) ---');
    const searchNameRes = await makeRequest('/admin/students?search=Priya', 'GET', null, adminToken);
    assert(searchNameRes.statusCode === 200, 'Search query returned HTTP 200');
    assert(searchNameRes.body.data.students.some((s) => s.user.name.includes('Priya')), 'Student found by name search');

    const searchSkillRes = await makeRequest('/admin/students?search=VLSI', 'GET', null, adminToken);
    assert(searchSkillRes.statusCode === 200, 'Search by skill returned HTTP 200');
    assert(searchSkillRes.body.data.students.some((s) => s.skills.includes('VLSI')), 'Student found by skill search');

    // 9. View Single Student Details (GET /api/admin/students/:id)
    console.log('\n--- 9. Testing Student Details (GET /api/admin/students/:id) ---');
    const singleStudentRes = await makeRequest(`/admin/students/${student1Id}`, 'GET', null, adminToken);
    assert(singleStudentRes.statusCode === 200, 'Single student details fetched with HTTP 200 OK');
    assert(singleStudentRes.body.data._id === student1Id, 'Returned student ID matches request');
    assert(singleStudentRes.body.data.user.name === 'Priya Sharma', 'Student user details populated');
    assert(singleStudentRes.body.data.applicationStats !== undefined, 'Application stats object attached');
    assert(singleStudentRes.body.data.placementStatus === 'Unplaced', 'Placement status accessible');

    // 10. Error Handling on Single Student
    console.log('\n--- 10. Testing Error Handling ---');
    const invalidIdRes = await makeRequest('/admin/students/invalid-format-id', 'GET', null, adminToken);
    assert(invalidIdRes.statusCode === 400, 'Invalid ObjectId rejected with HTTP 400 Bad Request');

    const notFoundRes = await makeRequest('/admin/students/507f1f77bcf86cd799439011', 'GET', null, adminToken);
    assert(notFoundRes.statusCode === 404, 'Non-existent student returns HTTP 404 Not Found');

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
