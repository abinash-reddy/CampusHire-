/**
 * CampusHire - Centralized API Client
 * Manages JWT headers, environment URL resolution, centralized error interception, and resource APIs
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'campushire_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

/**
 * Core HTTP Request Dispatcher
 */
export const request = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getToken();

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // If payload is not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body,
    });

    // Handle token expiry or invalid authentication
    if (response.status === 401) {
      removeToken();
      window.dispatchEvent(new CustomEvent('campushire:auth-expired'));
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || 'Request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      const netError = new Error('Cannot connect to backend server. Please verify Express server is running on port 5000.');
      netError.status = 503;
      throw netError;
    }
    throw err;
  }
};

// -------------------------------------------------------------
// 1. Authentication APIs
// -------------------------------------------------------------
export const authApi = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  register: (studentData) => request('/auth/register', { method: 'POST', body: studentData }),
  registerAdmin: (adminData) => request('/auth/register-admin', { method: 'POST', body: adminData }),
  firebaseSync: (data) => request('/auth/firebase-sync', { method: 'POST', body: data }),
  getMe: () => request('/auth/me', { method: 'GET' }),
};

// -------------------------------------------------------------
// 2. Student Profile APIs
// -------------------------------------------------------------
export const studentApi = {
  getProfile: () => request('/students/profile', { method: 'GET' }),
  updateProfile: (profileData) => request('/students/profile', { method: 'PUT', body: profileData }),
};

// -------------------------------------------------------------
// 3. Recruitment Drives APIs
// -------------------------------------------------------------
export const drivesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/drives${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  getById: (id) => request(`/drives/${id}`, { method: 'GET' }),
  create: (driveData) => request('/drives', { method: 'POST', body: driveData }),
  update: (id, driveData) => request(`/drives/${id}`, { method: 'PUT', body: driveData }),
  checkEligibility: (driveId) => request(`/drives/${driveId}/eligibility`, { method: 'GET' }),
};

// -------------------------------------------------------------
// 4. Recruitment Applications APIs
// -------------------------------------------------------------
export const applicationsApi = {
  apply: (driveId, resumeId = null) =>
    request('/applications', { method: 'POST', body: { driveId, resumeId } }),
  getMy: () => request('/applications/my', { method: 'GET' }),
  getById: (id) => request(`/applications/${id}`, { method: 'GET' }),
  getAdminAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/applications${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  updateStatus: (id, statusData) =>
    request(`/admin/applications/${id}/status`, { method: 'PUT', body: statusData }),
};

// -------------------------------------------------------------
// 5. Resume Management & Analysis APIs
// -------------------------------------------------------------
export const resumesApi = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('resume', file);
    return request('/resumes/upload', { method: 'POST', body: formData });
  },
  getMy: () => request('/resumes/my', { method: 'GET' }),
  delete: (id) => request(`/resumes/${id}`, { method: 'DELETE' }),
  test: (file = null) => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('resume', file);
      return request('/resumes/test', { method: 'POST', body: formData });
    }
    return request('/resumes/test', { method: 'POST' });
  },
  getTestResults: () => request('/resumes/test-results', { method: 'GET' }),
  match: (driveId) => request(`/resumes/match/${driveId}`, { method: 'POST' }),
};

// -------------------------------------------------------------
// 6. Interview Management APIs
// -------------------------------------------------------------
export const interviewsApi = {
  getMy: () => request('/interviews/my', { method: 'GET' }),
  getAdminAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/interviews${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  schedule: (interviewData) => request('/interviews', { method: 'POST', body: interviewData }),
  update: (id, data) => request(`/interviews/${id}`, { method: 'PUT', body: data }),
};

// -------------------------------------------------------------
// 7. Placement Bulletin & Updates APIs
// -------------------------------------------------------------
export const updatesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/updates${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  getById: (id) => request(`/updates/${id}`, { method: 'GET' }),
  create: (updateData) => request('/updates', { method: 'POST', body: updateData }),
};

// -------------------------------------------------------------
// 8. Notifications APIs
// -------------------------------------------------------------
export const notificationsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/notifications${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
};

// -------------------------------------------------------------
// 9. Placement Results APIs
// -------------------------------------------------------------
export const resultsApi = {
  getMy: () => request('/results/my', { method: 'GET' }),
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/results${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  publish: (resultData) => request('/results', { method: 'POST', body: resultData }),
};

// -------------------------------------------------------------
// 10. Placement Analytics APIs
// -------------------------------------------------------------
export const analyticsApi = {
  getOverview: () => request('/admin/analytics/overview', { method: 'GET' }),
  getBranches: () => request('/admin/analytics/branches', { method: 'GET' }),
  getCompanies: () => request('/admin/analytics/companies', { method: 'GET' }),
  getDrives: () => request('/admin/analytics/drives', { method: 'GET' }),
};

// -------------------------------------------------------------
// 11. Company & Admin Student APIs
// -------------------------------------------------------------
export const companiesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/companies${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  create: (companyData) => request('/companies', { method: 'POST', body: companyData }),
};

export const adminStudentsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/students${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  getById: (id) => request(`/admin/students/${id}`, { method: 'GET' }),
};
