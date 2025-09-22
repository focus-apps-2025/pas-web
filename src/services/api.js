// src/services/api.js
import axios from 'axios';
// Make sure this path is correct for your project structure
import authManager from './authsession'; 

// --- Axios Instance Setup ---
// We create a single, configured instance of Axios
const apiService = axios.create({
  baseURL: 'https://pas-av9v.onrender.com/api', // Replace with your API base URL
  withCredentials: true, // This is CRUCIAL for sending cookies across domains
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to attach JWT access token
apiService.interceptors.request.use(
  async (config) => {
    try {
      // *** MODIFIED LOGIC HERE ***
      // Only attach the Authorization header if the request is NOT for the refresh endpoint
      if (config.url && !config.url.includes('/auth/refresh')) {
        const token = await authManager.getAccessToken(); // This gets the access token
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        } else {
          delete config.headers['Authorization'];
        }
      } else {
        // If it's the refresh endpoint, ensure no Authorization header is sent
        // This is important to prevent the backend from trying to validate an expired access token
        delete config.headers['Authorization']; 
      }
    } catch (e) {
      console.error('Request interceptor error:', e);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// --- Rest of your api.js remains the same ---
// Response interceptor (no changes needed here for this specific issue)
apiService.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is from the refresh token endpoint itself, to prevent loops
    if (originalRequest.url === '/auth/refresh' && error.response?.status === 401) {
      console.warn("Refresh token endpoint failed. Logging out user.");
      authManager.logout();
      window.location.href = '/login?reason=expired';
      return Promise.reject(error);
    }

    // Check for 401 Unauthorized from other requests and if not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        console.log("Access token expired. Attempting to refresh token...");
        // This call will now go through the request interceptor *without* the Authorization header
        const response = await apiService.post('/auth/refresh'); 
        const { accessToken } = response.data;

        if (!accessToken) {
          throw new Error("Refresh endpoint did not return an access token.");
        }

        authManager.setAccessToken(accessToken); // Update stored access token
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`; // Update original request with new token

        console.log("Token refreshed, retrying original request.");
        return apiService(originalRequest); // Retry the original request with the new token
      } catch (refreshError) {
        console.error("Token refresh failed. Logging out user.", refreshError);
        authManager.logout();
        window.location.href = '/login?reason=expired';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

// API methods with exception handling
const api = {
  login: async (email, password) => {
    try {
      const response = await apiService.post('/auth/login', { email, password });
      if (response.data.accessToken) {
        await authManager.saveUserSession(response.data.accessToken, response.data.user);
        return { success: true, user: response.data.user };
      }
      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error) {
      console.error('Login Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || `Error during login: ${error.message}`,
      };
    }
  },

  logout: async () => {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Logout Error:', error);
    } finally {
      authManager.logout();
    }
  },

  // User endpoints
  getAllUsers: () => apiService.get('/auth/users').then(response => {
    const responseBody = response.data;
    if (response.status === 200 && responseBody.success) {
      return responseBody.users;
    } else {
      throw new Error(responseBody.message || 'Failed to load users');
    }
  }),
  
  getUsersByRole: (role) => apiService.get(`/auth/users/role/${role}`).then(response => {
    const responseBody = response.data;
    if (response.status === 200 && responseBody.success) {
      return responseBody.users;
    } else {
      throw new Error(responseBody.message || 'Failed to load users by role');
    }
  }),
  
  createUser: (userData) => apiService.post('/auth/register', userData).then(response => {
    const responseBody = response.data;
    if (response.status === 201 && responseBody.success) {
      return {
        success: true,
        message: responseBody.message || 'User created successfully',
        user: responseBody.user,
      };
    } else {
      return {
        success: false,
        message: responseBody.message || 'Failed to create user',
      };
    }
  }).catch(error => {
    console.error('Create User Error:', error);
    if (error.response) {
      return {
        success: false,
        message: error.response.data.message || 'Server error creating user',
      };
    } else {
      return {
        success: false,
        message: `Network error creating user: ${error.message}`,
      };
    }
  }),
  
  updateUser: (userId, userData) => apiService.put(`/auth/users/${userId}`, userData).then(response => {
    const responseBody = response.data;
    if (response.status === 200 && responseBody.success) {
      return {
        success: true,
        message: responseBody.message,
        user: responseBody.user,
      };
    } else {
      return {
        success: false,
        message: responseBody.message || 'Failed to update user',
      };
    }
  }).catch(error => {
    console.error('Update User Error:', error);
    if (error.response) {
      return {
        success: false,
        message: error.response.data.message || 'Server error during user update',
      };
    } else {
      return {
        success: false,
        message: `Network error during user update: ${error.message}`,
      };
    }
  }),
  
deleteUser: (userId) => apiService.delete(`/auth/users/${userId}`).then(response => {
  const responseBody = response.data;
  if (response.status === 200 && responseBody.success) {
    return { success: true, message: responseBody.message };
  } else {
    return {
      success: false,
      message: responseBody.message || 'Failed to delete user',
    };
  }
}).catch(error => {
  console.error('Delete User Error:', error);
  if (error.response) {
    return {
      success: false,
      message: error.response.data.message || 'Server error during user deletion',
    };
  } else {
    return {
      success: false,
      message: `Network error during user deletion: ${error.message}`,
    };
  }
}),
  
  // Team endpoints
  getTeams: () => apiService.get('/teams').then(response => {
    const responseBody = response.data;
    if (response.status === 200 && responseBody.success) {
      return responseBody.teams;
    } else {
      throw new Error(responseBody.message || 'Failed to load teams');
    }
  }),
  
  getTeamById: (teamId) => apiService.get(`/teams/${teamId}`).then(response => {
    const responseBody = response.data;
    if (response.status === 200 && responseBody.success) {
      return responseBody.team;
    } else {
      throw new Error(responseBody.message || 'Failed to load team');
    }
  }),
  
  createTeam: (teamData) => apiService.post('/teams', teamData).then(response => {
    const responseBody = response.data;
    if (response.status === 201 && responseBody.success) {
      return {
        success: true,
        message: responseBody.message,
        team: responseBody.team,
      };
    } else {
      return {
        success: false,
        message: responseBody.message || 'Team creation failed',
      };
    }
  }).catch(error => {
    console.error('Create Team Error:', error);
    if (error.response) {
      return {
        success: false,
        message: error.response.data.message || 'Server error during team creation',
      };
    } else {
      return {
        success: false,
        message: `Network error during team creation: ${error.message}`,
      };
    }
  }),
  
  updateTeam: (teamId, teamData) => apiService.put(`/teams/${teamId}`, teamData).then(response => {
    const responseBody = response.data;
    if (response.status === 200 && responseBody.success) {
      return {
        success: true,
        message: responseBody.message,
        team: responseBody.team,
      };
    } else {
      return {
        success: false,
        message: responseBody.message || 'Failed to update team',
      };
    }
  }).catch(error => {
    console.error('Update Team Error:', error);
    if (error.response) {
      return {
        success: false,
        message: error.response.data.message || 'Server error during team update',
      };
    } else {
      return {
        success: false,
        message: `Network error during team update: ${error.message}`,
      };
    }
  }),
  
  deleteTeam: (teamId) => apiService.delete(`/teams/${teamId}`).then(response => {
    const responseBody = response.data;
    if (response.status === 200 && responseBody.success) {
      return { success: true, message: responseBody.message };
    } else {
      return {
        success: false,
        message: responseBody.message || 'Failed to delete team',
      };
    }
  }).catch(error => {
    console.error('Delete Team Error:', error);
    if (error.response) {
      return {
        success: false,
        message: error.response.data.message || 'Server error during team deletion',
      };
    } else {
      return {
        success: false,
        message: `Network error during team deletion: ${error.message}`,
      };
    }
  }),
  
  getTeamsForLeader: (leaderId) => apiService.get(`/teams/leader/${leaderId}`).then(response => {
    const responseBody = response.data;
    if (response.status === 200 && responseBody.success) {
      return responseBody.teams;
    } else {
      throw new Error(responseBody.message || 'Failed to load teams for leader');
    }
  }),
  getTeamsForMember: (memberId) => apiService.get(`/teams/member/${memberId}`).then(response => {
    const responseBody = response.data;
    if (response.status === 200 && responseBody.success) {
      return responseBody.teams;
    } else {
      throw new Error(responseBody.message || 'Failed to load teams for member');
    }
  }),
  
  // Master description endpoints
  uploadMasterDescriptions: (entries, filename) => apiService.post('/masterdesc/upload', {
    entries,
    filename
  }).then(response => response.data),
  
  getUploadedFilesMetadata: () => apiService.get('/masterdesc/files').then(response => response.data),
  
  deleteUploadedFile: (fileId) => apiService.delete(`/masterdesc/files/${fileId}`).then(response => response.data),
  

  // Rack endpoints - Add these to your existing api object
  getRacks: (params = {}) => apiService.get('/racks', { params }).then(response => {
    const responseData = response.data;
    if (response.status === 200 && responseData.success) {
      // Handle different data formats as in Flutter
      let rackJsonList = [];
      const data = responseData.data;
      
      if (Array.isArray(data)) {
        rackJsonList = data;
      } else if (typeof data === 'object' && data !== null) {
        rackJsonList = Object.values(data);
      }
      
      return {
        racks: rackJsonList,
        totalCount: parseInt(responseData.count) || 0
      };
    } else {
      throw new Error(responseData.message || 'Failed to load racks');
    }
  }),
  
  exportAllRacks: (params = {}) => apiService.get('/racks/export', { params }).then(response => {
    const responseData = response.data;
    if (response.status === 200 && responseData.success) {
      return responseData.data || [];
    } else {
      throw new Error(responseData.message || 'Failed to export racks');
    }
  }),
  
  getRackById: (rackId) => apiService.get(`/racks/${rackId}`).then(response => {
    const responseData = response.data;
    if (response.status === 200 && responseData.success) {
      return responseData.data;
    } else {
      throw new Error(responseData.message || 'Failed to load rack');
    }
  }).catch(error => {
    if (error.response) {
      throw new Error(error.response.data.message || 'Server error fetching rack by ID');
    } else {
      throw new Error(`Network error fetching rack by ID: ${error.message}`);
    }
  }),  

  updateRack: (rackId, rackData) => apiService.put(`/racks/${rackId}`, rackData).then(response => {
    const responseData = response.data;
    if (response.status === 200 && responseData.success) {
      return responseData;
    } else {
      throw new Error(responseData.message || 'Failed to update rack');
    }
  }).catch(error => {
    if (error.response) {
      throw new Error(error.response.data.message || 'Server error updating rack');
    } else {
      throw new Error(`Network error updating rack: ${error.message}`);
    }
  }),
  
  deleteRack: (rackId) => apiService.delete(`/racks/${rackId}`).then(response => {
    const responseData = response.data;
    if (response.status === 200 && responseData.success) {
      return responseData;
    } else {
      throw new Error(responseData.message || 'Failed to delete rack');
    }
  }).catch(error => {
    if (error.response) {
      throw new Error(error.response.data.message || 'Server error deleting rack');
    } else {
      throw new Error(`Network error deleting rack: ${error.message}`);
    }
  }),
  
  getTotalScanCounts: (teamId) => apiService.get('/racks/scancounts', { 
    params: { teamId } 
  }).then(response => {
    if (response.data.success === true) {
      const countsData = response.data.data || [];
      return countsData.reduce((acc, item) => {
        acc[item.userName || 'Unknown'] = item.count || 0;
        return acc;
      }, {});
    } else {
      throw new Error('Failed to load scan counts');
    }
  }).catch(error => {
    console.error('Error fetching scan counts:', error);
    return {}; // Return empty object on failure
  }),
  
  getFirstScanByUser: (teamId, date) => {
    // Format date as YYYY-MM-DD
    const formattedDate = new Date(date).toISOString().split('T')[0];
    
    return apiService.get('/racks/first-scan-by-user', {
      params: { teamId, date: formattedDate }
    }).then(response => {
      if (response.status !== 200) {
        throw new Error(response.data.error || 'API Error');
      }
      
      // Handle different response formats
      let data = response.data;
      if (response.data.success && response.data.data) {
        data = response.data.data;
      }
      
      return Object.keys(data).reduce((acc, user) => {
        const value = data[user];
        let firstScanTime = null;
        
        if (value && typeof value === 'object') {
          // Handle object format
          if (value.firstScan) {
            try {
              let dateTimeString = value.firstScan;
              if (!dateTimeString.includes('Z') && !dateTimeString.includes('+')) {
                dateTimeString += 'Z'; // Assume UTC if no timezone specified
              }
              firstScanTime = new Date(dateTimeString);
            } catch (e) {
              console.error('Error parsing datetime:', value.firstScan, e);
            }
          }
          
          acc[user] = {
            count: value.count || 0,
            firstScan: firstScanTime
          };
        } else {
          // Handle simple value format
          acc[user] = {
            count: typeof value === 'number' ? value : 0,
            firstScan: null
          };
        }
        
        return acc;
      }, {});
    }).catch(error => {
      console.error('Error in getFirstScanByUser:', error);
      return {}; // Return empty object on error
    });
  },
  
  saveExportedRacks: (rows) => apiService.post('/exported-rack-views/rack-view', { rows })
    .then(response => response.data),
  
  completeTeamWork: (teamId) => apiService.put(`/teams/${teamId}/complete`)
  .then(response => response.data)
  .catch(error => {
    if (error.response?.data) {
      return error.response.data;
    }
    return {
      success: false,
      message: error.message || 'Unknown error occurred',
    };
  }),

getTeamWorkStatus: (teamId) => apiService.get(`/teams/${teamId}/status`)
  .then(response => {
    if (response.data.success === true) {
      return response.data.isSubmitted || false;
    }
    return false;
  })
  .catch(error => {
    console.error('Error checking team status:', error);
    return false;
  }),

saveExportedRacksSnapshot: (snapshotsData, teamId, siteName) => 
  apiService.post('/exported-racks-snapshot', {
    snapshots: snapshotsData,
    teamId,
    siteName
  }).then(response => response.data)
  .catch(error => {
    return {
      success: false,
      message: error.response?.data?.message || 'Server error saving snapshot',
    };
  })
  };


export default api;