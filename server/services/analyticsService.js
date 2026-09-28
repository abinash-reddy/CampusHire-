const mongoose = require('mongoose');
const {
  Student,
  User,
  Company,
  RecruitmentDrive,
  Application,
  Result,
} = require('../models');

/**
 * Fetch branch-wise placement analytics
 * Calculates total, placed, unplaced students and placement rate per branch
 */
const getBranchPlacementAnalytics = async () => {
  // 1. Fetch all student profiles
  const students = await Student.find().lean();

  // 2. Identify students with confirmed placement offers / selection results
  const placedResultsStudentIds = await Result.distinct('student', {
    status: { $in: ['SELECTED', 'ACCEPTED', 'OFFERED'] },
  });
  const selectedAppStudentIds = await Application.distinct('student', {
    status: 'SELECTED',
  });

  const placedStudentIdsSet = new Set(
    placedResultsStudentIds.concat(selectedAppStudentIds).map(String)
  );

  // 3. Group by branch/department
  const branchMap = {};

  for (const s of students) {
    const branch = s.department || 'OTHER';
    if (!branchMap[branch]) {
      branchMap[branch] = {
        branch,
        department: branch,
        totalStudents: 0,
        registeredStudents: 0,
        placedStudents: 0,
        unplacedStudents: 0,
        placementRate: 0,
        placed: 0,
        total: 0,
        count: 0,
        highestPackage: 0,
        averagePackage: 0,
        packages: [],
        cgpas: [],
      };
    }

    branchMap[branch].totalStudents += 1;
    branchMap[branch].total += 1;

    // Check if student is actively registered for placement
    if (s.placementStatus !== 'Opted Out') {
      branchMap[branch].registeredStudents += 1;
    }

    const isPlaced =
      s.placementStatus === 'Placed' || placedStudentIdsSet.has(String(s._id));

    if (isPlaced) {
      branchMap[branch].placedStudents += 1;
      branchMap[branch].placed += 1;
      branchMap[branch].count += 1;

      const pkg = Number(s.currentHighestCtc) || 0;
      if (pkg > 0) {
        branchMap[branch].packages.push(pkg);
      }
    } else {
      branchMap[branch].unplacedStudents += 1;
    }

    if (s.cgpa) {
      branchMap[branch].cgpas.push(Number(s.cgpa));
    }
  }

  // 4. Format into clean array for dashboard charts
  const branchList = Object.values(branchMap).map((item) => {
    const rate =
      item.totalStudents > 0
        ? Number(((item.placedStudents / item.totalStudents) * 100).toFixed(1))
        : 0;

    const highestPkg =
      item.packages.length > 0 ? Math.max(...item.packages) : 0;
    const avgPkg =
      item.packages.length > 0
        ? Number(
            (
              item.packages.reduce((acc, curr) => acc + curr, 0) /
              item.packages.length
            ).toFixed(2)
          )
        : 0;
    const avgCgpa =
      item.cgpas.length > 0
        ? Number(
            (
              item.cgpas.reduce((acc, curr) => acc + curr, 0) /
              item.cgpas.length
            ).toFixed(2)
          )
        : 0;

    return {
      branch: item.branch,
      department: item.department,
      totalStudents: item.totalStudents,
      registeredStudents: item.registeredStudents || item.totalStudents,
      placedStudents: item.placedStudents,
      unplacedStudents: item.unplacedStudents,
      placementRate: rate,
      placed: item.placedStudents,
      total: item.totalStudents,
      count: item.placedStudents,
      highestPackage: highestPkg,
      averagePackage: avgPkg,
      averageCgpa: avgCgpa,
    };
  });

  // Sort by highest placement count descending
  branchList.sort((a, b) => b.placedStudents - a.placedStudents || b.totalStudents - a.totalStudents);

  return branchList;
};

/**
 * Fetch company-wise application counts & recruitment performance
 * Calculates total applications, shortlists, and selections per company
 */
