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
  console.log('🔔 CampusHire – Phase 15: Notification System Test Suite');
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
    // 1. Setup Test Accounts & Company
    console.log('\n--- 1. Setting Up Test Accounts & Environment ---');
    const adminReg = await makeRequest('/auth/register-admin', 'POST', {
      name: 'TPO Notification Admin',
      email: `tpo_notify_${timestamp}@college.edu`,
      password: 'AdminPassword123',
      role: 'admin',
    });
    const adminToken = adminReg.body.data.token;
    assert(adminToken, 'Admin/TPO account registered');

    // Candidate Student
    const s1Res = await makeRequest('/auth/register', 'POST', {
      name: 'Divya Iyer',
      email: `divya_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `CS_${timestamp.toString().slice(-4)}`,
      department: 'CSE',
      batchYear: 2026,
    });
    const s1Token = s1Res.body.data.token;
    await makeRequest('/students/profile', 'PUT', { cgpa: 9.0 }, s1Token);

    // Peer Student
    const s2Res = await makeRequest('/auth/register', 'POST', {
      name: 'Manish Rawat',
      email: `manish_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `IT_${timestamp.toString().slice(-4)}`,
      department: 'IT',
      batchYear: 2026,
    });
    const s2Token = s2Res.body.data.token;
    await makeRequest('/students/profile', 'PUT', { cgpa: 8.4 }, s2Token);

    // Company
    const compRes = await makeRequest('/companies', 'POST', {
      companyName: `Cisco Systems ${timestamp}`,
      industry: 'Networking & Telecommunications',
      website: 'https://cisco.example.com',
      location: 'Bangalore, India',
    }, adminToken);
    const companyId = compRes.body.data._id;
    assert(companyId, 'Hiring company created');

    // 2. Trigger Event 1: New recruitment drive published
    console.log('\n--- 2. Trigger Event 1: New Recruitment Drive Published ---');
    const driveRes = await makeRequest('/drives', 'POST', {
      company: companyId,
      jobRole: 'Network Software Engineer',
      jobDescription: 'Build next-generation routing and switching software architectures.',
      package: 16.0,
      eligibleBranches: ['CSE', 'IT'],
      minimumCGPA: 7.0,
      maximumBacklogs: 0,
      graduationYear: 2026,
      requiredSkills: ['C++', 'Python', 'Networking'],
      applicationDeadline: new Date(Date.now() + 10 * 86400000).toISOString(),
      driveDate: new Date(Date.now() + 15 * 86400000).toISOString(),
      status: 'OPEN',
    }, adminToken);
    const driveId = driveRes.body.data._id;
    assert(driveId, 'Recruitment drive created with status OPEN');

    // Verify both students received "New Recruitment Drive" notification
    const s1NotesAfterDrive = await makeRequest('/notifications', 'GET', null, s1Token);
    const s2NotesAfterDrive = await makeRequest('/notifications', 'GET', null, s2Token);
    assert(s1NotesAfterDrive.statusCode === 200, 'Student 1 accessed GET /api/notifications');
    assert(
      s1NotesAfterDrive.body.data.notifications.some(n => n.title.includes('New Recruitment Drive')),
      'Student 1 received notification when drive was published'
    );
    assert(
      s2NotesAfterDrive.body.data.notifications.some(n => n.title.includes('New Recruitment Drive')),
      'Student 2 received notification when drive was published'
    );

    // 3. Trigger Event 2: Student applies for a drive
    console.log('\n--- 3. Trigger Event 2: Student Applies for Drive ---');
    const appRes = await makeRequest('/applications', 'POST', { driveId }, s1Token);
    const applicationId = appRes.body.data._id;
    assert(appRes.statusCode === 201 && applicationId, 'Student applied to recruitment drive');

    const s1NotesAfterApply = await makeRequest('/notifications', 'GET', null, s1Token);
    assert(
      s1NotesAfterApply.body.data.notifications.some(n => n.title.includes('Application Submitted')),
      'Student received notification confirming application submission'
    );

    // 4. Trigger Event 3 & 5: Student is shortlisted and status changes
    console.log('\n--- 4. Trigger Event 3 & 5: Shortlisting & Status Changes ---');
    const shortlistRes = await makeRequest(`/admin/applications/${applicationId}/status`, 'PUT', {
      status: 'SHORTLISTED',
      remarks: 'Selected for interview round based on CGPA and profile',
    }, adminToken);
    assert(shortlistRes.statusCode === 200, 'Admin updated status to SHORTLISTED');

    const s1NotesAfterShortlist = await makeRequest('/notifications', 'GET', null, s1Token);
    assert(
      s1NotesAfterShortlist.body.data.notifications.some(n => n.title.includes('SHORTLISTED')),
      'Student received notification for SHORTLISTED status change'
    );

    // 5. Trigger Event 4: Interview is scheduled
    console.log('\n--- 5. Trigger Event 4: Interview Scheduled ---');
    const interviewDate = new Date(Date.now() + 2 * 86400000).toISOString();
    const interviewRes = await makeRequest('/interviews', 'POST', {
      application: applicationId,
      round: 'Technical Interview Round 1',
      date: interviewDate,
      time: '11:00 AM',
      mode: 'Online',
      meetingLink: 'https://meet.google.com/test-notification-meet',
    }, adminToken);
    assert(interviewRes.statusCode === 201, 'Interview scheduled by Admin');

    const s1NotesAfterInterview = await makeRequest('/notifications', 'GET', null, s1Token);
    assert(
      s1NotesAfterInterview.body.data.notifications.some(n => n.title.includes('Interview Scheduled')),
      'Student received notification when interview was scheduled'
    );

    // 6. Trigger Event 6: Result is published (SELECTED)
    console.log('\n--- 6. Trigger Event 6: Result Published (SELECTED) ---');
    const selectRes = await makeRequest(`/admin/applications/${applicationId}/status`, 'PUT', {
      status: 'SELECTED',
      remarks: 'Congratulations! Selected with package 16.0 LPA',
    }, adminToken);
    assert(selectRes.statusCode === 200, 'Admin updated status to SELECTED');

    const s1NotesAfterSelect = await makeRequest('/notifications', 'GET', null, s1Token);
    assert(
      s1NotesAfterSelect.body.data.notifications.some(n => n.title.includes('SELECTED')),
      'Student received notification when placement result was finalized'
    );

    // 7. Trigger Event 7: Important placement update is published
    console.log('\n--- 7. Trigger Event 7: Important Placement Update Published ---');
    const updateRes = await makeRequest('/updates', 'POST', {
      title: 'Mandatory TPO Resume Verification Session',
      description: 'All 2026 batch students must complete verification before Friday.',
      category: 'IMPORTANT',
      priority: 'URGENT',
    }, adminToken);
    assert(updateRes.statusCode === 201, 'Important placement update created by Admin');

    const s1NotesAfterUpdate = await makeRequest('/notifications', 'GET', null, s1Token);
    assert(
      s1NotesAfterUpdate.body.data.notifications.some(n => n.title.includes('Mandatory TPO Resume')),
      'Student received notification for important placement update'
    );

    // 8. Testing GET /api/notifications and unread count
    console.log('\n--- 8. Testing GET /api/notifications & Unread Count ---');
    const initialList = await makeRequest('/notifications', 'GET', null, s1Token);
    const unreadCount = initialList.body.data.unreadCount;
    assert(typeof unreadCount === 'number' && unreadCount >= 6, 'Unread notification count correctly reported', `Count: ${unreadCount}`);
    assert(Array.isArray(initialList.body.data.notifications), 'Notifications returned as an array');
    assert(initialList.body.data.pagination && initialList.body.data.pagination.total >= 6, 'Pagination metadata attached');

    // 9. Testing Student Isolation (Peer student cannot see candidate notifications)
    console.log('\n--- 9. Testing Student Isolation ---');
    const peerList = await makeRequest('/notifications', 'GET', null, s2Token);
    // Peer should only see broadcast notifications (drive & update), NOT application/interview/result
    assert(
      !peerList.body.data.notifications.some(n => n.title.includes('Application Submitted')),
      'Peer student cannot see candidate application submission notification'
    );
    assert(
      !peerList.body.data.notifications.some(n => n.title.includes('Interview Scheduled')),
      'Peer student cannot see candidate interview schedule notification'
    );

    // 10. Testing PUT /api/notifications/:id/read
    console.log('\n--- 10. Testing PUT /api/notifications/:id/read ---');
    const targetNotification = initialList.body.data.notifications[0];
    const targetId = targetNotification._id;

    // Peer student blocked from marking candidate's notification as read
    const peerMarkRes = await makeRequest(`/notifications/${targetId}/read`, 'PUT', {}, s2Token);
    assert(peerMarkRes.statusCode === 403, 'Peer student forbidden from marking other user notification (403 Forbidden)');

    // Candidate marks as read
    const markRes = await makeRequest(`/notifications/${targetId}/read`, 'PUT', {}, s1Token);
    assert(markRes.statusCode === 200, 'Candidate marks notification as read (200 OK)');
    assert(markRes.body.data.notification.isRead === true, 'Notification isRead changed to true');
    assert(markRes.body.data.unreadCount === unreadCount - 1, 'Unread count successfully decremented');

    // 11. Testing PUT /api/notifications/read-all
    console.log('\n--- 11. Testing PUT /api/notifications/read-all ---');
    const readAllRes = await makeRequest('/notifications/read-all', 'PUT', {}, s1Token);
    assert(readAllRes.statusCode === 200, 'PUT /api/notifications/read-all returns 200 OK');
    assert(readAllRes.body.data.unreadCount === 0, 'Unread count is now 0');

    // Confirm all are read in GET /api/notifications
    const finalList = await makeRequest('/notifications', 'GET', null, s1Token);
    assert(finalList.body.data.unreadCount === 0, 'Subsequent GET confirms unreadCount is 0');
    assert(
      finalList.body.data.notifications.every(n => n.isRead === true),
      'All notifications for student are marked as read'
    );

    // 12. Security: Unauthenticated request rejected
    console.log('\n--- 12. Security Verification ---');
    const unauthRes = await makeRequest('/notifications', 'GET');
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
