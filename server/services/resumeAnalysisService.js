const fs = require('fs');
const pdfModule = require('pdf-parse');
const { Resume, ResumeTest, Student, RecruitmentDrive } = require('../models');


// 1. Configurable Technical Skills Vocabulary (100+ Skills)
const SKILLS_VOCABULARY = [
  // Programming Languages
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'golang', 'go', 'rust',
  'ruby', 'php', 'swift', 'kotlin', 'dart', 'scala', 'r', 'sql', 'html', 'css',
  
  // Web Frameworks & Libraries
  'react', 'react.js', 'angular', 'vue', 'vue.js', 'next.js', 'node.js', 'nodejs',
  'express', 'express.js', 'django', 'flask', 'fastapi', 'spring', 'spring boot',
  'asp.net', 'laravel', 'tailwind', 'tailwind css', 'bootstrap', 'redux', 'graphql',
  
  // Databases & Storage
  'mongodb', 'postgresql', 'postgres', 'mysql', 'redis', 'sqlite', 'oracle',
  'cassandra', 'dynamodb', 'elasticsearch', 'prisma', 'mongoose',
  
  // Cloud, DevOps & Tools
  'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'ci/cd', 'git',
  'github', 'gitlab', 'linux', 'nginx', 'jenkins', 'terraform', 'postman',
  
  // Core CS Concepts
  'data structures', 'algorithms', 'object-oriented programming', 'oop', 'system design',
  'rest api', 'restful api', 'microservices', 'dbms', 'operating systems', 'computer networks',
  
  // AI / ML / Data Science
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy',
  'scikit-learn', 'nlp', 'computer vision', 'data analysis', 'power bi', 'tableau'
];

// 2. Strong Action Verbs for ATS Keyword Analysis
const ACTION_VERBS = [
  'developed', 'built', 'implemented', 'designed', 'optimized', 'integrated',
  'deployed', 'created', 'architected', 'managed', 'engineered', 'led', 'automated',
  'enhanced', 'refactored', 'resolved', 'programmed', 'spearheaded', 'executed'
];


/**
 * Extract plain text from PDF buffer with robust error handling
 * Supports both v1 (function) and v2 (PDFParse class)
 * @param {Buffer} buffer 
 * @returns {Promise<string>}
 */
const extractTextFromPdf = async (buffer) => {
  if (!buffer || buffer.length === 0) {
    const error = new Error('PDF file buffer is empty');
    error.statusCode = 400;
    throw error;
  }

  let text = '';
  try {
    if (typeof pdfModule === 'function') {
      const parsed = await pdfModule(buffer);
      text = (parsed.text || '').trim();
    } else if (pdfModule && pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: buffer });
      const parsed = await parser.getText();
      text = (parsed.text || '').trim();
      if (typeof parser.destroy === 'function') {
        await parser.destroy();
      }
    } else if (pdfModule && typeof pdfModule.default === 'function') {
      const parsed = await pdfModule.default(buffer);
      text = (parsed.text || '').trim();
    } else {
      throw new Error('Unable to initialize PDF parser engine');
    }

    if (!text || text.length < 20) {
      const error = new Error(
        'Unable to extract readable text from PDF. The document may be empty, password-protected, or a scanned image without embedded text.'
      );
      error.statusCode = 400;
      throw error;
    }

    return text;
  } catch (err) {
    if (err.statusCode) throw err;
    const error = new Error(
      `PDF processing error: ${err.message || 'File is corrupted or has an invalid structure.'}`
    );
    error.statusCode = 400;
    throw error;
  }
};


/**
 * Detect sections in extracted resume text
 * @param {string} text 
 * @returns {Object} { detectedSections, missingSections }
 */
const detectSections = (text) => {
  const normalizedText = text.toLowerCase();

  const sectionPatterns = {
    Contact: /(email|phone|mobile|tel|linkedin|github|portfolio|contact|address)/i,
    Education: /(education|academic|qualifications|degree|b\.?tech|bachelor|master|university|college|school|cgpa|gpa|percentage)/i,
    Skills: /(skills|technical skills|technologies|competencies|proficiencies|tools|languages)/i,
    Projects: /(projects|personal projects|academic projects|key projects|works)/i,
    Experience: /(experience|work experience|employment|internship|internships|professional experience)/i,
    Certifications: /(certifications|certificates|licenses|courses|accreditation)/i,
    Achievements: /(achievements|honors|awards|extracurricular|publications|competitions|hackathons)/i,
  };

  const detectedSections = [];
  const missingSections = [];

  for (const [section, regex] of Object.entries(sectionPatterns)) {
    if (regex.test(normalizedText)) {
      detectedSections.push(section);
    } else {
      missingSections.push(section);
    }
  }

  return { detectedSections, missingSections };
};

