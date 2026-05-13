# Smart Library Management System - Backend

Production-grade Express.js backend with JWT authentication, MySQL database, role-based access control, and comprehensive business logic.

## Architecture

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── services/        # Business logic
├── repositories/    # Data access layer
├── routes/          # API routes
├── middleware/      # Express middleware
├── validators/      # Input validation schemas
├── database/        # Database connection & schemas
├── utils/          # Helper utilities
├── constants/       # Constants and enums
├── uploads/        # File uploads
├── logs/           # Application logs
└── app.js & server.js  # Application entry points
```

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your database and JWT credentials.

3. **Initialize Database**
   ```bash
   mysql -u root -p < src/database/schema.sql
   mysql -u root -p < src/database/triggers.sql
   mysql -u root -p < src/database/functions.sql
   ```

4. **Start Server**
   ```bash
   npm run dev    # Development with hot reload
   npm start      # Production
   ```

## API Documentation

### Authentication
- `POST /api/v1/auth/login` - Login with username/password/role
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - Logout current session
- `POST /api/v1/auth/logout-all` - Logout all sessions

### Books
- `GET /api/v1/books` - List books with pagination
- `GET /api/v1/books/:id` - Get book details
- `GET /api/v1/books/categories` - Get all book categories
- `GET /api/v1/books/search?search=query` - Search books
- `POST /api/v1/books` - Create book (Admin only)
- `PUT /api/v1/books/:id` - Update book (Admin only)
- `DELETE /api/v1/books/:id` - Delete book (Admin only)

### Requests
- `POST /api/v1/requests` - Request a book (Student)
- `GET /api/v1/requests/my-requests` - Get my requests (Student)
- `GET /api/v1/requests` - Get all requests (Admin)
- `GET /api/v1/requests/:id` - Get request details
- `PUT /api/v1/requests/:id/approve` - Approve request (Admin)
- `PUT /api/v1/requests/:id/reject` - Reject request (Admin)
- `PUT /api/v1/requests/:id/issue` - Issue book (Admin)
- `PUT /api/v1/requests/:id/return` - Return book (Admin)
- `GET /api/v1/requests/admin/overdue` - Get overdue books (Admin)

### Issues
- `POST /api/v1/issues` - Report issue (Student)
- `GET /api/v1/issues` - Get all issues (Admin)
- `GET /api/v1/issues/:id` - Get issue details
- `PUT /api/v1/issues/:id` - Update issue (Admin)

### Notifications
- `GET /api/v1/notifications` - Get user notifications
- `GET /api/v1/notifications/unread-count` - Get unread count
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `PUT /api/v1/notifications/mark-all-read` - Mark all as read
- `DELETE /api/v1/notifications/:id` - Delete notification

### Users
- `GET /api/v1/users/profile` - Get current user profile
- `PUT /api/v1/users/profile` - Update profile
- `PUT /api/v1/users/password` - Change password
- `GET /api/v1/users` - Get all users (Admin)
- `PUT /api/v1/users/:id/status` - Toggle user status (Admin)

## Key Features

### Security
- JWT-based authentication with access & refresh tokens
- Password hashing with bcryptjs (12 rounds)
- Rate limiting on login endpoints
- CORS protection
- Helmet security headers
- Role-based access control (RBAC)

### Database
- MySQL with connection pooling
- Triggers for automatic availability updates
- SQL functions for complex calculations
- Audit logging
- Proper indexes for performance

### Validation
- Joi schema validation
- Input sanitization
- Custom error messages
- Request validation middleware

### Error Handling
- Centralized error handler
- Consistent error response format
- Proper HTTP status codes
- Detailed error logging

### Logging
- Winston logger
- Access logs
- Error logs
- Combined logs

## Environment Variables

```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=smart_library
JWT_SECRET=your_secret_key
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

## Response Format

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {},
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Response Format

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## License

MIT
