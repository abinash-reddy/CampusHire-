const http = require('http');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';

const makeJsonRequest = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
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

const uploadFileRequest = (pathUrl, filename, buffer, mimeType, token) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${pathUrl}`);
    const boundary = '----CampusHireBoundary' + Date.now().toString(16);

    const preHeader = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="resume"; filename="${filename}"\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`
    );
    const postFooter = Buffer.from(`\r\n--${boundary}--\r\n`);
    const payload = Buffer.concat([preHeader, buffer, postFooter]);

    const headers = {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': payload.length,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method: 'POST', headers }, (res) => {
      let rawData = '';
      res.on('data', (chunk) => (rawData += chunk));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(rawData); } catch (e) { parsed = rawData; }
        resolve({ statusCode: res.statusCode, body: parsed });
      });
    });

    req.on('error', (e) => reject(e));
    req.write(payload);
    req.end();
  });
};

const runTests = async () => {
  console.log('====================================================');
  console.log('📄 CampusHire – Resume Management Test Suite');
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
    // 1. Setup Student Accounts
    console.log('\n--- 1. Setting Up Student Accounts ---');
    const s1Res = await makeJsonRequest('/auth/register', 'POST', {
      name: 'Tanvi Nair',
      email: `tanvi_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `CS_${timestamp.toString().slice(-4)}`,
      department: 'CSE',
      batchYear: 2026,
    });
    const s1Token = s1Res.body.data.token;

    const s2Res = await makeJsonRequest('/auth/register', 'POST', {
      name: 'Nikhil Sen',
      email: `nikhil_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `IT_${timestamp.toString().slice(-4)}`,
      department: 'IT',
      batchYear: 2026,
    });
    const s2Token = s2Res.body.data.token;
    assert(s1Token && s2Token, 'Test student accounts ready');

    // 2. Mock PDF Buffer (%PDF header) and Text Buffer
    const validPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Tanvi Resume) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
    const nonPdfBuffer = Buffer.from('This is a text file, not a valid PDF document.');

    // 3. Reject non-PDF file upload
    console.log('\n--- 2. Testing Strict PDF Validation ---');
    const nonPdfRes = await uploadFileRequest(
      '/resumes/upload',
      'resume.txt',
      nonPdfBuffer,
      'text/plain',
      s1Token
    );
    assert(nonPdfRes.statusCode === 400, 'Non-PDF upload rejected with HTTP 400 Bad Request', `Got: ${nonPdfRes.statusCode}`);

    // 4. Upload Valid PDF Resume
    console.log('\n--- 3. Testing Valid PDF Resume Upload ---');
    const uploadRes = await uploadFileRequest(
      '/resumes/upload',
      'Tanvi_Nair_Resume.pdf',
      validPdfBuffer,
      'application/pdf',
      s1Token
    );
    assert(uploadRes.statusCode === 201, 'PDF Resume uploaded with HTTP 201 Created', `Got: ${uploadRes.statusCode}`);
    assert(uploadRes.body.data.fileName === 'Tanvi_Nair_Resume.pdf', 'Original file name preserved');
    assert(uploadRes.body.data.mimeType === 'application/pdf', 'MIME type recorded as application/pdf');
    assert(uploadRes.body.data.isPrimary === true, 'Uploaded resume marked as primary');
    assert(fs.existsSync(uploadRes.body.data.filePath), 'Physical file securely written to server storage');
    const firstResumeId = uploadRes.body.data._id;
    const firstFilePath = uploadRes.body.data.filePath;

    // 5. View Current Resume (GET /api/resumes/my)
    console.log('\n--- 4. Testing View Current Resume (GET /api/resumes/my) ---');
    const myResumeRes = await makeJsonRequest('/resumes/my', 'GET', null, s1Token);
    assert(myResumeRes.statusCode === 200, 'Current resume retrieved with HTTP 200 OK');
    assert(myResumeRes.body.data._id === firstResumeId, 'Returned resume matches uploaded resume ID');
    assert(myResumeRes.body.data.student.rollNumber !== undefined, 'Student reference populated');

    // 6. Replace Resume with Updated Version
    console.log('\n--- 5. Testing Resume Replacement ---');
    const secondPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Tanvi Updated Resume) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
    const replaceRes = await uploadFileRequest(
      '/resumes/upload',
      'Tanvi_Nair_Resume_v2.pdf',
      secondPdfBuffer,
      'application/pdf',
      s1Token
    );
    assert(replaceRes.statusCode === 201, 'Updated resume uploaded with HTTP 201 Created');
    assert(replaceRes.body.data.fileName === 'Tanvi_Nair_Resume_v2.pdf', 'New version recorded');
    assert(replaceRes.body.data.isPrimary === true, 'New version marked as active/primary');
    const secondResumeId = replaceRes.body.data._id;
    const secondFilePath = replaceRes.body.data.filePath;

    // Check that GET /my now points to second resume
    const updatedMyResume = await makeJsonRequest('/resumes/my', 'GET', null, s1Token);
    assert(updatedMyResume.body.data._id === secondResumeId, 'Active resume correctly points to updated version');

    // 7. Security: Peer Student cannot delete or access another student's resume
    console.log('\n--- 6. Testing Ownership Security Barriers ---');
    const unauthorizedDeleteRes = await makeJsonRequest(`/resumes/${secondResumeId}`, 'DELETE', null, s2Token);
    assert(unauthorizedDeleteRes.statusCode === 403, 'Unauthorized student blocked from deleting peer resume with HTTP 403 Forbidden');
    assert(fs.existsSync(secondFilePath), 'Target file remains intact on storage');

    // 8. Delete Own Resume (DELETE /api/resumes/:id)
    console.log('\n--- 7. Testing Resume Deletion & File Cleanup ---');
    const deleteRes = await makeJsonRequest(`/resumes/${secondResumeId}`, 'DELETE', null, s1Token);
    assert(deleteRes.statusCode === 200, 'Owner deleted resume with HTTP 200 OK');
    assert(!fs.existsSync(secondFilePath), 'Physical file removed from server storage');

    // Clean up first test file if still on disk
    if (fs.existsSync(firstFilePath)) {
      try { fs.unlinkSync(firstFilePath); } catch (e) {}
    }

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