/**
 * Detect technical skills present in the resume text
 * @param {string} text 
 * @returns {Array<string>}
 */
const detectSkills = (text) => {
  const normalizedText = ` ${text.toLowerCase().replace(/[^a-z0-9#+.]/g, ' ')} `;
  const detected = [];

  for (const skill of SKILLS_VOCABULARY) {
    // Escape regex special characters in skills like c++, c#, node.js
    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');

    if (regex.test(normalizedText) && !detected.includes(skill)) {
      detected.push(skill);
    }
  }

  return detected;
};

/**
 * Perform keyword analysis (action verbs, quantifiable metrics)
 * @param {string} text 
 */
const analyzeKeywords = (text) => {
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const totalWords = words.length;

  const foundVerbs = [];
  for (const verb of ACTION_VERBS) {
    if (words.includes(verb)) {
      foundVerbs.push(verb);
    }
  }

  // Check for quantifiable metrics (numbers, %, metrics like ms, gb, users)
  const numbersCount = (text.match(/\b\d+(\.\d+)?%?\b/g) || []).length;
  const hasMetrics = numbersCount >= 2;

  // Keyword Score calculation (0 - 100)
  const verbScore = Math.min(50, foundVerbs.length * 10);
  const metricScore = Math.min(30, numbersCount * 10);
  const lengthScore = totalWords >= 200 && totalWords <= 900 ? 20 : 10;
  const keywordScore = Math.min(100, verbScore + metricScore + lengthScore);

  return {
    wordCount: totalWords,
    foundVerbs,
    numbersCount,
    hasMetrics,
    keywordScore,
  };
};

/**
 * Generate complete deterministic rule-based score & actionable improvement suggestions
 */
const evaluateResume = (text) => {
  const { detectedSections, missingSections } = detectSections(text);
  const detectedSkillsList = detectSkills(text);
  const keywordAnalysis = analyzeKeywords(text);

  // Section Scores breakdown
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/i;
  const phoneRegex = /\+?[0-9]{10,12}/;
  const linkRegex = /(linkedin\.com|github\.com)/i;

  const hasEmail = emailRegex.test(text);
  const hasPhone = phoneRegex.test(text);
  const hasLink = linkRegex.test(text);

  let contactScore = 0;
  if (hasEmail) contactScore += 5;
  if (hasPhone) contactScore += 5;
  if (hasLink) contactScore += 5;

  const educationScore = detectedSections.includes('Education') ? 15 : 0;
  const skillsScore = detectedSections.includes('Skills')
    ? Math.min(15, 5 + detectedSkillsList.length * 1.5)
    : Math.min(10, detectedSkillsList.length * 1.0);
  const projectsScore = detectedSections.includes('Projects') ? 15 : 0;
  const experienceScore = detectedSections.includes('Experience') ? 10 : 0;
  const certificationsScore = detectedSections.includes('Certifications') ? 5 : 0;
  const achievementsScore = detectedSections.includes('Achievements') ? 5 : 0;

  const sectionScores = {
    contact: Math.round(contactScore),
    education: Math.round(educationScore),
    skills: Math.round(skillsScore),
    projects: Math.round(projectsScore),
    experience: Math.round(experienceScore),
    certifications: Math.round(certificationsScore),
    achievements: Math.round(achievementsScore),
  };

  const totalSectionScore =
    sectionScores.contact +
    sectionScores.education +
    sectionScores.skills +
    sectionScores.projects +
    sectionScores.experience +
    sectionScores.certifications +
    sectionScores.achievements;

  // Keyword contribution (weighted at 20% of 100)
  const keywordContribution = Math.round((keywordAnalysis.keywordScore / 100) * 20);

  // Overall Score (0 - 100)
  const overallScore = Math.min(100, Math.round(totalSectionScore * 0.8 + keywordContribution));

  // Actionable Suggestions
  const suggestions = [];

  if (missingSections.includes('Projects')) {
    suggestions.push('Add a dedicated "Projects" section highlighting key technical projects with tools used.');
  }
  if (missingSections.includes('Experience')) {
    suggestions.push('Include internships, training, or practical experience to improve industry readiness.');
  }
  if (missingSections.includes('Certifications')) {
    suggestions.push('Add verified technical certifications (e.g. AWS, Coursera, NPTEL) to validate core proficiencies.');
  }
  if (!hasLink) {
    suggestions.push('Add your GitHub and LinkedIn profile links in the contact header.');
  }
  if (detectedSkillsList.length < 5) {
    suggestions.push('List more technical skills and frameworks across frontend, backend, and databases.');
  }
  if (keywordAnalysis.foundVerbs.length < 3) {
    suggestions.push('Use strong action verbs such as "developed", "architected", "optimized", and "deployed" in project descriptions.');
  }
  if (!keywordAnalysis.hasMetrics) {
    suggestions.push('Quantify project outcomes and contributions (e.g., "improved load time by 30%", "handled 1,000+ records").');
  }
  if (keywordAnalysis.wordCount < 200) {
    suggestions.push('Resume content is quite short. Elaborate on project architecture, responsibilities, and methodologies.');
  }

  if (suggestions.length === 0) {
    suggestions.push('Excellent resume structure! Your resume has comprehensive sections and strong keyword coverage.');
  }

  return {
    overallScore,
    sectionScores,
    detectedSections,
    missingSections,
    detectedSkills: detectedSkillsList,
    keywordScore: keywordAnalysis.keywordScore,
    wordCount: keywordAnalysis.wordCount,
    suggestions,
  };
};

