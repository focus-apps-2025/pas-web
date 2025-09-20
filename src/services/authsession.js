// src/services/authManager.js
class AuthManager {
  constructor() {
    // These are now in-memory variables, not keys for localStorage.
    // They will be reset every time the user refreshes the page.
    this._accessToken = null;
    this._currentUser = null;
  }

  // --- Access Token Methods ---
  // These methods now interact with the in-memory _accessToken variable.
  // The 'async' keyword is kept to maintain a consistent API signature
  // with your old code, making integration easier.

  async setAccessToken(token) {
    this._accessToken = token || null;
  }

  async getAccessToken() {
    return this._accessToken;
  }

  async clearAccessToken() {
    this._accessToken = null;
  }


  // --- Current User Methods ---
  // These methods now interact with the in-memory _currentUser variable.

  async setCurrentUser(user) {
    this._currentUser = user || null;
  }

  async getCurrentUser() {
    return this._currentUser;
  }

  async clearCurrentUser() {
    this._currentUser = null;
  }


  // --- Session Helper Methods ---
  // These helpers now operate on the in-memory data.

  async saveUserSession(token, user) {
    await this.setAccessToken(token);
    await this.setCurrentUser(user);
  }

  async logout() {
    await this.clearAccessToken();
    await this.clearCurrentUser();
  }

  async isLoggedIn() {
    // This now checks the in-memory variables directly.
    return !!(this._accessToken && this._currentUser);
  }
}

// Create and export a single instance to be used throughout your app
const authManager = new AuthManager();
export default authManager;
