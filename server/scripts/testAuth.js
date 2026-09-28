const http = require('http');

const API_BASE = 'http://localhost:5000/api/auth';

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
  console.log('🔐 CampusHire – Authentication & RBAC Test Suite');
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
  const testStudentEmail = `student_${timestamp}@college.edu`;
  const testStudentRoll = `CS${timestamp.toString().slice(-4)}`;
  const testPassword = 'Password@123';

  try {
    // 1. Student Registration
    console.log('\n--- 1. Testing Student Registration ---');
    const regRes = await makeRequest('/register', 'POST', {
      name: 'Aditi Sharma',
      email: testStudentEmail,
      password: testPassword,
      rollNumber: testStudentRoll,
      department: 'CSE',
      batchYear: 2026,
      cgpa: 8.75,
      phone: '9876543210',
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    });

    assert(regRes.statusCode === 201, 'Student registered with HTTP 201', `Got: ${regRes.statusCode}`);
    assert(!!regRes.body.data.token, 'Registration returns JWT token');
    assert(regRes.body.data.user.role === 'student', "User role is 'student'");
    assert(regRes.body.data.user.password === undefined, 'Password hash is NOT exposed in response');
    assert(regRes.body.data.student.rollNumber === testStudentRoll, 'Linked student profile created');

    const studentToken = regRes.body.data.token;

    // 2. Duplicate Email Check
    console.log('\n--- 2. Testing Duplicate Email Prevention ---');
    const dupEmailRes = await makeRequest('/register', 'POST', {
      name: 'Duplicate User',
      email: testStudentEmail,
      password: 'AnotherPassword123',
      rollNumber: `CS${(timestamp + 1).toString().slice(-4)}`,
      department: 'CSE',
      batchYear: 2026,
    });
    assert(dupEmailRes.statusCode === 409, 'Duplicate email rejected with HTTP 409 Conflict', `Got: ${dupEmailRes.statusCode}`);

    // 3. Duplicate Roll Number Check
    console.log('\n--- 3. Testing Duplicate Roll Number Prevention ---');
    const dupRollRes = await makeRequest('/register', 'POST', {
      name: 'Another User',
      email: `other_${timestamp}@college.edu`,
      password: 'AnotherPassword123',
      rollNumber: testStudentRoll, // duplicate roll number
      department: 'IT',
      batchYear: 2026,
    });
    assert(dupRollRes.statusCode === 409, 'Duplicate roll number rejected with HTTP 409 Conflict', `Got: ${dupRollRes.statusCode}`);

    // 4. Missing Required Field Validation
    console.log('\n--- 4. Testing Input Validation ---');
    const invalidRegRes = await makeRequest('/register', 'POST', {
      email: `missing_${timestamp}@college.edu`,
      // missing name, password, rollNumber
    });
    assert(invalidRegRes.statusCode === 400, 'Missing fields rejected with HTTP 400 Bad Request', `Got: ${invalidRegRes.statusCode}`);

    // 5. Admin Registration
    console.log('\n--- 5. Testing Admin / TPO Registration ---');
    const testAdminEmail = `tpo_${timestamp}@college.edu`;
    const adminRegRes = await makeRequest('/register-admin', 'POST', {
      name: 'Prof. Rajesh Kumar (TPO)',
      email: testAdminEmail,
      password: testPassword,
      role: 'tpo',
    });
    assert(adminRegRes.statusCode === 201, 'TPO / Admin registered with HTTP 201', `Got: ${adminRegRes.statusCode}`);
    assert(adminRegRes.body.data.user.role === 'tpo', "User role is 'tpo'");
    const adminToken = adminRegRes.body.data.token;

    // 6. Student Login
    console.log('\n--- 6. Testing Login Authentication ---');
    const loginRes = await makeRequest('/login', 'POST', {
      email: testStudentEmail,
      password: testPassword,
    });
    assert(loginRes.statusCode === 200, 'Student login successful with HTTP 200', `Got: ${loginRes.statusCode}`);
    assert(!!loginRes.body.data.token, 'Login returns JWT token');
    assert(loginRes.body.data.user.password === undefined, 'Password is not exposed in login response');

    // 7. Invalid Password Login
    console.log('\n--- 7. Testing Invalid Password Rejection ---');
    const wrongPassRes = await makeRequest('/login', 'POST', {
      email: testStudentEmail,
      password: 'WrongPassword!',
    });
    assert(wrongPassRes.statusCode === 401, 'Invalid password rejected with HTTP 401 Unauthorized', `Got: ${wrongPassRes.statusCode}`);

    // 8. Protected Route (GET /api/auth/me) with Token
    console.log('\n--- 8. Testing Protected Route (GET /api/auth/me) ---');
    const meRes = await makeRequest('/me', 'GET', null, studentToken);
    assert(meRes.statusCode === 200, 'Authenticated user profile retrieved with HTTP 200', `Got: ${meRes.statusCode}`);
    assert(meRes.body.data.user.email === testStudentEmail, 'Profile email matches authenticated user');
    assert(meRes.body.data.student.rollNumber === testStudentRoll, 'Profile includes student record');

    // 9. Protected Route without Token
    console.log('\n--- 9. Testing Token Requirement ---');
    const noTokenRes = await makeRequest('/me', 'GET', null, null);
    assert(noTokenRes.statusCode === 401, 'Missing token rejected with HTTP 401 Unauthorized', `Got: ${noTokenRes.statusCode}`);

    // 10. Role-Based Access Control (RBAC)
    console.log('\n--- 10. Testing RBAC Authorization ---');
    // Student attempting to access Admin-only route
    const studentAccessAdminRoute = await makeRequest('/admin-only', 'GET', null, studentToken);
    assert(studentAccessAdminRoute.statusCode === 403, 'Student blocked from admin route with HTTP 403 Forbidden', `Got: ${studentAccessAdminRoute.statusCode}`);

    // Admin accessing Admin-only route
    const adminAccessAdminRoute = await makeRequest('/admin-only', 'GET', null, adminToken);
    assert(adminAccessAdminRoute.statusCode === 200, 'Admin granted access to admin route with HTTP 200 OK', `Got: ${adminAccessAdminRoute.statusCode}`);

    // Student accessing Student-only route
    const studentAccessStudentRoute = await makeRequest('/student-only', 'GET', null, studentToken);
    assert(studentAccessStudentRoute.statusCode === 200, 'Student granted access to student route with HTTP 200 OK', `Got: ${studentAccessStudentRoute.statusCode}`);

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