/**
 * Execute resume testing for student (via direct upload or testing existing active resume)
 */
const testResume = async ({ userId, file, resumeId }) => {
  const student = await Student.findOne({ user: userId });
  if (!student) {
    const error = new Error('Student profile not found');
    error.statusCode = 404;
    throw error;
  }

  let pdfBuffer;
  let targetResume;

  if (file) {
    // Direct file upload test
    pdfBuffer = fs.readFileSync(file.path);

    // Save as new resume or associate with student
    targetResume = await Resume.create({
      student: student._id,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      isPrimary: true,
    });

    student.activeResume = targetResume._id;
    await student.save();
  } else {
    // Test currently active resume
    const searchId = resumeId || student.activeResume;
    if (!searchId) {
      const error = new Error('No resume found to test. Please upload a PDF resume first.');
      error.statusCode = 400;
      throw error;
    }

    targetResume = await Resume.findById(searchId);
    if (!targetResume || !fs.existsSync(targetResume.filePath)) {
      const error = new Error('Resume file not found on server storage. Please upload a fresh resume.');
      error.statusCode = 404;
      throw error;
    }

    pdfBuffer = fs.readFileSync(targetResume.filePath);
  }

  // Extract text
  const extractedText = await extractTextFromPdf(pdfBuffer);

  // Evaluate Resume
  const evaluation = evaluateResume(extractedText);

  // Update Resume model with ATS score and detected skills
  targetResume.extractedText = extractedText;
  targetResume.detectedSections = evaluation.detectedSections;
  targetResume.detectedSkills = evaluation.detectedSkills;
  targetResume.atsScore = evaluation.overallScore;
  await targetResume.save();

  // Save in ResumeTest collection
  const testRecord = await ResumeTest.create({
    student: student._id,
    resume: targetResume._id,
    overallScore: evaluation.overallScore,
    sectionScores: evaluation.sectionScores,
    keywordScore: evaluation.keywordScore,
    detectedSections: evaluation.detectedSections,
    missingSections: evaluation.missingSections,
    detectedSkills: evaluation.detectedSkills,
    suggestions: evaluation.suggestions,
    wordCount: evaluation.wordCount,
    isReadable: true,
  });

  return {
    testId: testRecord._id,
    resumeId: targetResume._id,
    fileName: targetResume.fileName,
    overallScore: evaluation.overallScore,
    sectionScores: evaluation.sectionScores,
    detectedSkills: evaluation.detectedSkills,
    missingSections: evaluation.missingSections,
    keywordScore: evaluation.keywordScore,
    suggestions: evaluation.suggestions,
    wordCount: evaluation.wordCount,
    createdAt: testRecord.createdAt,
  };
};

/**
 * Get all historical test results for the authenticated student
 */
const getTestResultsHistory = async (userId) => {
  const student = await Student.findOne({ user: userId });
  if (!student) {
    const error = new Error('Student profile not found');
    error.statusCode = 404;
    throw error;
  }

  const results = await ResumeTest.find({ student: student._id })
    .populate('resume', 'fileName fileSize createdAt')
    .sort('-createdAt')
    .lean();

  return results;
};

