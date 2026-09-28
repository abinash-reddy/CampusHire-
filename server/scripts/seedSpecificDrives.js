/**
 * CampusHire - Seed Specific 16.5 LPA Drives and Interview Workflows
 * Adds:
 * 1. Agent Developer (16.5 LPA) - Google India
 * 2. UI/UX Designer (16.5 LPA) - Figma
 * 3. Backend Developer (16.5 LPA) - Amazon
 * 4. Frontend Developer (16.5 LPA) - Razorpay
 * Also links student Abinash Reddy, creates sample application, and sets up interview schedule.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const {
  User,
  Student,
  Company,
  RecruitmentDrive,
  Application,
  Interview,
  PlacementUpdate,
  Notification,
} = require('../models');

async function seedRequestedDrives() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campushire';
  console.log('Connecting to:', mongoUri);
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB successfully');

  // 1. Ensure Admin exists
  let admin = await User.findOne({ role: { $in: ['admin', 'tpo'] } });
  if (!admin) {
    admin = await User.create({
      name: 'Campus Placement Officer',
      email: 'admin@campushire.edu',
      password: 'Admin@123',
      role: 'tpo',
    });
  }

  // 2. Ensure Companies
  const companiesList = [
    {
      name: 'Google India',
      industry: 'AI & Cloud Infrastructure',
      tier: 'SuperDream',
      location: 'Bengaluru / Hyderabad',
      website: 'https://careers.google.com',
      contactEmail: 'campus-recruitment@google.com',
      jobRoles: ['Agent Developer', 'Software Engineer'],
    },
    {
      name: 'Figma Inc.',
      industry: 'Design Systems & Web Tech',
      tier: 'SuperDream',
      location: 'Bengaluru / Remote',
      website: 'https://www.figma.com/careers',
      contactEmail: 'university-talent@figma.com',
      jobRoles: ['UI/UX Designer', 'Product Designer'],
    },
    {
      name: 'Amazon Web Services',
      industry: 'Cloud & Distributed Systems',
      tier: 'SuperDream',
      location: 'Bengaluru / Chennai',
      website: 'https://amazon.jobs',
      contactEmail: 'campus-india@amazon.com',
      jobRoles: ['Backend Developer', 'Systems Engineer'],
    },
    {
      name: 'Razorpay Technologies',
      industry: 'Fintech & Web Platform',
      tier: 'SuperDream',
      location: 'Bengaluru / Pune',
      website: 'https://razorpay.com/jobs',
      contactEmail: 'campus-hiring@razorpay.com',
      jobRoles: ['Frontend Developer', 'Full Stack Engineer'],
    },
  ];

  const companyMap = {};
  for (const c of companiesList) {
    let comp = await Company.findOne({ name: c.name });
    if (!comp) {
      comp = await Company.create(c);
      console.log(`Created Company: ${c.name}`);
    } else {
      comp.tier = c.tier;
      comp.industry = c.industry;
      comp.website = c.website;
      await comp.save();
    }
    companyMap[c.name] = comp;
  }

  // 3. Ensure the four 16.5 LPA Drives requested by user
  const requestedDrives = [
    {
      company: companyMap['Google India']._id,
      jobRole: 'Agent Developer',
      jobTitle: 'Agent Developer',
      jobDescription:
        'Design and deploy intelligent AI agents, multi-agent orchestrations, LLM tool integration, and autonomous reasoning workflows. Strong grasp of JavaScript/Python, prompt engineering, vector databases, and REST APIs required.',
      package: 16.5,
      ctcPackage: 16.5,
      minimumCGPA: 7.0,
      maximumBacklogs: 0,
      eligibleBranches: ['CSE', 'IT', 'AI&DS', 'ECE'],
      graduationYear: 2026,
      numberOfPositions: 8,
      location: 'Bengaluru / Hyderabad',
      requiredSkills: ['Python', 'JavaScript', 'Node.js', 'LLM Agents', 'LangChain', 'APIs'],
      rounds: [
        { roundNumber: 1, name: 'AI & Coding Assessment', description: 'Algorithmic coding and agent logic evaluation' },
        { roundNumber: 2, name: 'Technical Interview 1', description: 'System design, LLM tool patterns, and API integration' },
        { roundNumber: 3, name: 'Leadership & Googleyness', description: 'Culture fit and behavioral evaluation' },
      ],
      applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      driveDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      status: 'OPEN',
      createdBy: admin._id,
    },
    {
      company: companyMap['Figma Inc.']._id,
      jobRole: 'UI/UX Designer',
      jobTitle: 'UI/UX Designer',
      jobDescription:
        'Craft delightful, intuitive user interfaces, wireframes, design tokens, responsive web layouts, and interactive prototypes. Proficiency with Figma, responsive design systems, accessibility standards, and design critique.',
      package: 16.5,
      ctcPackage: 16.5,
      minimumCGPA: 6.5,
      maximumBacklogs: 0,
      eligibleBranches: ['CSE', 'IT', 'ECE', 'AI&DS', 'MECH', 'CIVIL'],
      graduationYear: 2026,
      numberOfPositions: 5,
      location: 'Bengaluru / Remote',
      requiredSkills: ['Figma', 'UI/UX Design', 'Design Systems', 'Prototyping', 'CSS', 'HTML'],
      rounds: [
        { roundNumber: 1, name: 'Portfolio Review', description: 'Evaluation of design portfolio and case studies' },
        { roundNumber: 2, name: 'Design Challenge Round', description: 'Live UI redesign and interactive prototyping challenge' },
        { roundNumber: 3, name: 'Product Collaboration Round', description: 'Cross-functional design critique with engineers' },
      ],
      applicationDeadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      driveDate: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000),
      status: 'OPEN',
      createdBy: admin._id,
    },
    {
      company: companyMap['Amazon Web Services']._id,
      jobRole: 'Backend Developer',
      jobTitle: 'Backend Developer',
      jobDescription:
        'Build scalable microservices, secure RESTful APIs, distributed caching layers, and database schemas handling millions of requests. Strong foundation in Node.js/Express, MongoDB, relational DBs, concurrency, and security.',
      package: 16.5,
      ctcPackage: 16.5,
      minimumCGPA: 7.0,
      maximumBacklogs: 0,
      eligibleBranches: ['CSE', 'IT', 'ECE', 'AI&DS'],
      graduationYear: 2026,
      numberOfPositions: 12,
      location: 'Bengaluru / Chennai',
      requiredSkills: ['Node.js', 'Express', 'MongoDB', 'REST APIs', 'SQL', 'Data Structures', 'Docker'],
      rounds: [
        { roundNumber: 1, name: 'Online Assessment', description: 'DSA questions and backend system concepts' },
        { roundNumber: 2, name: 'Technical Interview 1', description: 'System design, database indexing, and API concurrency' },
        { roundNumber: 3, name: 'Bar Raiser Round', description: 'Amazon Leadership Principles and deep architecture deep-dive' },
      ],
      applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      driveDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
      status: 'OPEN',
      createdBy: admin._id,
    },
    {
      company: companyMap['Razorpay Technologies']._id,
      jobRole: 'Frontend Developer',
      jobTitle: 'Frontend Developer',
      jobDescription:
        'Develop responsive, accessible, high-performance web applications and merchant dashboards using React, Vite, Tailwind CSS, and state management. Strong understanding of JavaScript ES6+, browser performance, and component patterns.',
      package: 16.5,
      ctcPackage: 16.5,
      minimumCGPA: 7.0,
      maximumBacklogs: 0,
      eligibleBranches: ['CSE', 'IT', 'AI&DS', 'ECE'],
      graduationYear: 2026,
      numberOfPositions: 10,
      location: 'Bengaluru / Pune',
      requiredSkills: ['React', 'JavaScript', 'HTML5', 'Tailwind CSS', 'Vite', 'Redux / Context', 'Web APIs'],
      rounds: [
        { roundNumber: 1, name: 'Frontend Machine Coding', description: 'Live component build with clean CSS and state handling' },
        { roundNumber: 2, name: 'Technical Interview 1', description: 'React internals, performance optimization, and browser APIs' },
        { roundNumber: 3, name: 'Culture & Engineering Values', description: 'Team fit, velocity, and problem solving mindset' },
      ],
      applicationDeadline: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
      driveDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
      status: 'OPEN',
      createdBy: admin._id,
    },
  ];

  const createdDrives = [];
  for (const driveData of requestedDrives) {
    let drive = await RecruitmentDrive.findOne({
      company: driveData.company,
      jobRole: driveData.jobRole,
    });

    if (!drive) {
      drive = await RecruitmentDrive.create(driveData);
      console.log(`Created Drive: ${driveData.jobRole} @ ${driveData.package} LPA`);
    } else {
      drive.package = driveData.package;
      drive.ctcPackage = driveData.package;
      drive.jobDescription = driveData.jobDescription;
      drive.requiredSkills = driveData.requiredSkills;
      drive.status = 'OPEN';
      await drive.save();
      console.log(`Updated Drive: ${driveData.jobRole} @ ${driveData.package} LPA`);
    }
    createdDrives.push(drive);
  }

  // 4. Ensure Student Abinash Reddy has profile & application
  let abinashUser = await User.findOne({ email: 'abinashreddy792@gmail.com' });
  if (abinashUser) {
    let studentProfile = await Student.findOne({ user: abinashUser._id });
    if (!studentProfile) {
      studentProfile = await Student.create({
        user: abinashUser._id,
        rollNumber: '21CS099',
        department: 'CSE',
        batchYear: 2026,
        cgpa: 8.5,
        tenthPercentage: 90,
        twelfthOrDiplomaPercentage: 88,
        activeBacklogs: 0,
        historyBacklogs: 0,
        skills: ['React', 'Node.js', 'Express', 'MongoDB', 'Python', 'Tailwind CSS'],
        placementStatus: 'Unplaced',
      });
      console.log('Created student profile for Abinash Reddy');
    }

    // Create / ensure application for Agent Developer
    const agentDrive = createdDrives.find((d) => d.jobRole === 'Agent Developer');
    let existingApp = await Application.findOne({
      student: studentProfile._id,
      recruitmentDrive: agentDrive._id,
    });

    if (!existingApp) {
      existingApp = await Application.create({
        student: studentProfile._id,
        recruitmentDrive: agentDrive._id,
        status: 'TECHNICAL_INTERVIEW',
        stage: 'Technical Interview Round 1',
        remarks: 'Candidate shortlisted for Agent Developer round',
        appliedAt: new Date(),
        statusHistory: [
          { status: 'APPLIED', updatedAt: new Date(), remarks: 'Direct application submitted' },
          { status: 'SHORTLISTED', updatedAt: new Date(), remarks: 'Candidate profile verified' },
          { status: 'TECHNICAL_INTERVIEW', updatedAt: new Date(), remarks: 'Interview slot scheduled' },
        ],
      });
      console.log('Created application for Abinash Reddy -> Agent Developer');
    }

    // Create / ensure interview schedule for Abinash Reddy
    let existingInterview = await Interview.findOne({
      application: existingApp._id,
    });

    if (!existingInterview) {
      const interviewDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
      existingInterview = await Interview.create({
        application: existingApp._id,
        student: studentProfile._id,
        recruitmentDrive: agentDrive._id,
        round: 'Technical Interview Round 1',
        roundName: 'Technical Interview Round 1',
        date: interviewDate,
        time: '11:00 AM',
        mode: 'Online',
        meetingLink: 'https://meet.google.com/xyz-campushire-agent',
        instructions: 'Please be online 5 minutes before scheduled slot with your laptop ready for live agent prototyping.',
        status: 'SCHEDULED',
        scheduledAt: interviewDate,
      });
      console.log('Scheduled Interview for Abinash Reddy!');
    }
  }

  // 5. Create Placement Update Circular announcing the 16.5 LPA drives
  const existingUpdate = await PlacementUpdate.findOne({
    title: { $regex: /16\.5 LPA/i },
  });

  if (!existingUpdate) {
    await PlacementUpdate.create({
      title: 'Mega Campus Recruitment 2026: 16.5 LPA Drives Announced!',
      content:
        'Exciting recruitment drives for 2026 batch are now open: Agent Developer (Google India), UI/UX Designer (Figma), Backend Developer (Amazon), and Frontend Developer (Razorpay) at 16.5 LPA package. Shortlisted candidates will be notified for upcoming technical interview schedules.',
      category: 'RECRUITMENT',
      priority: 'HIGH',
      createdBy: admin._id,
    });
    console.log('Created Placement Update Bulletin for 16.5 LPA drives');
  }

  console.log('All requested drives, applications, and interview schedules successfully seeded!');
  await mongoose.disconnect();
}

seedRequestedDrives().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