const getCompanyApplicationAnalytics = async () => {
  // 1. Fetch all companies
  const companies = await Company.find().lean();

  // 2. Fetch all recruitment drives
  const drives = await RecruitmentDrive.find().lean();
  const driveCompanyMap = {};
  const companyDrivesCountMap = {};
  const companyActiveDrivesCountMap = {};

  for (const drive of drives) {
    const companyIdStr = String(drive.company);
    driveCompanyMap[String(drive._id)] = companyIdStr;

    companyDrivesCountMap[companyIdStr] = (companyDrivesCountMap[companyIdStr] || 0) + 1;
    if (['OPEN', 'UPCOMING', 'ONGOING', 'PUBLISHED'].includes(drive.status)) {
      companyActiveDrivesCountMap[companyIdStr] =
        (companyActiveDrivesCountMap[companyIdStr] || 0) + 1;
    }
  }

  // 3. Fetch all applications
  const applications = await Application.find().lean();

  const companyStatsMap = {};

  // Initialize for all known companies
  for (const comp of companies) {
    const cId = String(comp._id);
    const compName = comp.name || comp.companyName || 'Hiring Partner';
    companyStatsMap[cId] = {
      companyId: comp._id,
      companyName: compName,
      company: compName,
      name: compName,
      industry: comp.industry || 'IT / Software',
      tier: comp.tier || 'Normal',
      totalApplications: 0,
      applicationsCount: 0,
      applicationCount: 0,
      shortlistedCount: 0,
      selectedCount: 0,
      rejectedCount: 0,
      drivesCount: companyDrivesCountMap[cId] || 0,
      activeDrivesCount: companyActiveDrivesCountMap[cId] || 0,
    };
  }

  // Aggregate applications per company
  for (const app of applications) {
    const companyId = driveCompanyMap[String(app.recruitmentDrive)];
    if (!companyId) continue;

    if (!companyStatsMap[companyId]) {
      companyStatsMap[companyId] = {
        companyId,
        companyName: 'Partner Company',
        company: 'Partner Company',
        name: 'Partner Company',
        industry: 'IT / Software',
        tier: 'Normal',
        totalApplications: 0,
        applicationsCount: 0,
        applicationCount: 0,
        shortlistedCount: 0,
        selectedCount: 0,
        rejectedCount: 0,
        drivesCount: companyDrivesCountMap[companyId] || 0,
        activeDrivesCount: companyActiveDrivesCountMap[companyId] || 0,
      };
    }

    companyStatsMap[companyId].totalApplications += 1;
    companyStatsMap[companyId].applicationsCount += 1;
    companyStatsMap[companyId].applicationCount += 1;

    if (app.status === 'SHORTLISTED') {
      companyStatsMap[companyId].shortlistedCount += 1;
    } else if (app.status === 'SELECTED') {
      companyStatsMap[companyId].selectedCount += 1;
    } else if (app.status === 'REJECTED') {
      companyStatsMap[companyId].rejectedCount += 1;
    }
  }

  // Fetch results to account for any selections logged via Result collection
  const results = await Result.find().lean();
  for (const res of results) {
    const companyId = String(res.company);
    if (companyStatsMap[companyId]) {
      if (res.status === 'SELECTED' && companyStatsMap[companyId].selectedCount === 0) {
        companyStatsMap[companyId].selectedCount += 1;
      }
    }
  }

  const companyList = Object.values(companyStatsMap);

  // Sort by total applications descending
  companyList.sort((a, b) => b.totalApplications - a.totalApplications || a.companyName.localeCompare(b.companyName));

  return companyList;
};

/**
 * Fetch drive-wise application counts
 */
