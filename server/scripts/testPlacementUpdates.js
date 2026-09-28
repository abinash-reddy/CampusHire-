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
  console.log('📢 CampusHire – Phase 14: Placement Updates Test Suite');
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
    // 1. Setup Test Accounts (Admin & Student)
    console.log('\n--- 1. Setting Up Test Accounts ---');
    const adminReg = await makeRequest('/auth/register-admin', 'POST', {
      name: 'TPO Communications Desk',
      email: `tpo_updates_${timestamp}@college.edu`,
      password: 'AdminPassword123',
      role: 'admin',
    });
    const adminToken = adminReg.body.data.token;
    assert(adminToken, 'Admin/TPO account registered');

    const studentReg = await makeRequest('/auth/register', 'POST', {
      name: 'Sneha Patel',
      email: `sneha_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `IT_${timestamp.toString().slice(-4)}`,
      department: 'IT',
      batchYear: 2026,
    });
    const studentToken = studentReg.body.data.token;
    assert(studentToken, 'Student account registered');

    // 2. Testing Category & Priority Validations on POST /api/updates
    console.log('\n--- 2. Testing Input Validations ---');
    // Invalid Category
    const invalidCatRes = await makeRequest('/updates', 'POST', {
      title: 'Invalid Category Announcement',
      description: 'Testing validation error handling',
      category: 'INVALID_CATEGORY',
      priority: 'HIGH',
    }, adminToken);
    assert(invalidCatRes.statusCode === 400, 'Invalid category rejected with 400 Bad Request');

    // Invalid Priority
    const invalidPriRes = await makeRequest('/updates', 'POST', {
      title: 'Invalid Priority Announcement',
      description: 'Testing validation error handling',
      category: 'GENERAL',
      priority: 'SUPER_URGENT',
    }, adminToken);
    assert(invalidPriRes.statusCode === 400, 'Invalid priority rejected with 400 Bad Request');

    // Missing Title
    const missingTitleRes = await makeRequest('/updates', 'POST', {
      title: '',
      description: 'Missing title',
      category: 'GENERAL',
    }, adminToken);
    assert(missingTitleRes.statusCode === 400, 'Missing title rejected with 400 Bad Request');

    // Missing Description
    const missingDescRes = await makeRequest('/updates', 'POST', {
      title: 'Missing Description Test',
      description: '',
      category: 'GENERAL',
    }, adminToken);
    assert(missingDescRes.statusCode === 400, 'Missing description rejected with 400 Bad Request');

    // 3. Testing POST /api/updates across all 6 categories
    console.log('\n--- 3. Testing POST /api/updates across All Categories ---');
    const categories = ['IMPORTANT', 'COMPANY', 'RECRUITMENT', 'INTERVIEW', 'RESULT', 'GENERAL'];
    const createdUpdateIds = {};

    for (const cat of categories) {
      const createRes = await makeRequest('/updates', 'POST', {
        title: `Official ${cat} Announcement: Placement Drive 2026`,
        description: `This is an official ${cat} bulletin for registered batch students regarding upcoming activities.`,
        category: cat,
        priority: cat === 'IMPORTANT' ? 'URGENT' : 'MEDIUM',
        publishedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      }, adminToken);

      assert(createRes.statusCode === 201, `Created update in category ${cat} (201 Created)`);
      assert(createRes.body.data.category === cat, `Category matches ${cat}`);
      assert(createRes.body.data.createdBy && createRes.body.data.createdBy.name, 'Creator user populated');
      createdUpdateIds[cat] = createRes.body.data._id;
    }

    const testUpdateId = createdUpdateIds['COMPANY'];

    // 4. Testing GET /api/updates (Students view published updates)
    console.log('\n--- 4. Testing GET /api/updates (Student Access & Filters) ---');
    const allUpdatesRes = await makeRequest('/updates', 'GET', null, studentToken);
    assert(allUpdatesRes.statusCode === 200, 'Students can access GET /api/updates (200 OK)');
    assert(Array.isArray(allUpdatesRes.body.data.updates), 'Returns updates array');
    assert(allUpdatesRes.body.data.updates.length >= 6, 'All 6 created updates returned');
    assert(allUpdatesRes.body.data.pagination && allUpdatesRes.body.data.pagination.total >= 6, 'Pagination metadata attached');

    // Filter by Category
    const compFilterRes = await makeRequest('/updates?category=COMPANY', 'GET', null, studentToken);
    assert(compFilterRes.statusCode === 200, 'Filter by category=COMPANY returns 200 OK');
    assert(
      compFilterRes.body.data.updates.every(u => u.category === 'COMPANY'),
      'All returned updates belong to COMPANY category'
    );

    // Filter by Priority
    const priorityFilterRes = await makeRequest('/updates?priority=URGENT', 'GET', null, studentToken);
    assert(priorityFilterRes.statusCode === 200, 'Filter by priority=URGENT returns 200 OK');
    assert(
      priorityFilterRes.body.data.updates.every(u => u.priority === 'URGENT'),
      'All returned updates have URGENT priority'
    );

    // Search Filter
    const searchFilterRes = await makeRequest('/updates?search=RECRUITMENT', 'GET', null, studentToken);
    assert(searchFilterRes.statusCode === 200, 'Keyword search returns 200 OK');
    assert(
      searchFilterRes.body.data.updates.some(u => u.title.includes('RECRUITMENT')),
      'Search results match keyword in title'
    );

    // 5. Testing GET /api/updates/:id (Single update details)
    console.log('\n--- 5. Testing GET /api/updates/:id ---');
    const singleUpdateRes = await makeRequest(`/updates/${testUpdateId}`, 'GET', null, studentToken);
    assert(singleUpdateRes.statusCode === 200, 'GET /api/updates/:id returns 200 OK');
    assert(singleUpdateRes.body.data._id === testUpdateId, 'Returned update matches requested ID');
    assert(singleUpdateRes.body.data.createdBy && singleUpdateRes.body.data.createdBy.email, 'Publisher details attached');

    // Non-existent ID
    const fakeId = '654321654321654321654321';
    const notFoundRes = await makeRequest(`/updates/${fakeId}`, 'GET', null, studentToken);
    assert(notFoundRes.statusCode === 404, 'Non-existent update ID returns 404 Not Found');

    // 6. Testing PUT /api/updates/:id (Admin Updates)
    console.log('\n--- 6. Testing PUT /api/updates/:id ---');
    const updateRes = await makeRequest(`/updates/${testUpdateId}`, 'PUT', {
      title: 'UPDATED: Google Placement Drive Schedule',
      description: 'The schedule has been revised to next Monday at 10:00 AM.',
      priority: 'HIGH',
      category: 'COMPANY',
    }, adminToken);

    assert(updateRes.statusCode === 200, 'PUT /api/updates/:id returns 200 OK');
    assert(updateRes.body.data.title === 'UPDATED: Google Placement Drive Schedule', 'Title updated');
    assert(updateRes.body.data.priority === 'HIGH', 'Priority updated to HIGH');
    assert(updateRes.body.data.description.includes('next Monday'), 'Description updated');

    // Student blocked from updating
    const studentUpdateRes = await makeRequest(`/updates/${testUpdateId}`, 'PUT', {
      title: 'Hacked by Student',
    }, studentToken);
    assert(studentUpdateRes.statusCode === 403, 'Student blocked from PUT /api/updates/:id with 403 Forbidden');

    // 7. Testing DELETE /api/updates/:id
    console.log('\n--- 7. Testing DELETE /api/updates/:id ---');
    // Student blocked from deleting
    const studentDeleteRes = await makeRequest(`/updates/${testUpdateId}`, 'DELETE', null, studentToken);
    assert(studentDeleteRes.statusCode === 403, 'Student blocked from DELETE /api/updates/:id with 403 Forbidden');

    // Admin successfully deletes
    const adminDeleteRes = await makeRequest(`/updates/${testUpdateId}`, 'DELETE', null, adminToken);
    assert(adminDeleteRes.statusCode === 200, 'Admin deleted update with 200 OK');

    // Confirm deleted
    const verifyDeleteRes = await makeRequest(`/updates/${testUpdateId}`, 'GET', null, studentToken);
    assert(verifyDeleteRes.statusCode === 404, 'Deleted update no longer found (404 Not Found)');

    // 8. Testing RBAC on POST
    console.log('\n--- 8. Testing RBAC on POST /api/updates ---');
    const studentCreateRes = await makeRequest('/updates', 'POST', {
      title: 'Student Attempting to Post Official Notice',
      description: 'Should be denied by server',
      category: 'IMPORTANT',
    }, studentToken);
    assert(studentCreateRes.statusCode === 403, 'Student blocked from POST /api/updates with 403 Forbidden');

    // Unauthenticated access
    const unauthRes = await makeRequest('/updates', 'GET');
    assert(unauthRes.statusCode === 401, 'Unauthenticated request rejected with 401 Unauthorized');

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