// 3. Stop words for Job Description keyword extraction
const STOP_WORDS = new Set([
  'the', 'and', 'with', 'for', 'from', 'that', 'this', 'have', 'will', 'our', 'your',
  'about', 'above', 'after', 'again', 'against', 'all', 'any', 'are', 'because', 'been',
  'before', 'being', 'below', 'between', 'both', 'but', 'by', 'could', 'did', 'does',
  'doing', 'down', 'during', 'each', 'few', 'further', 'had', 'has', 'having', 'her',
  'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'into', 'its', 'itself',
  'just', 'more', 'most', 'myself', 'nor', 'not', 'now', 'off', 'once', 'only', 'other',
  'ought', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'some',
  'such', 'than', 'them', 'themselves', 'then', 'there', 'these', 'they', 'through',
  'too', 'under', 'until', 'very', 'was', 'were', 'what', 'when', 'where', 'which',
  'while', 'who', 'whom', 'why', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves',
  'must', 'able', 'work', 'good', 'well', 'candidate', 'candidates', 'experience',
  'year', 'years', 'team', 'teams', 'looking', 'role', 'roles', 'company', 'responsibilities',
  'requirements', 'skills', 'including', 'knowledge', 'understanding', 'working',
  'seeking', 'ideal', 'build', 'help', 'join', 'strong', 'plus', 'need', 'across', 'using'
]);

/**
 * Extract prominent technical & domain keywords from Job Description
 * @param {string} text 
 * @param {number} maxKeywords 
 * @returns {Array<string>}
 */
