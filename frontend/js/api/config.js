/* ============================================================
   api/config.js — centralized API client for backend communication
   all frontend pages use this single client for HTTP requests
   ============================================================ */

// read API base URL from localStorage or default to localhost:5000
const API_URL = localStorage.getItem("apiUrl") || "http://localhost:5000/api/v1";

// ApiClient class wraps all fetch calls with auth headers and error handling
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  // generic request method used by all endpoint methods
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem("accessToken");

    const headers = {
      "Content-Type": "application/json",
      ...options.headers
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.handleTokenExpired();
        }
        throw new Error(data.message || "API request failed");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  handleTokenExpired() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentUser");
    if (window.location.pathname.includes("/pages/")) {
      window.location.replace("../index.html");
    } else {
      window.location.replace("index.html");
    }
  }

  // --- AUTH ENDPOINTS ---
  async login(username, password, role) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password, role })
    });
  }

  async register(userData) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData)
    });
  }

  async logout() {
    return this.request("/auth/logout", { method: "POST" });
  }

  async resetPassword(email, newPassword) {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, newPassword })
    });
  }

  // --- BOOK ENDPOINTS ---
  async getBooks(page = 1, limit = 10, filters = {}) {
    const query = new URLSearchParams({ page, limit, ...filters }).toString();
    return this.request(`/books?${query}`, { method: "GET" });
  }

  async getBookById(id) {
    return this.request(`/books/${id}`, { method: "GET" });
  }

  async searchBooks(search, page = 1) {
    return this.request(`/books/search?search=${encodeURIComponent(search)}&page=${page}`, { method: "GET" });
  }

  async getBookCategories() {
    return this.request("/books/categories", { method: "GET" });
  }

  async createBook(bookData) {
    return this.request("/books", {
      method: "POST",
      body: JSON.stringify(bookData)
    });
  }

  async updateBook(id, bookData) {
    return this.request(`/books/${id}`, {
      method: "PUT",
      body: JSON.stringify(bookData)
    });
  }

  async deleteBook(id) {
    return this.request(`/books/${id}`, { method: "DELETE" });
  }

  // --- REQUEST ENDPOINTS ---
  async requestBook(bookId) {
    return this.request("/requests", {
      method: "POST",
      body: JSON.stringify({ book_id: bookId })
    });
  }

  async getMyRequests(page = 1, limit = 100) {
    return this.request(`/requests/my-requests?page=${page}&limit=${limit}`, { method: "GET" });
  }

  async getAllRequests(page = 1, filters = {}) {
    const query = new URLSearchParams({ page, ...filters }).toString();
    return this.request(`/requests?${query}`, { method: "GET" });
  }

  async getRequestById(id) {
    return this.request(`/requests/${id}`, { method: "GET" });
  }

  async approveRequest(id, dueDate) {
    return this.request(`/requests/${id}/approve`, {
      method: "PUT",
      body: JSON.stringify({ due_date: dueDate })
    });
  }

  async rejectRequest(id) {
    return this.request(`/requests/${id}/reject`, { method: "PUT" });
  }

  async issueBook(id) {
    return this.request(`/requests/${id}/issue`, { method: "PUT" });
  }

  async returnBook(id) {
    return this.request(`/requests/${id}/return`, { method: "PUT" });
  }

  async getOverdueBooks() {
    return this.request("/requests/admin/overdue", { method: "GET" });
  }

  // --- NOTIFICATION ENDPOINTS ---
  async getNotifications(page = 1) {
    return this.request(`/notifications?page=${page}`, { method: "GET" });
  }

  async getUnreadCount() {
    return this.request("/notifications/unread-count", { method: "GET" });
  }

  async markNotificationAsRead(id) {
    return this.request(`/notifications/${id}/read`, { method: "PUT" });
  }

  async markAllNotificationsAsRead() {
    return this.request("/notifications/mark-all-read", { method: "PUT" });
  }

  // --- USER ENDPOINTS ---
  async getProfile() {
    return this.request("/users/profile", { method: "GET" });
  }

  async updateProfile(userData) {
    return this.request("/users/profile", {
      method: "PUT",
      body: JSON.stringify(userData)
    });
  }

  async changePassword(currentPassword, newPassword, confirmPassword) {
    return this.request("/users/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    });
  }

  async getAllUsers(page = 1, filters = {}) {
    const query = new URLSearchParams({ page, ...filters }).toString();
    return this.request(`/users?${query}`, { method: "GET" });
  }

  async createUser(userData) {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(userData)
    });
  }

  async toggleUserStatus(id, isActive) {
    return this.request(`/users/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ isActive })
    });
  }
}

// create a singleton API client instance used by all pages
const apiClient = new ApiClient(API_URL);
