const http = require('http');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';

const makeJsonRequest = (urlPath, method = 'GET', body = null, token = null) => {
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

const uploadFileRequest = (urlPath, filename, buffer, mimeType, token, fieldName = 'resume') => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${urlPath}`);
    const boundary = '----CampusHireBoundary' + Date.now().toString(16);

    const preHeader = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\n` +
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

const buildPdfWithText = (lines) => {
  let stream = 'BT\n/F1 12 Tf\n100 700 Td\n';
  for (const line of lines) {
    const clean = line.replace(/[\(\)\\]/g, '');
    stream += '(' + clean + ') Tj\n0 -20 Td\n';
  }
  stream += 'ET';
  const streamLen = stream.length;

  const pdfData = '%PDF-1.4\n' +
  '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
  '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
  '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n' +
  '4 0 obj\n<< /Length ' + streamLen + ' >>\nstream\n' + stream + '\nendstream\nendobj\n' +
  '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n' +
  'xref\n0 6\n0000000000 65535 f \n' +
  'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n0\n%%EOF';

  return Buffer.from(pdfData);
};

const runTests = async () => {
  console.log('====================================================');
  console.log('🎯 CampusHire – Phase 12: Job-Specific Resume Matching');
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
    // 1. Setup Admin Account & Recruitment Drive
    console.log('\n--- 1. Setting Up Recruitment Drive ---');
    const adminReg = await makeJsonRequest('/auth/register-admin', 'POST', {
      name: 'TPO Placement Lead',
      email: `tpo_lead_${timestamp}@college.edu`,
      password: 'AdminPassword123',
      role: 'tpo',
    });
    const adminToken = adminReg.body.data ? adminReg.body.data.token : null;
    assert(adminToken, 'Admin authenticated for test drive creation');


    // Create Company
    const compRes = await makeJsonRequest('/companies', 'POST', {
      companyName: `Apex Cloud Systems ${timestamp}`,
      industry: 'Cloud Computing & DevOps',
      description: 'Enterprise cloud infrastructure provider',
      website: 'https://apexcloud.example.com',
      location: 'Bangalore, India',
      contactEmail: `recruiting_${timestamp}@apexcloud.example.com`,
    }, adminToken);
    const companyId = compRes.body.data._id;
    assert(compRes.statusCode === 201 && companyId, 'Test company created successfully');

    // Create Recruitment Drive
    const driveRes = await makeJsonRequest('/drives', 'POST', {
      company: companyId,
      jobRole: 'Full Stack Cloud Engineer',
      jobDescription: 'Seeking a Full Stack Engineer to design RESTful APIs, manage MongoDB and PostgreSQL databases, deploy microservices using Docker containers and Kubernetes, and architect scalable solutions with AWS cloud.',
      package: 14.5,
      location: 'Bangalore / Hybrid',
      eligibleBranches: ['CSE', 'IT'],
      minimumCGPA: 7.5,
      maximumBacklogs: 0,
      graduationYear: 2026,
      requiredSkills: ['React', 'Node.js', 'MongoDB', 'Docker', 'AWS'],
      applicationDeadline: new Date(Date.now() + 15 * 86400000).toISOString(),
      driveDate: new Date(Date.now() + 20 * 86400000).toISOString(),
    }, adminToken);
    const driveId = driveRes.body.data._id;
    assert(driveRes.statusCode === 201 && driveId, 'Recruitment Drive created with required skills and JD');

    // 2. Setup Student Accounts
    console.log('\n--- 2. Setting Up Student Accounts ---');
    // Student 1: Highly qualified candidate (CSE, 8.9 CGPA)
    const s1Res = await makeJsonRequest('/auth/register', 'POST', {
      name: 'Rohan Malhotra',
      email: `rohan_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `CS_${timestamp.toString().slice(-4)}`,
      department: 'CSE',
      batchYear: 2026,
    });
    const s1Token = s1Res.body.data.token;
    // Update student CGPA to 8.9
    await makeJsonRequest('/students/profile', 'PUT', { cgpa: 8.9 }, s1Token);

    // Student 2: Partial candidate (IT, 7.8 CGPA)
    const s2Res = await makeJsonRequest('/auth/register', 'POST', {
      name: 'Pooja Hegde',
      email: `pooja_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `IT_${timestamp.toString().slice(-4)}`,
      department: 'IT',
      batchYear: 2026,
    });
    const s2Token = s2Res.body.data.token;
    await makeJsonRequest('/students/profile', 'PUT', { cgpa: 7.8 }, s2Token);

    assert(s1Token && s2Token, 'Candidate student accounts registered with academic profiles');

    // 3. Synthesize Test Resumes
    console.log('\n--- 3. Synthesizing Comparison Resumes ---');
    // High-Match Resume: Has all required skills, role title, and JD keywords
    const highMatchLines = [
      'Rohan Malhotra',
      'Email: rohan@college.edu | Phone: +919876543210 | linkedin.com/in/rohan',
      'Headline: Aspiring Full Stack Cloud Engineer with expertise in modern web and distributed systems',
      'Education: B.Tech Computer Science and Engineering, CGPA: 8.9, Batch 2026',
      'Technical Skills: React, Node.js, MongoDB, Docker, AWS, JavaScript, TypeScript, Python, Git',
      'Key Projects: Designed scalable microservices and RESTful APIs with Docker containers and AWS deployment. Optimized PostgreSQL and MongoDB databases for high-concurrency workloads.',
      'Experience: Cloud Developer Intern at Tech Solutions. Automated containerized deployments.',
      'Certifications: AWS Certified Developer Associate',
    ];
    const highMatchPdf = buildPdfWithText(highMatchLines);

    // Partial-Match Resume: Has React & Node.js, but missing Docker, AWS, MongoDB and cloud keywords
    const partialMatchLines = [
      'Pooja Hegde',
      'Email: pooja@college.edu | Phone: +919876543210',
      'Education: B.Tech Information Technology, CGPA: 7.8',
      'Technical Skills: React, Node.js, HTML, CSS, JavaScript',
      'Projects: Built frontend web applications and simple Express APIs for student portal',
    ];
    const partialMatchPdf = buildPdfWithText(partialMatchLines);

    assert(highMatchPdf.length > 0 && partialMatchPdf.length > 0, 'Test PDF resumes generated');

    // 4. Test POST /api/resumes/match/:driveId (High-Match Resume)
    console.log('\n--- 4. Testing High-Match Resume Against Recruitment Drive ---');
    const highMatchRes = await uploadFileRequest(
      `/resumes/match/${driveId}`,
      'Rohan_HighMatch.pdf',
      highMatchPdf,
      'application/pdf',
      s1Token
    );

    assert(highMatchRes.statusCode === 201, 'POST /api/resumes/match/:driveId returns 201 Created');
    const highData = highMatchRes.body.data;
    assert(typeof highData?.matchPercentage === 'number', 'Response contains matchPercentage', `Match: ${highData?.matchPercentage}%`);
    assert(highData?.matchPercentage >= 80, 'High match resume achieves >= 80% match percentage', `Achieved: ${highData?.matchPercentage}%`);
    assert(Array.isArray(highData?.matchedSkills), 'matchedSkills is an array');
    assert(highData?.matchedSkills.length === 5, 'All 5 required skills matched (React, Node.js, MongoDB, Docker, AWS)', `Matched: ${highData?.matchedSkills?.join(', ')}`);
    assert(Array.isArray(highData?.missingSkills) && highData.missingSkills.length === 0, 'missingSkills is empty for full skill match');
    assert(Array.isArray(highData?.matchedKeywords) && highData.matchedKeywords.length >= 3, 'Job description keywords successfully matched', `Keywords: ${highData?.matchedKeywords?.join(', ')}`);
    assert(Array.isArray(highData?.suggestions) && highData.suggestions.length > 0, 'Actionable suggestions generated');
    assert(highData?.suggestions.some(s => s.toLowerCase().includes('high alignment') || s.toLowerCase().includes('strongly match')), 'Suggestions celebrate high alignment');

    // 5. Test POST /api/resumes/match/:driveId (Partial-Match Resume)
    console.log('\n--- 5. Testing Partial-Match Resume Against Recruitment Drive ---');
    const partialMatchRes = await uploadFileRequest(
      `/resumes/match/${driveId}`,
      'Pooja_PartialMatch.pdf',
      partialMatchPdf,
      'application/pdf',
      s2Token
    );

    assert(partialMatchRes.statusCode === 201, 'Partial match returns 201 Created');
    const partialData = partialMatchRes.body.data;
    assert(partialData?.matchPercentage < highData?.matchPercentage, 'Partial resume score is lower than high-match resume', `Partial: ${partialData?.matchPercentage}% vs High: ${highData?.matchPercentage}%`);
    assert(partialData?.matchedSkills.includes('react') && partialData?.matchedSkills.includes('node.js'), 'React and Node.js detected in matchedSkills');
    assert(partialData?.missingSkills.includes('docker') && partialData?.missingSkills.includes('aws') && partialData?.missingSkills.includes('mongodb'), 'Missing required skills accurately detected (Docker, AWS, MongoDB)');
    assert(partialData?.suggestions.some(s => s.toLowerCase().includes('missing required skills') || s.toLowerCase().includes('docker')), 'Suggestions guide student to add missing required skills');

    // 6. Test Match Against Active Resume (Without File Upload)
    console.log('\n--- 6. Testing Active Resume Matching (No Re-upload) ---');
    const activeMatchRes = await makeJsonRequest(`/resumes/match/${driveId}`, 'POST', {}, s1Token);
    assert(activeMatchRes.statusCode === 201, 'POST /api/resumes/match/:driveId works using current active resume');
    assert(activeMatchRes.body.data?.matchPercentage === highData?.matchPercentage, 'Matching active resume yields identical deterministic score');

    // 7. Verify Result Persistence in MongoDB History
    console.log('\n--- 7. Verifying Result Persistence in MongoDB ---');
    const historyRes = await makeJsonRequest('/resumes/test-results', 'GET', null, s1Token);
    assert(historyRes.statusCode === 200, 'GET /api/resumes/test-results returns 200 OK');
    const jobMatchRecord = historyRes.body.data.find(r => r.testType === 'JOB_MATCH');
    assert(jobMatchRecord !== undefined, 'Job-specific match record saved with testType: JOB_MATCH in MongoDB');
    assert(jobMatchRecord.matchPercentage === highData.matchPercentage, 'Persisted record preserves exact matchPercentage');
    assert(jobMatchRecord.matchedSkills.length === 5, 'Persisted record preserves matchedSkills list');

    // 8. Error Handling: Non-Existent Drive ID
    console.log('\n--- 8. Error Handling: Invalid / Non-Existent Drive ID ---');
    const fakeDriveId = '654321654321654321654321';
    const fakeDriveRes = await makeJsonRequest(`/resumes/match/${fakeDriveId}`, 'POST', {}, s1Token);
    assert(fakeDriveRes.statusCode === 404, 'Non-existent drive ID returns 404 Not Found');

    // 9. Error Handling: Unreadable PDF Buffer
    console.log('\n--- 9. Error Handling: Corrupt / Unreadable PDF ---');
    const corruptPdf = Buffer.from('%PDF-1.4\n trailer << >> %%EOF');
    const corruptRes = await uploadFileRequest(
      `/resumes/match/${driveId}`,
      'corrupt.pdf',
      corruptPdf,
      'application/pdf',
      s1Token
    );
    assert(corruptRes.statusCode === 400, 'Corrupt / non-text PDF returns 400 Bad Request');

    // 10. Security & Authorization
    console.log('\n--- 10. Security & Authorization Verification ---');
    const noAuthRes = await makeJsonRequest(`/resumes/match/${driveId}`, 'POST', {});
    assert(noAuthRes.statusCode === 401, 'Unauthenticated request rejected with 401 Unauthorized');

    const adminMatchRes = await makeJsonRequest(`/resumes/match/${driveId}`, 'POST', {}, adminToken);
    assert(adminMatchRes.statusCode === 403, 'Admin forbidden from student match endpoint (403 Forbidden)');

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
