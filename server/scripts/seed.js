/**
 * CampusHire - Database Seeder Script
 * Seeds demo accounts, companies, drives, updates, and initial placement records
 * Usage: node scripts/seed.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const {
  User,
  Student,
  Company,
  RecruitmentDrive,
  Application,
  Interview,
  Notification,
  PlacementUpdate,
  Result,
} = require('../models');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campushire';

async function seed() {
  console.log('🌱 Starting CampusHire database seeder...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB at:', MONGO_URI);

  // 1. Seed or Verify Demo Admin / TPO Officer
  let admin = await User.findOne({ email: 'admin@campushire.edu' });
  if (!admin) {
    admin = await User.create({
      name: 'Dr. Suresh Kumar (TPO Head)',
      email: 'admin@campushire.edu',
      password: 'Admin@123',
      role: 'tpo',
      isActive: true,
    });
    console.log('✅ Demo Admin created: admin@campushire.edu / Admin@123');
  } else {
    console.log('ℹ️ Demo Admin already exists');
  }

  // 2. Seed or Verify Demo Student
  let studentUser = await User.findOne({ email: 'student@campushire.edu' });
  if (!studentUser) {
    studentUser = await User.create({
      name: 'Aarav Sharma',
      email: 'student@campushire.edu',
      password: 'Student@123',
      role: 'student',
      isActive: true,
    });

    const studentProfile = await Student.create({
      user: studentUser._id,
      rollNumber: '22CS0101',
      department: 'CSE',
      batchYear: 2026,
      cgpa: 8.85,
      tenthPercentage: 92.5,
      twelfthOrDiplomaPercentage: 90.0,
      activeBacklogs: 0,
      historyBacklogs: 0,
      phone: '+91 98765 43210',
      skills: ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'Tailwind CSS', 'Docker'],
      programmingLanguages: ['JavaScript', 'Python', 'C++'],
      githubUrl: 'https://github.com/aaravsharma',
      linkedinUrl: 'https://linkedin.com/in/aaravsharma',
      placementStatus: 'Unplaced',
      projects: [
        {
          title: 'Campus Placement Portal',
          description: 'Full-stack MERN placement application with deterministic ATS scoring',
          techStack: ['React', 'Node.js', 'Express', 'MongoDB'],
          link: 'https://github.com/aaravsharma/campushire',
        },
      ],
    });
    console.log('✅ Demo Student created: student@campushire.edu / Student@123');
  } else {
    console.log('ℹ️ Demo Student already exists');
  }

  // 3. Seed Companies
  const companiesData = [
    {
      name: 'Google India',
      industry: 'IT / Software',
      tier: 'SuperDream',
      location: 'Bengaluru / Hyderabad',
      website: 'https://careers.google.com',
      contactEmail: 'campus-recruitment@google.com',
      jobRoles: ['Software Engineer (SWE-1)', 'Site Reliability Engineer'],
      isActive: true,
    },
    {
      name: 'Microsoft Corporation',
      industry: 'Cloud & Enterprise',
      tier: 'SuperDream',
      location: 'Hyderabad / Noida',
      website: 'https://careers.microsoft.com',
      contactEmail: 'university-hiring@microsoft.com',
      jobRoles: ['Software Development Engineer', 'Cloud Solution Architect'],
      isActive: true,
    },
    {
      name: 'Amazon Development Centre',
      industry: 'E-Commerce & Cloud',
      tier: 'Dream',
      location: 'Bengaluru / Chennai',
      website: 'https://amazon.jobs',
      contactEmail: 'campus-india@amazon.com',
      jobRoles: ['Graduate SDE', 'Applied Scientist Trainee'],
      isActive: true,
    },
  ];

  const seededCompanies = [];
  for (const cData of companiesData) {
    let comp = await Company.findOne({ name: cData.name });
    if (!comp) {
      comp = await Company.create(cData);
      console.log(`✅ Company created: ${cData.name}`);
    }
    seededCompanies.push(comp);
  }

  // 4. Seed Recruitment Drives
  const drivesData = [
    {
      company: seededCompanies[0]._id,
      jobTitle: 'Software Engineer - Campus Trainee',
      jobRole: 'Software Engineer - Campus Trainee',
      jobDescription:
        'Join Google Engineering team to design, build, and deploy large-scale distributed systems and user-facing applications.\nRequired Skills: Data Structures, Algorithms, React, Node.js, and Cloud Computing basics.',
      package: 24.5,
      ctcPackage: 24.5,
      minimumCGPA: 8.0,
      maximumBacklogs: 0,
      eligibleBranches: ['CSE', 'IT', 'ECE'],
      graduationYear: 2026,
      numberOfPositions: 10,
      requiredSkills: ['React', 'Node.js', 'Data Structures', 'Algorithms', 'Docker', 'AWS'],
      rounds: [
        { roundNumber: 1, name: 'Online Coding Assessment', description: 'DSA questions on HackerRank' },
        { roundNumber: 2, name: 'Technical Interview 1', description: 'Live system design & algorithmic problem solving' },
        { roundNumber: 3, name: 'Googleyness & Leadership', description: 'Cultural fit and behavioral assessment' },
      ],
      applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 days
      driveDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // +21 days
      status: 'OPEN',
      createdBy: admin._id,
    },
    {
      company: seededCompanies[1]._id,
      jobTitle: 'Software Development Engineer (SDE)',
      jobRole: 'Software Development Engineer (SDE)',
      jobDescription:
        'Develop cutting-edge enterprise cloud services on Microsoft Azure and modern web ecosystems.\nRequires strong problem solving and full-stack web fundamentals.',
      package: 18.0,
      ctcPackage: 18.0,
      minimumCGPA: 7.5,
      maximumBacklogs: 0,
      eligibleBranches: ['CSE', 'IT', 'ECE', 'AI&DS'],
      graduationYear: 2026,
      numberOfPositions: 15,
      requiredSkills: ['JavaScript', 'React', 'Node.js', 'C++', 'Cloud Computing'],
      rounds: [
        { roundNumber: 1, name: 'Online Assessment', description: 'MCQ & Coding on Codility' },
        { roundNumber: 2, name: 'Technical Round 1', description: 'Data structures and web APIs' },
        { roundNumber: 3, name: 'Director Round', description: 'Final project viva and culture interview' },
      ],
      applicationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      driveDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      status: 'OPEN',
      createdBy: admin._id,
    },
    {
      company: seededCompanies[2]._id,
      jobTitle: 'Cloud Support Trainee',
      jobRole: 'Cloud Support Trainee',
      jobDescription:
        'Work with global cloud infrastructure engineers delivering high-performance scalable web systems.',
      package: 12.0,
      ctcPackage: 12.0,
      minimumCGPA: 7.0,
      maximumBacklogs: 1,
      eligibleBranches: ['CSE', 'IT', 'ECE', 'EEE', 'MECH'],
      graduationYear: 2026,
      numberOfPositions: 20,
      requiredSkills: ['Linux', 'Networking', 'Python', 'AWS'],
      rounds: [
        { roundNumber: 1, name: 'Aptitude & Technical MCQ', description: 'Core CS concepts and Linux fundamentals' },
        { roundNumber: 2, name: 'Technical Interview', description: 'Scripting and troubleshooting' },
      ],
      applicationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      driveDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      status: 'OPEN',
      createdBy: admin._id,
    },
  ];

  for (const dData of drivesData) {
    const existing = await RecruitmentDrive.findOne({
      company: dData.company,
      jobRole: dData.jobRole,
    });
    if (!existing) {
      await RecruitmentDrive.create(dData);
      console.log(`✅ Drive created: ${dData.jobRole}`);
    }
  }

  // 5. Seed Placement Updates
  const updatesData = [
    {
      title: 'Mandatory Placement Orientation for Batch of 2026',
      description:
        'All final-year engineering students registered for on-campus placements must attend the orientation session in the Main Auditorium on Friday at 10:00 AM.',
      category: 'IMPORTANT',
      priority: 'URGENT',
      publishedAt: new Date(),
      createdBy: admin._id,
    },
    {
      title: 'Google & Microsoft Campus Recruitment Schedules Finalized',
      description:
        'Google India and Microsoft Corporation have officially opened their recruitment drives on the CampusHire portal. Verify your CGPA eligibility and test your resume before applying.',
      category: 'RECRUITMENT',
      priority: 'HIGH',
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      createdBy: admin._id,
    },
    {
      title: 'Resume Testing & Verification Guidelines',
      description:
        'Ensure your active PDF resume contains clear contact information, technical project links (GitHub/LinkedIn), and verifiable skills for optimal ATS keyword matching.',
      category: 'GENERAL',
      priority: 'MEDIUM',
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdBy: admin._id,
    },
  ];

  for (const uData of updatesData) {
    const existing = await PlacementUpdate.findOne({ title: uData.title });
    if (!existing) {
      await PlacementUpdate.create(uData);
      console.log(`✅ Notice bulletin created: ${uData.title}`);
    }
  }

  console.log('====================================================');
  console.log('🎉 Database seeding completed successfully!');
  console.log('Demo Credentials:');
  console.log('  Admin/TPO : admin@campushire.edu / Admin@123');
  console.log('  Student   : student@campushire.edu / Student@123');
  console.log('====================================================');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeder failed:', err);
  process.exit(1);
});
