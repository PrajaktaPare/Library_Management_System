/**
 * API Service Layer
 * Handles all communication with the backend API
 * Includes token management, error handling, and request/response interceptors
 */

const API_CONFIG = {
  baseURL: localStorage.getItem('apiUrl') || 'http://localhost:5000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

class APIService {
  constructor(config = API_CONFIG) {
    this.config = config;
    this.accessToken = this.getAccessToken();
  }

  /**
   * Get stored access token from localStorage
   */
  getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  /**
   * Set authorization header with token
   */
  getHeaders() {
    const headers = { ...this.config.headers };
    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  /**
   * Generic request method with error handling
   */
  async request(method, endpoint, data = null, options = {}) {
    try {
      const url = `${this.config.baseURL}${endpoint}`;
      const fetchOptions = {
        method,
        headers: this.getHeaders(),
        ...options
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        fetchOptions.body = JSON.stringify(data);
      }

      console.log(`[API] ${method} ${endpoint}`);

      const response = await fetch(url, fetchOptions);
      const responseData = await response.json();

      if (!response.ok) {
        // Handle specific error responses
        if (response.status === 401) {
          // Unauthorized - token expired or invalid
          localStorage.removeItem('accessToken');
          localStorage.removeItem('currentUser');
          window.location.href = 'index.html';
          throw new Error('Session expired. Please login again.');
        }

        if (response.status === 403) {
          throw new Error('You do not have permission to perform this action.');
        }

        if (response.status === 404) {
          throw new Error('Resource not found.');
        }

        if (response.status === 422) {
          // Validation errors
          const errors = responseData.errors || [];
          throw {
            isValidationError: true,
            errors,
            message: responseData.message || 'Validation failed'
          };
        }

        throw new Error(responseData.message || `API Error: ${response.status}`);
      }

      return responseData.data || responseData;
    } catch (error) {
      console.error(`[API Error] ${method} ${endpoint}:`, error.message);
      throw error;
    }
  }

  /**
   * GET request
   */
  get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }

  /**
   * POST request
   */
  post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  /**
   * PUT request
   */
  put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }

  /**
   * PATCH request
   */
  patch(endpoint, data, options = {}) {
    return this.request('PATCH', endpoint, data, options);
  }

  /**
   * DELETE request
   */
  delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }

  // ============= AUTH ENDPOINTS =============

  /**
   * Login user
   */
  login(username, password, role) {
    return this.post('/auth/login', { username, password, role });
  }

  /**
   * Register new user
   */
  register(userData) {
    return this.post('/auth/register', userData);
  }

  /**
   * Refresh access token
   */
  refreshToken() {
    return this.post('/auth/refresh', {});
  }

  /**
   * Logout user
   */
  logout() {
    return this.post('/auth/logout', {});
  }

  // ============= BOOK ENDPOINTS =============

  /**
   * Get all books with filtering and pagination
   */
  getBooks(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.get(`/books?${params.toString()}`);
  }

  /**
   * Get single book by ID
   */
  getBook(bookId) {
    return this.get(`/books/${bookId}`);
  }

  /**
   * Create new book (admin only)
   */
  createBook(bookData) {
    return this.post('/books', bookData);
  }

  /**
   * Update book (admin only)
   */
  updateBook(bookId, bookData) {
    return this.put(`/books/${bookId}`, bookData);
  }

  /**
   * Delete book (admin only)
   */
  deleteBook(bookId) {
    return this.delete(`/books/${bookId}`);
  }

  // ============= REQUEST ENDPOINTS =============

  /**
   * Get book requests (student: own, admin: all)
   */
  getRequests(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.get(`/requests?${params.toString()}`);
  }

  /**
   * Get single request
   */
  getRequest(requestId) {
    return this.get(`/requests/${requestId}`);
  }

  /**
   * Create book request (student)
   */
  createRequest(bookId, requestData = {}) {
    return this.post('/requests', { bookId, ...requestData });
  }

  /**
   * Approve request (admin)
   */
  approveRequest(requestId, approvalData = {}) {
    return this.put(`/requests/${requestId}/approve`, approvalData);
  }

  /**
   * Issue book (admin)
   */
  issueBook(requestId, issueData = {}) {
    return this.put(`/requests/${requestId}/issue`, issueData);
  }

  /**
   * Return book (admin)
   */
  returnBook(requestId, returnData = {}) {
    return this.put(`/requests/${requestId}/return`, returnData);
  }

  /**
   * Reject request (admin)
   */
  rejectRequest(requestId, reason = '') {
    return this.put(`/requests/${requestId}/reject`, { reason });
  }

  // ============= ISSUE ENDPOINTS =============

  /**
   * Get issues (student: own, admin: all)
   */
  getIssues(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.get(`/issues?${params.toString()}`);
  }

  /**
   * Create book issue
   */
  createIssue(issueData) {
    return this.post('/issues', issueData);
  }

  /**
   * Resolve issue (admin)
   */
  resolveIssue(issueId, resolutionData) {
    return this.put(`/issues/${issueId}/resolve`, resolutionData);
  }

  // ============= NOTIFICATION ENDPOINTS =============

  /**
   * Get notifications
   */
  getNotifications(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.get(`/notifications?${params.toString()}`);
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(notificationId) {
    return this.put(`/notifications/${notificationId}/read`, {});
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId) {
    return this.delete(`/notifications/${notificationId}`);
  }

  /**
   * Mark all notifications as read
   */
  markAllNotificationsRead() {
    return this.put('/notifications/read-all', {});
  }

  // ============= USER ENDPOINTS =============

  /**
   * Get current user profile
   */
  getProfile() {
    return this.get('/users/profile');
  }

  /**
   * Update user profile
   */
  updateProfile(profileData) {
    return this.put('/users/profile', profileData);
  }

  /**
   * Change password
   */
  changePassword(oldPassword, newPassword) {
    return this.put('/users/password', { oldPassword, newPassword });
  }

  /**
   * Get all users (admin)
   */
  getUsers(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.get(`/users?${params.toString()}`);
  }

  /**
   * Get single user (admin)
   */
  getUser(userId) {
    return this.get(`/users/${userId}`);
  }

  /**
   * Deactivate user (admin)
   */
  deactivateUser(userId, reason = '') {
    return this.put(`/users/${userId}/deactivate`, { reason });
  }

  /**
   * Activate user (admin)
   */
  activateUser(userId) {
    return this.put(`/users/${userId}/activate`, {});
  }

  // ============= UTILITY METHODS =============

  /**
   * Set API URL dynamically
   */
  setBaseURL(url) {
    this.config.baseURL = url;
    localStorage.setItem('apiUrl', url);
  }

  /**
   * Get current API URL
   */
  getBaseURL() {
    return this.config.baseURL;
  }
}

// Create and export singleton instance
const apiService = new APIService();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = apiService;
}
