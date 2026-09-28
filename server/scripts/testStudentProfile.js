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
  console.log('👤 CampusHire – Student Profile Management Test Suite');
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
  const testStudentEmail = `profile_test_${timestamp}@college.edu`;
  const testStudentRoll = `IT${timestamp.toString().slice(-4)}`;

  try {
    // 1. Setup: Register a student
    console.log('\n--- 1. Setting Up Student Account ---');
    const regRes = await makeRequest('/auth/register', 'POST', {
      name: 'Rohan Verma',
      email: testStudentEmail,
      password: 'Password@123',
      rollNumber: testStudentRoll,
      department: 'CSE',
      batchYear: 2025,
      cgpa: 8.2,
    });
    assert(regRes.statusCode === 201, 'Student created for profile testing');
    const studentToken = regRes.body.data.token;

    // 2. Setup: Register an admin
    const adminRegRes = await makeRequest('/auth/register-admin', 'POST', {
      name: 'Placement Admin',
      email: `admin_${timestamp}@college.edu`,
      password: 'AdminPassword123',
      role: 'admin',
    });
    const adminToken = adminRegRes.body.data.token;

    // 3. GET /api/students/profile with Student Token
    console.log('\n--- 2. Testing View Profile (GET /api/students/profile) ---');
    const getRes = await makeRequest('/students/profile', 'GET', null, studentToken);
    assert(getRes.statusCode === 200, 'Student profile fetched with HTTP 200 OK', `Got: ${getRes.statusCode}`);
    assert(getRes.body.data.rollNumber === testStudentRoll, 'Returned profile belongs to logged-in student');
    assert(getRes.body.data.user.email === testStudentEmail, 'Profile user object populated');

    // 4. Unauthorized Access Checks
    console.log('\n--- 3. Testing Authentication & Authorization Guards ---');
    const noTokenRes = await makeRequest('/students/profile', 'GET', null, null);
    assert(noTokenRes.statusCode === 401, 'Missing token rejected with HTTP 401 Unauthorized');

    const adminAccessRes = await makeRequest('/students/profile', 'GET', null, adminToken);
    assert(adminAccessRes.statusCode === 403, 'Admin blocked from student-only profile route with HTTP 403 Forbidden');

    // 5. Update Profile with Valid Data
    console.log('\n--- 4. Testing Profile Update (PUT /api/students/profile) ---');
    const updatePayload = {
      department: 'IT',
      batchYear: 2026,
      cgpa: 9.35,
      activeBacklogs: 0,
      historyBacklogs: 1,
      skills: ['React', 'Node.js', 'Express', 'MongoDB', 'Docker', 'Tailwind CSS'],
      programmingLanguages: ['JavaScript', 'Python', 'C++'],
      projects: [
        {
          title: 'CampusHire Portal',
          description: 'A recruitment and placement management system for college.',
          techStack: ['Node.js', 'React', 'MongoDB'],
          projectUrl: 'https://campushire.demo.edu',
          githubUrl: 'https://github.com/rohanverma/campushire',
        },
        {
          title: 'AI Code Reviewer',
          description: 'Automated syntax and performance analyzer.',
          techStack: ['Python', 'FastAPI'],
          githubUrl: 'https://github.com/rohanverma/ai-reviewer',
        },
      ],
      certifications: [
        {
          name: 'AWS Certified Cloud Practitioner',
          issuingOrganization: 'Amazon Web Services',
          issueDate: new Date('2025-05-15'),
          credentialUrl: 'https://aws.amazon.com/verification/12345',
        },
      ],
      githubUrl: 'https://github.com/rohanverma',
      linkedinUrl: 'https://linkedin.com/in/rohanverma',
      phone: '9876543210',
      gender: 'Male',
      // Attempt to tamper with admin-only fields
      placementStatus: 'Placed',
      currentHighestCtc: 45,
    };

    const updateRes = await makeRequest('/students/profile', 'PUT', updatePayload, studentToken);
    assert(updateRes.statusCode === 200, 'Profile updated successfully with HTTP 200 OK', `Got: ${updateRes.statusCode}`);
    
    const updatedData = updateRes.body.data;
    assert(updatedData.department === 'IT', 'Branch updated to IT');
    assert(updatedData.batchYear === 2026, 'Graduation year updated to 2026');
    assert(updatedData.cgpa === 9.35, 'CGPA updated to 9.35');
    assert(updatedData.activeBacklogs === 0, 'Active backlogs updated to 0');
    assert(updatedData.historyBacklogs === 1, 'History backlogs updated to 1');
    assert(updatedData.skills.length === 6, '6 technical skills saved');
    assert(updatedData.programmingLanguages.includes('Python'), 'Programming languages saved');
    assert(updatedData.projects.length === 2, '2 projects saved with links');
    assert(updatedData.certifications.length === 1, 'Certification saved with credential link');
    assert(updatedData.githubUrl === 'https://github.com/rohanverma', 'GitHub profile URL saved');
    assert(updatedData.linkedinUrl === 'https://linkedin.com/in/rohanverma', 'LinkedIn profile URL saved');

    // 6. Security Check: Admin-only fields are NOT modified
    console.log('\n--- 5. Testing Protection of Admin-Only Fields ---');
    assert(updatedData.placementStatus === 'Unplaced', 'Student cannot modify placementStatus (remains Unplaced)');
    assert(updatedData.currentHighestCtc === 0, 'Student cannot modify currentHighestCtc (remains 0)');

    // 7. Validation: Invalid CGPA
    console.log('\n--- 6. Testing Input Validations ---');
    const invalidCgpaRes = await makeRequest('/students/profile', 'PUT', { cgpa: 11.5 }, studentToken);
    assert(invalidCgpaRes.statusCode === 400, 'Invalid CGPA (> 10.0) rejected with HTTP 400 Bad Request');

    // 8. Validation: Invalid Year
    const invalidYearRes = await makeRequest('/students/profile', 'PUT', { batchYear: 2150 }, studentToken);
    assert(invalidYearRes.statusCode === 400, 'Invalid batch year rejected with HTTP 400 Bad Request');

    // 9. Validation: Invalid URL
    const invalidUrlRes = await makeRequest('/students/profile', 'PUT', { githubUrl: 'not-a-valid-url' }, studentToken);
    assert(invalidUrlRes.statusCode === 400, 'Invalid URL format rejected with HTTP 400 Bad Request');

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