const extractJobKeywords = (text, maxKeywords = 12) => {
  if (!text) return [];
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const freq = {};
  for (const w of words) {
    if (!STOP_WORDS.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }
  return Object.keys(freq)
    .sort((a, b) => freq[b] - freq[a])
    .slice(0, maxKeywords);
};

/**
 * Deterministic rule-based comparison between a student's resume and a recruitment drive
 * Criteria:
 *   1. Required Skills (45%)
 *   2. Job Description Keywords (25%)
 *   3. Job Role Keywords (15%)
 *   4. Education & Academic Requirements (15%)
 */
const compareResumeToDrive = ({ resumeText, drive, student }) => {
  const normalizedResume = ` ${resumeText.toLowerCase().replace(/[^a-z0-9#+.]/g, ' ')} `;

  // 1. Required Skills Matching (45% weight)
  const driveSkills = (drive.requiredSkills || [])
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const matchedSkills = [];
  const missingSkills = [];

  for (const skill of driveSkills) {
    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
    if (regex.test(normalizedResume)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const skillScore = driveSkills.length > 0
    ? (matchedSkills.length / driveSkills.length) * 45
    : 45;

  // 2. Job Description Keywords Matching (25% weight)
  const jdKeywords = extractJobKeywords(drive.jobDescription || '', 12);
  const matchedKeywords = [];
  const missingKeywords = [];

  for (const kw of jdKeywords) {
    const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
    if (regex.test(normalizedResume)) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  const keywordScore = jdKeywords.length > 0
    ? (matchedKeywords.length / jdKeywords.length) * 25
    : 25;

  // 3. Job Role Keywords Matching (15% weight)
  const roleTerms = (drive.jobRole || '')
    .toLowerCase()
    .match(/\b[a-z]{3,}\b/g) || [];
  
  let roleMatchedCount = 0;
  for (const term of roleTerms) {
    if (!STOP_WORDS.has(term) && normalizedResume.includes(term)) {
      roleMatchedCount++;
    }
  }

  const roleScore = roleTerms.length > 0
    ? (roleMatchedCount / roleTerms.length) * 15
    : 15;

  // 4. Education & Academic Requirements (15% weight)
  let educationScore = 0;

  // Branch match (5 pts)
  if (student && drive.eligibleBranches && drive.eligibleBranches.length > 0) {
    if (drive.eligibleBranches.includes(student.department)) {
      educationScore += 5;
    }
  } else {
    educationScore += 5;
  }

  // CGPA cutoff match (5 pts)
  if (student && typeof student.cgpa === 'number') {
    if (student.cgpa >= (drive.minimumCGPA || 0)) {
      educationScore += 5;
    }
  } else {
    educationScore += 5;
  }

  // Degree / Academic mentions in resume (5 pts)
  const degreeRegex = /(b\.?tech|bachelor|degree|computer science|engineering|b\.?e|m\.?tech|mca)/i;
  if (degreeRegex.test(resumeText)) {
    educationScore += 5;
  }

  // Total Match Percentage (0 - 100)
  const matchPercentage = Math.min(
    100,
    Math.max(0, Math.round(skillScore + keywordScore + roleScore + educationScore))
  );

  // 5. Generate Clear Improvement Suggestions
  const suggestions = [];

  if (missingSkills.length > 0) {
    suggestions.push(
      `Add projects or coursework highlighting missing required skills: ${missingSkills.join(', ')}.`
    );
  }

  if (missingKeywords.length > 0) {
    suggestions.push(
      `Incorporate key job description keywords into your project bullet points: ${missingKeywords.slice(0, 4).join(', ')}.`
    );
  }

  if (roleTerms.length > 0 && roleMatchedCount === 0) {
    suggestions.push(
      `Tailor your resume headline and summary towards the target role: "${drive.jobRole}".`
    );
  }

  if (student && typeof student.cgpa === 'number' && student.cgpa < (drive.minimumCGPA || 0)) {
    suggestions.push(
      `Notice: Student CGPA (${student.cgpa}) is below the drive cutoff (${drive.minimumCGPA}). Ensure strong practical projects to stand out.`
    );
  }

  if (suggestions.length === 0 || matchPercentage >= 85) {
    suggestions.unshift(
      `High alignment! Your resume and technical profile strongly match this ${drive.jobRole} drive.`
    );
  }

  return {
    matchPercentage,
    matchedSkills,
    missingSkills,
    matchedKeywords,
    missingKeywords,
    suggestions,
  };
};

/**
 * Match student's resume against a specific recruitment drive
 * @param {Object} params { userId, driveId, file, resumeId }
 */
const matchResumeWithDrive = async ({ userId, driveId, file, resumeId }) => {
  const student = await Student.findOne({ user: userId });
  if (!student) {
    const error = new Error('Student profile not found');
    error.statusCode = 404;
    throw error;
  }

  const drive = await RecruitmentDrive.findById(driveId).populate('company', 'companyName');
  if (!drive) {
    const error = new Error('Recruitment drive not found');
    error.statusCode = 404;
    throw error;
  }

  let pdfBuffer;
  let targetResume;

  if (file) {
    pdfBuffer = fs.readFileSync(file.path);
    targetResume = await Resume.create({
      student: student._id,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      isPrimary: true,
    });
    student.activeResume = targetResume._id;
    await student.save();
  } else {
    const searchId = resumeId || student.activeResume;
    if (!searchId) {
      const error = new Error('No resume found to match. Please upload a PDF resume first.');
      error.statusCode = 400;
      throw error;
    }

    targetResume = await Resume.findById(searchId);
    if (!targetResume || !fs.existsSync(targetResume.filePath)) {
      const error = new Error('Resume file not found on server storage. Please upload a fresh resume.');
      error.statusCode = 404;
      throw error;
    }

    pdfBuffer = fs.readFileSync(targetResume.filePath);
  }

  // Extract text from PDF
  const resumeText = await extractTextFromPdf(pdfBuffer);

  // Compare resume against drive
  const comparison = compareResumeToDrive({ resumeText, drive, student });

  // Store match result in ResumeTest collection
  const testRecord = await ResumeTest.create({
    student: student._id,
    resume: targetResume._id,
    recruitmentDrive: drive._id,
    testType: 'JOB_MATCH',
    overallScore: comparison.matchPercentage,
    matchPercentage: comparison.matchPercentage,
    matchedSkills: comparison.matchedSkills,
    missingSkills: comparison.missingSkills,
    matchedKeywords: comparison.matchedKeywords,
    missingKeywords: comparison.missingKeywords,
    suggestions: comparison.suggestions,
    wordCount: resumeText.split(/\s+/).length,
    isReadable: true,
  });

  return {
    matchPercentage: comparison.matchPercentage,
    matchedSkills: comparison.matchedSkills,
    missingSkills: comparison.missingSkills,
    matchedKeywords: comparison.matchedKeywords,
    missingKeywords: comparison.missingKeywords,
    suggestions: comparison.suggestions,
    testId: testRecord._id,
    driveId: drive._id,
    jobRole: drive.jobRole,
    companyName: drive.company ? drive.company.companyName : 'Company',
    testedAt: testRecord.createdAt,
  };
};

module.exports = {
  extractTextFromPdf,
  evaluateResume,
  testResume,
  getTestResultsHistory,
  compareResumeToDrive,
  matchResumeWithDrive,
};

