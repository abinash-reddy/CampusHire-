const mongoose = require('mongoose');
const { Company, RecruitmentDrive, Result } = require('../models');

/**
 * Validate HTTP/HTTPS URL
 */
const isValidUrl = (urlString) => {
  if (!urlString || typeof urlString !== 'string' || urlString.trim() === '') {
    return true;
  }
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (err) {
    return false;
  }
};

/**
 * Create a new hiring partner company (Admin only)
 */
const createCompany = async (data) => {
  const name = (data.companyName || data.name || '').trim();
  if (!name) {
    const error = new Error('Company name is required');
    error.statusCode = 400;
    throw error;
  }

  // Check for duplicate company name
  const existingCompany = await Company.findOne({ name: new RegExp(`^${name}$`, 'i') });
  if (existingCompany) {
    const error = new Error(`Company with name "${name}" already exists`);
    error.statusCode = 409;
    throw error;
  }

  // Validate website URL if provided
  if (data.website && !isValidUrl(data.website)) {
    const error = new Error('Invalid website URL. Must start with http:// or https://');
    error.statusCode = 400;
    throw error;
  }

  // Validate email if provided
  if (data.contactEmail) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(data.contactEmail.trim())) {
      const error = new Error('Invalid contact email format');
      error.statusCode = 400;
      throw error;
    }
  }

  const company = await Company.create({
    name,
    description: data.description || '',
    website: data.website || '',
    industry: data.industry || 'IT / Software',
    location: data.location || 'India',
    contactEmail: (data.contactEmail || '').toLowerCase().trim(),
    jobRoles: Array.isArray(data.jobRoles) ? data.jobRoles.map((r) => String(r).trim()).filter(Boolean) : [],
    tier: data.tier || 'Normal',
    contactPerson: data.contactPerson || {},
    isActive: data.isActive !== undefined ? data.isActive : true,
  });

  return company;
};

/**
 * List companies with search, filters, and role-based active status restriction
 */
const getAllCompanies = async (queryParams, userRole = 'student') => {
  const {
    page = 1,
    limit = 10,
    search = '',
    industry,
    tier,
    location,
    isActive,
    sort = '-createdAt',
  } = queryParams;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  // Students can ONLY view active companies
  if (userRole.toLowerCase() === 'student') {
    filter.isActive = true;
  } else if (isActive !== undefined && isActive !== '') {
    filter.isActive = isActive === 'true' || isActive === true;
  }

  // Industry filter
  if (industry && industry !== 'ALL') {
    filter.industry = industry;
  }

  // Tier filter
  if (tier && tier !== 'ALL') {
    filter.tier = tier;
  }

  // Location filter
  if (location && location !== 'ALL') {
    filter.location = new RegExp(location.trim(), 'i');
  }

  // Search filter
  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { industry: searchRegex },
      { location: searchRegex },
      { jobRoles: { $in: [searchRegex] } },
    ];
  }

  const [companies, total] = await Promise.all([
    Company.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
    Company.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    companies,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    },
  };
};

/**
 * Fetch company details and recruitment history
 */
const getCompanyById = async (companyId, userRole = 'student') => {
  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    const error = new Error('Invalid company ID format');
    error.statusCode = 400;
    throw error;
  }

  const company = await Company.findById(companyId).lean();
  if (!company) {
    const error = new Error('Company not found');
    error.statusCode = 404;
    throw error;
  }

  // If student and company is deactivated, hide it
  if (userRole.toLowerCase() === 'student' && !company.isActive) {
    const error = new Error('Company not found');
    error.statusCode = 404;
    throw error;
  }

  // Fetch recruitment history (drives conducted & results produced)
  const drives = await RecruitmentDrive.find({ company: companyId })
    .select('jobTitle ctcPackage registrationDeadline driveDate status')
    .sort('-driveDate')
    .lean();

  const totalSelections = await Result.countDocuments({ company: companyId });

  return {
    ...company,
    companyName: company.name,
    recruitmentHistory: {
      totalDrives: drives.length,
      totalSelections,
      drives,
    },
  };
};

/**
 * Update an existing company (Admin only)
 */
const updateCompany = async (companyId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    const error = new Error('Invalid company ID format');
    error.statusCode = 400;
    throw error;
  }

  const company = await Company.findById(companyId);
  if (!company) {
    const error = new Error('Company not found');
    error.statusCode = 404;
    throw error;
  }

  const newName = (updateData.companyName || updateData.name || '').trim();
  if (newName && newName.toLowerCase() !== company.name.toLowerCase()) {
    const existing = await Company.findOne({
      name: new RegExp(`^${newName}$`, 'i'),
      _id: { $ne: companyId },
    });
    if (existing) {
      const error = new Error(`Another company with name "${newName}" already exists`);
      error.statusCode = 409;
      throw error;
    }
    company.name = newName;
  }

  if (updateData.website !== undefined) {
    if (updateData.website && !isValidUrl(updateData.website)) {
      const error = new Error('Invalid website URL. Must start with http:// or https://');
      error.statusCode = 400;
      throw error;
    }
    company.website = updateData.website.trim();
  }

  if (updateData.contactEmail !== undefined) {
    if (updateData.contactEmail) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(updateData.contactEmail.trim())) {
        const error = new Error('Invalid contact email format');
        error.statusCode = 400;
        throw error;
      }
      company.contactEmail = updateData.contactEmail.toLowerCase().trim();
    } else {
      company.contactEmail = '';
    }
  }

  if (updateData.description !== undefined) company.description = updateData.description.trim();
  if (updateData.industry !== undefined) company.industry = updateData.industry.trim();
  if (updateData.location !== undefined) company.location = updateData.location.trim();
  if (updateData.tier !== undefined) company.tier = updateData.tier;
  if (updateData.jobRoles !== undefined) {
    company.jobRoles = Array.isArray(updateData.jobRoles)
      ? updateData.jobRoles.map((r) => String(r).trim()).filter(Boolean)
      : [];
  }
  if (updateData.contactPerson !== undefined) company.contactPerson = updateData.contactPerson;
  if (updateData.isActive !== undefined) company.isActive = Boolean(updateData.isActive);

  await company.save();
  return company;
};

/**
 * Delete or deactivate company
 */
const deleteCompany = async (companyId, hardDelete = false) => {
  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    const error = new Error('Invalid company ID format');
    error.statusCode = 400;
    throw error;
  }

  const company = await Company.findById(companyId);
  if (!company) {
    const error = new Error('Company not found');
    error.statusCode = 404;
    throw error;
  }

  if (hardDelete) {
    // Check if company has recruitment drives
    const hasDrives = await RecruitmentDrive.countDocuments({ company: companyId });
    if (hasDrives > 0) {
      const error = new Error('Cannot permanently delete company with associated recruitment drives. Please deactivate instead.');
      error.statusCode = 400;
      throw error;
    }
    await Company.findByIdAndDelete(companyId);
    return { message: 'Company permanently deleted' };
  } else {
    // Soft delete / deactivation
    company.isActive = false;
    await company.save();
    return { message: 'Company deactivated successfully', company };
  }
};

module.exports = {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
};
