// src/services/authProvider.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import apiService from './api.js'; // Make sure this path and extension are correct
import authManager from './session.js'; // Using the renamed file from our debugging

// Create context
const AuthContext = createContext(null);

// Create AuthProvider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Set initial loading to true
  const [authenticated, setAuthenticated] = useState(false);

  // This useEffect hook now handles the silent refresh
  useEffect(() => {
    const silentRefresh = async () => {
      try {
        // Attempt to get a new access token using the HttpOnly refresh cookie
        const response = await apiService.post('/auth/refresh');
        const { accessToken, user } = response.data;

        // If successful, save the session in memory and update the state
        authManager.saveUserSession(accessToken, user);
        setCurrentUser(user);
        setAuthenticated(true);
      } catch (error) {
        // This error is expected if the user is not logged in.
        // The refresh token is either missing or invalid.
        console.log('Silent refresh failed: User is not authenticated.');
      } finally {
        // Set loading to false after the auth check is complete
        setLoading(false);
      }
    };

    silentRefresh();
  }, []); // The empty array ensures this runs only once on component mount

  // Login function remains mostly the same, but relies on apiService
  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await apiService.login(email, password);
      // apiService.login now handles saving the token to authManager
      setCurrentUser(result.user);
      setAuthenticated(true);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function remains the same
  const logout = async () => {
    setLoading(true);
    try {
      await apiService.logout(); // This will clear the server cookie and in-memory token
      setCurrentUser(null);
      setAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    currentUser,
    isAuthenticated: authenticated,
    isLoading: loading, // Provide loading state to the rest of the app
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* We can optionally show a loading spinner while the silent refresh is in progress */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
