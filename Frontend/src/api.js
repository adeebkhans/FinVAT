import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// =============================================================================
// AUTH APIs
// =============================================================================

export const authAPI = {
  // Register user
  register: (userData) => {
    return api.post('/auth/register', userData);
  },

  // Register admin
  registerAdmin: (userData) => {
    return api.post('/auth/register', {
      ...userData,
      role: 'admin'
    });
  },

  // Login
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },

  // Get user profile
  getProfile: () => {
    return api.get('/auth/profile');
  },

  // Generate user profile
  generateProfile: () => {
    return api.post('/auth/generate-profile');
  },

  // Get all users (admin only)
  getAllUsers: () => {
    return api.get('/auth/users');
  }
};

// =============================================================================
// STEGANOGRAPHY APIs
// =============================================================================

export const steganographyAPI = {
  // Create fingerprint (watermark data)
  createFingerprint: (userData, companyId) => {
    return api.post(`/steganography/watermark/${companyId}`, userData);
  },

  // Detect fingerprint in data
  detectFingerprint: (suspectData) => {
    return api.post('/steganography/detect', suspectData);
  }
};

// =============================================================================
// CIBIL SCORE APIs
// =============================================================================

export const cibilAPI = {
  // Simulate CIBIL score request
  simulateScore: () => {
    return api.post('/user/simulate-score');
  }
};

// =============================================================================
// ADMIN DASHBOARD APIs
// =============================================================================

export const adminAPI = {
  // Get dashboard statistics
  getDashboardStats: () => {
    return api.get('/admin/dashboard-stats');
  },

  // Leak data for a specific company (returns downloadable JSON)
  leakData: (company) => {
    return api.get(`/admin/leak/${company}`, {
      responseType: 'blob', // For file download
    });
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Set auth token
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

// Get auth token
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Clear auth token
export const clearAuthToken = () => {
  localStorage.removeItem('token');
};

// Download file utility
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default {
  authAPI,
  steganographyAPI,
  cibilAPI,
  adminAPI,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
  downloadFile
};