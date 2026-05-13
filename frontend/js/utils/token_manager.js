/**
 * Token Manager
 * Handles JWT token storage, validation, and refresh
 */

class TokenManager {
  constructor() {
    this.accessTokenKey = 'accessToken';
    this.refreshTokenKey = 'refreshToken';
    this.userKey = 'currentUser';
    this.refreshThreshold = 60 * 1000; // Refresh 1 minute before expiry
  }

  /**
   * Parse JWT token
   */
  parseToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('[TokenManager] Error parsing token:', error);
      return null;
    }
  }

  /**
   * Get access token
   */
  getAccessToken() {
    return localStorage.getItem(this.accessTokenKey);
  }

  /**
   * Get refresh token
   */
  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }

  /**
   * Get current user
   */
  getUser() {
    const userStr = localStorage.getItem(this.userKey);
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('[TokenManager] Error parsing user:', error);
      return null;
    }
  }

  /**
   * Set tokens and user
   */
  setTokens(accessToken, refreshToken = null, user = null) {
    localStorage.setItem(this.accessTokenKey, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.refreshTokenKey, refreshToken);
    }
    if (user) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
  }

  /**
   * Check if token is valid
   */
  isTokenValid(token = null) {
    const tokenToCheck = token || this.getAccessToken();
    if (!tokenToCheck) {
      return false;
    }

    const decoded = this.parseToken(tokenToCheck);
    if (!decoded || !decoded.exp) {
      return false;
    }

    // Token is valid if expiry time is in the future
    const expiryTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = new Date().getTime();

    return expiryTime > currentTime;
  }

  /**
   * Check if token needs refresh
   */
  shouldRefreshToken(token = null) {
    const tokenToCheck = token || this.getAccessToken();
    if (!tokenToCheck) {
      return false;
    }

    const decoded = this.parseToken(tokenToCheck);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const expiryTime = decoded.exp * 1000;
    const currentTime = new Date().getTime();
    const timeUntilExpiry = expiryTime - currentTime;

    return timeUntilExpiry < this.refreshThreshold;
  }

  /**
   * Get time until token expires (in seconds)
   */
  getTimeUntilExpiry(token = null) {
    const tokenToCheck = token || this.getAccessToken();
    if (!tokenToCheck) {
      return 0;
    }

    const decoded = this.parseToken(tokenToCheck);
    if (!decoded || !decoded.exp) {
      return 0;
    }

    const expiryTime = decoded.exp * 1000;
    const currentTime = new Date().getTime();
    const timeUntilExpiry = expiryTime - currentTime;

    return Math.max(0, Math.floor(timeUntilExpiry / 1000));
  }

  /**
   * Get token payload
   */
  getTokenPayload(token = null) {
    const tokenToCheck = token || this.getAccessToken();
    if (!tokenToCheck) {
      return null;
    }
    return this.parseToken(tokenToCheck);
  }

  /**
   * Get user ID from token
   */
  getUserId() {
    const payload = this.getTokenPayload();
    return payload ? payload.userId : null;
  }

  /**
   * Get user role from token
   */
  getUserRole() {
    const payload = this.getTokenPayload();
    return payload ? payload.role : null;
  }

  /**
   * Clear all tokens and user data
   */
  clearTokens() {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = this.getAccessToken();
    return this.isTokenValid(token);
  }

  /**
   * Check if user has specific role
   */
  hasRole(role) {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  /**
   * Check if user is admin
   */
  isAdmin() {
    return this.hasRole('admin');
  }

  /**
   * Check if user is student
   */
  isStudent() {
    return this.hasRole('student');
  }

  /**
   * Get user info
   */
  getUserInfo() {
    return {
      id: this.getUserId(),
      role: this.getUserRole(),
      user: this.getUser(),
      token: this.getAccessToken(),
      isAuthenticated: this.isAuthenticated()
    };
  }

  /**
   * Set refresh threshold (in milliseconds)
   */
  setRefreshThreshold(ms) {
    this.refreshThreshold = ms;
  }

  /**
   * Log token info (for debugging)
   */
  logTokenInfo() {
    const token = this.getAccessToken();
    if (!token) {
      console.log('[TokenManager] No token found');
      return;
    }

    const payload = this.getTokenPayload(token);
    const timeUntilExpiry = this.getTimeUntilExpiry(token);

    console.log('[TokenManager] Token Info:', {
      isValid: this.isTokenValid(token),
      shouldRefresh: this.shouldRefreshToken(token),
      expiresIn: `${timeUntilExpiry}s`,
      payload
    });
  }
}

// Create and export singleton instance
const tokenManager = new TokenManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = tokenManager;
}