const getDriveApplicationAnalytics = async () => {
  const drives = await RecruitmentDrive.find()
    .populate('company', 'name companyName industry tier')
    .lean();

  const applications = await Application.find().lean();

  const driveAppCountMap = {};
  for (const app of applications) {
    const dId = String(app.recruitmentDrive);
    if (!driveAppCountMap[dId]) {
      driveAppCountMap[dId] = {
        total: 0,
        shortlisted: 0,
        selected: 0,
        rejected: 0,
      };
    }
    driveAppCountMap[dId].total += 1;
    if (app.status === 'SHORTLISTED') driveAppCountMap[dId].shortlisted += 1;
    if (app.status === 'SELECTED') driveAppCountMap[dId].selected += 1;
    if (app.status === 'REJECTED') driveAppCountMap[dId].rejected += 1;
  }

  return drives.map((d) => {
    const stats = driveAppCountMap[String(d._id)] || {
      total: 0,
      shortlisted: 0,
      selected: 0,
      rejected: 0,
    };
    const compName = d.company ? (d.company.name || d.company.companyName || 'Unknown') : 'Unknown';

    return {
      driveId: d._id,
      recruitmentDrive: d._id,
      jobRole: d.jobRole || d.jobTitle,
      company: compName,
      companyName: compName,
      package: d.package || d.ctcPackage,
      status: d.status,
      numberOfPositions: d.numberOfPositions || 1,
      totalApplications: stats.total,
      shortlistedStudents: stats.shortlisted,
      selectedStudents: stats.selected,
      rejectedStudents: stats.rejected,
      applicationDeadline: d.applicationDeadline,
      driveDate: d.driveDate,
    };
  });
};

/**
 * Fetch comprehensive placement overview analytics
 */
const getOverviewAnalytics = async () => {
  // 1. Total & Registered Students
  const totalStudentProfiles = await Student.countDocuments();
  const totalStudentUsers = await User.countDocuments({ role: 'student' });
  const totalStudents = Math.max(totalStudentProfiles, totalStudentUsers);

  const registeredStudentsCount = await Student.countDocuments({
    placementStatus: { $ne: 'Opted Out' },
  });
  const registeredStudents = registeredStudentsCount || totalStudents;

  // 2. Total Companies
  const totalCompanies = await Company.countDocuments();

  // 3. Active Recruitment Drives
  const activeRecruitmentDrives = await RecruitmentDrive.countDocuments({
    status: { $in: ['OPEN', 'UPCOMING', 'ONGOING', 'PUBLISHED'] },
  });

  // 4. Total Applications
  const totalApplications = await Application.countDocuments();

  // 5. Shortlisted Students
  const shortlistedStudents = await Application.countDocuments({
    status: 'SHORTLISTED',
  });

  // 6. Selected Students
  const selectedResultsCount = await Result.countDocuments({
    status: { $in: ['SELECTED', 'ACCEPTED', 'OFFERED'] },
  });
  const selectedAppsCount = await Application.countDocuments({
    status: 'SELECTED',
  });
  const placedStudentsCount = await Student.countDocuments({
    placementStatus: 'Placed',
  });
  const selectedStudents = Math.max(
    selectedResultsCount,
    selectedAppsCount,
    placedStudentsCount
  );

  // 7. Rejected Students
  const rejectedResultsCount = await Result.countDocuments({
    status: 'REJECTED',
  });
  const rejectedAppsCount = await Application.countDocuments({
    status: 'REJECTED',
  });
  const rejectedStudents = Math.max(rejectedResultsCount, rejectedAppsCount);

  // 8. Detailed Breakdown Arrays
  const branchWisePlacementCounts = await getBranchPlacementAnalytics();
  const companyWiseApplicationCounts = await getCompanyApplicationAnalytics();
  const driveWiseApplicationCounts = await getDriveApplicationAnalytics();

  // Placement Rate Calculation
  const placementRate =
    totalStudents > 0
      ? Number(((selectedStudents / totalStudents) * 100).toFixed(1))
      : 0;

  return {
    totalStudents,
    registeredStudents,
    totalCompanies,
    activeRecruitmentDrives,
    totalApplications,
    shortlistedStudents,
    selectedStudents,
    rejectedStudents,
    placementRate,
    branchWisePlacementCounts,
    companyWiseApplicationCounts,
    driveWiseApplicationCounts,
    // Aliases for dashboard flexibility
    branchWisePlacements: branchWisePlacementCounts,
    companyWiseApplications: companyWiseApplicationCounts,
    driveWiseApplications: driveWiseApplicationCounts,
    branches: branchWisePlacementCounts,
    companies: companyWiseApplicationCounts,
    drives: driveWiseApplicationCounts,
  };
};

module.exports = {
  getOverviewAnalytics,
  getBranchPlacementAnalytics,
  getCompanyApplicationAnalytics,
  getDriveApplicationAnalytics,
};
