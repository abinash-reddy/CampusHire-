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

/**
 * Helper to build a valid binary PDF 1.4 buffer with embedded text lines
 */
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
  console.log('📄 CampusHire – Phase 11: Resume Testing & Analysis');
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
    // 1. Setup Student & Admin Accounts
    console.log('\n--- 1. Setting Up Test Accounts ---');
    const studentReg = await makeJsonRequest('/auth/register', 'POST', {
      name: 'Aditya Verma',
      email: `aditya_${timestamp}@college.edu`,
      password: 'Password@123',
      rollNumber: `CS_${timestamp.toString().slice(-4)}`,
      department: 'CSE',
      batchYear: 2026,
    });
    const studentToken = studentReg.body.data.token;
    assert(studentReg.statusCode === 201 && studentToken, 'Student account registered with JWT token');

    // Admin Account for authorization tests
    const adminLogin = await makeJsonRequest('/auth/login', 'POST', {
      email: 'admin@campushire.edu',
      password: 'AdminPassword@123',
    });
    const adminToken = adminLogin.body.data ? adminLogin.body.data.token : null;

    // 2. Prepare Sample PDF Resumes
    console.log('\n--- 2. Preparing Test PDF Resumes ---');
    // Comprehensive Resume with all 7 sections, skills, and metrics
    const comprehensiveLines = [
      'Aditya Verma',
      'Email: aditya@college.edu | Phone: +919876543210 | linkedin.com/in/aditya | github.com/aditya',
      'Education: B.Tech in Computer Science and Engineering, CGPA: 9.1, Batch 2026',
      'Technical Skills: JavaScript, TypeScript, Python, React, Node.js, Express, MongoDB, Docker, Git, AWS',
      'Key Projects: Built Full-Stack Placement Portal using React and Node.js. Optimized database queries by 45%',
      'Experience: Software Development Intern at Tech Labs. Developed RESTful APIs handling 10000+ daily requests',
      'Certifications: AWS Certified Developer Associate, Coursera Deep Learning Specialization',
      'Achievements: First prize in National Smart India Hackathon 2025 among 500 teams',
    ];
    const comprehensivePdf = buildPdfWithText(comprehensiveLines);

    // Minimal PDF (Missing Experience & Certifications)
    const minimalLines = [
      'Aditya Verma',
      'Email: aditya@college.edu | Phone: +919876543210',
      'Education: B.Tech Computer Science, CGPA: 7.5',
      'Skills: Python, HTML, CSS',
      'Projects: Simple Calculator application developed in Python',
    ];
    const minimalPdf = buildPdfWithText(minimalLines);

    // Scanned/Empty PDF without text stream
    const emptyPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');

    assert(comprehensivePdf.length > 0 && minimalPdf.length > 0, 'Test PDF buffers synthesized successfully');

    // 3. Test POST /api/resumes/test with Comprehensive PDF
    console.log('\n--- 3. Testing POST /api/resumes/test (Comprehensive PDF) ---');
    const compTestRes = await uploadFileRequest(
      '/resumes/test',
      'Aditya_Full_Resume.pdf',
      comprehensivePdf,
      'application/pdf',
      studentToken
    );

    assert(compTestRes.statusCode === 201, 'POST /api/resumes/test returns 201 Created');
    const compData = compTestRes.body.data;
    assert(compData && typeof compData.overallScore === 'number', 'Response contains overallScore', `Score: ${compData?.overallScore}`);
    assert(compData?.overallScore >= 70, 'Comprehensive resume achieves high score (>= 70)', `Score: ${compData?.overallScore}`);
    assert(compData?.sectionScores && typeof compData.sectionScores.contact === 'number', 'Response contains sectionScores object');
    assert(compData?.sectionScores.education > 0 && compData?.sectionScores.projects > 0, 'Individual section scores properly calculated');
    assert(Array.isArray(compData?.detectedSkills) && compData.detectedSkills.length >= 5, 'Detected technical skills list populated', `Skills: ${compData?.detectedSkills?.join(', ')}`);
    assert(compData?.detectedSkills.includes('javascript') && compData?.detectedSkills.includes('react') && compData?.detectedSkills.includes('mongodb'), 'Configurable technical skills dictionary matched accurately');
    assert(Array.isArray(compData?.missingSections) && compData.missingSections.length === 0, 'No sections marked missing for comprehensive resume');
    assert(typeof compData?.keywordScore === 'number' && compData.keywordScore > 0, 'Keyword score calculated from action verbs & metrics', `KeywordScore: ${compData?.keywordScore}`);
    assert(Array.isArray(compData?.suggestions), 'Suggestions array generated', `Suggestions: ${JSON.stringify(compData?.suggestions)}`);

    // 4. Test POST /api/resumes/test with Minimal PDF (Detecting missing sections & targeted suggestions)
    console.log('\n--- 4. Testing POST /api/resumes/test (Minimal PDF & Suggestions) ---');
    const minTestRes = await uploadFileRequest(
      '/resumes/test',
      'Aditya_Minimal_Resume.pdf',
      minimalPdf,
      'application/pdf',
      studentToken
    );

    assert(minTestRes.statusCode === 201, 'Minimal PDF test returns 201 Created');
    const minData = minTestRes.body.data;
    assert(minData?.overallScore < compData?.overallScore, 'Minimal resume receives lower score than comprehensive resume', `Min Score: ${minData?.overallScore} vs Comp: ${compData?.overallScore}`);
    assert(minData?.missingSections.includes('Experience'), 'Correctly identifies missing Experience section');
    assert(minData?.missingSections.includes('Certifications'), 'Correctly identifies missing Certifications section');
    assert(minData?.suggestions.some(s => s.toLowerCase().includes('experience')), 'Suggestions advise adding experience/internships');
    assert(minData?.suggestions.some(s => s.toLowerCase().includes('github') || s.toLowerCase().includes('linkedin')), 'Suggestions advise adding profile links');

    // 5. Test POST /api/resumes/test without file (Testing existing active resume)
    console.log('\n--- 5. Testing POST /api/resumes/test (Active Resume Re-test) ---');
    const activeTestRes = await makeJsonRequest('/resumes/test', 'POST', {}, studentToken);
    assert(activeTestRes.statusCode === 201, 'POST /api/resumes/test works using student active resume');
    assert(activeTestRes.body.data?.overallScore === minData?.overallScore, 'Re-testing active resume produces identical deterministic score');

    // 6. Test GET /api/resumes/test-results (History)
    console.log('\n--- 6. Testing GET /api/resumes/test-results ---');
    const historyRes = await makeJsonRequest('/resumes/test-results', 'GET', null, studentToken);
    assert(historyRes.statusCode === 200, 'GET /api/resumes/test-results returns 200 OK');
    assert(Array.isArray(historyRes.body.data), 'Returns an array of test records');
    assert(historyRes.body.data.length >= 3, 'All performed tests saved in MongoDB history', `Found: ${historyRes.body.data.length}`);
    const latestTest = historyRes.body.data[0];
    assert(latestTest.overallScore !== undefined && latestTest.sectionScores !== undefined, 'History records retain overall and section scores');
    assert(latestTest.resume && latestTest.resume.fileName, 'History records populate resume details');

    // 7. Error Handling: Empty / Unreadable PDF
    console.log('\n--- 7. Error Handling: Unreadable or Corrupt PDF ---');
    const emptyPdfRes = await uploadFileRequest(
      '/resumes/test',
      'empty.pdf',
      emptyPdf,
      'application/pdf',
      studentToken
    );
    assert(emptyPdfRes.statusCode === 400, 'Empty / Scanned PDF without text layer returns 400 Bad Request');
    assert(emptyPdfRes.body.success === false, 'Error response returns success: false');
    assert(emptyPdfRes.body.message.includes('Unable to extract readable text'), 'Informative error message for unreadable PDF');

    // 8. Error Handling: Non-PDF File
    console.log('\n--- 8. Error Handling: Non-PDF File Format ---');
    const textFileBuffer = Buffer.from('This is a plain text file, not a PDF.');
    const textFileRes = await uploadFileRequest(
      '/resumes/test',
      'resume.txt',
      textFileBuffer,
      'text/plain',
      studentToken
    );
    assert(textFileRes.statusCode === 400, 'Non-PDF upload rejected with 400 Bad Request');

    // 9. Security & Access Control
    console.log('\n--- 9. Security & Authorization Checks ---');
    const noAuthRes = await makeJsonRequest('/resumes/test-results', 'GET');
    assert(noAuthRes.statusCode === 401, 'Unauthenticated request rejected with 401 Unauthorized');

    if (adminToken) {
      const adminRes = await makeJsonRequest('/resumes/test-results', 'GET', null, adminToken);
      assert(adminRes.statusCode === 403, 'Admin user forbidden from student-only resume test routes (403 Forbidden)');
    }

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
