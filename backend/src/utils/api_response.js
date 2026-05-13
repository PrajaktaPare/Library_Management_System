class ApiResponse {
  constructor(statusCode, message, data = null, meta = null) {
    this.statusCode = statusCode;
    this.message = message;
    this.success = statusCode < 400;
    this.data = data;
    this.meta = meta;
    this.timestamp = new Date().toISOString();
  }

  static success(statusCode, message, data = null, meta = null) {
    return new ApiResponse(statusCode, message, data, meta);
  }

  static created(message, data = null) {
    return new ApiResponse(201, message, data);
  }

  static ok(message, data = null, meta = null) {
    return new ApiResponse(200, message, data, meta);
  }

  static noContent() {
    return new ApiResponse(204, 'No content');
  }

  static paginated(message, data, total, page, limit) {
    return new ApiResponse(200, message, data, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    });
  }
}

module.exports = ApiResponse;
