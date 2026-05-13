# Frontend - Smart Library Management System

## Overview

This is the frontend application for the Smart Library Management System. It provides a user interface for both students and administrators to manage book requests, track borrowed books, and handle library operations.

## Project Structure

```
frontend/
├── index.html                 # Login page
├── landing_page.html          # Landing page
├── pages/                     # HTML pages for different views
│   ├── admin-dashboard.html
│   ├── admin_profile.html
│   ├── issue-book.html
│   ├── manage-books.html
│   ├── manage-users.html
│   ├── register.html
│   ├── request-book.html
│   ├── student-dashboard.html
│   ├── student-mybooks.html
│   ├── student-notifications.html
│   ├── student_profile.html
│   └── view-requests.html
├── css/                       # Stylesheets
│   ├── styles.css
│   ├── layout.css
│   ├── components.css
│   ├── badges.css
│   └── responsive.css
├── js/                        # JavaScript files
│   ├── api/
│   │   ├── config.js         # API configuration
│   │   └── service.js        # API service methods
│   ├── utils/
│   │   ├── token_manager.js  # JWT token management
│   │   ├── auth.js           # Authentication helpers
│   │   └── toastNotifyFunction.js
│   ├── index.js              # Login logic
│   ├── student_dashboard.js
│   ├── admin_dashboard.js
│   └── ... (other page logic)
├── assets/
│   └── images/               # Images and illustrations
├── package.json              # Frontend dependencies
└── .gitignore

```

## Setup Instructions

### Prerequisites
- Node.js 14+ (optional, for local development server)
- Modern web browser
- Backend API running (see backend/README.md)

### Installation

1. Install dependencies (optional for static serving):
   ```bash
   npm install
   ```

2. Update API configuration in `js/api/config.js`:
   ```javascript
   const API_URL = 'http://localhost:5000/api/v1';
   ```

3. Start a local development server:
   ```bash
   # Using Python 3
   python -m http.server 3000

   # OR using Node.js (http-server)
   npx http-server -p 3000

   # OR using npm script
   npm run dev
   ```

4. Open browser and navigate to:
   ```
   http://localhost:3000
   ```

## Features

### Student Features
- User registration and login
- Browse library catalog
- Search and filter books
- Request books
- Track request status (Pending, Approved, Issued, Returned)
- View borrowed books
- Report book issues (damage, loss)
- Receive notifications
- View personal profile
- Manage password

### Admin Features
- Complete book management (CRUD)
- User management (view, deactivate)
- Book request workflow (approve, issue, return)
- Issue management (damage reports)
- Overdue tracking and fine calculation
- System notifications
- Activity audit logs
- Profile management

## API Integration

The frontend communicates with the backend via REST API. Key endpoints:

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

### Books
- `GET /api/v1/books` - List all books
- `POST /api/v1/books` - Create book (admin)
- `PUT /api/v1/books/:id` - Update book (admin)
- `DELETE /api/v1/books/:id` - Delete book (admin)

### Requests
- `POST /api/v1/requests` - Create book request
- `GET /api/v1/requests` - Get requests
- `PUT /api/v1/requests/:id/approve` - Approve request (admin)
- `PUT /api/v1/requests/:id/issue` - Issue book (admin)
- `PUT /api/v1/requests/:id/return` - Return book (admin)

### And many more...

For complete API documentation, see `backend/README.md`

## Key JavaScript Files

### `js/api/config.js`
Configuration for API endpoints and base URL settings.

### `js/api/service.js`
Service layer for making API calls with:
- Request/response interceptors
- Token management
- Error handling
- Automatic retry logic

### `js/utils/token_manager.js`
Handles:
- JWT token storage (localStorage)
- Token expiration checking
- Automatic token refresh
- Token validation

### `js/index.js`
Login page logic with:
- Form validation
- Role switching (Student/Admin)
- API integration
- Error handling

## Development Workflow

1. **Modify UI**: Edit HTML in `pages/` and CSS in `css/`
2. **Add Logic**: Create new JS files following existing patterns
3. **API Calls**: Use service layer from `js/api/service.js`
4. **Token Management**: Use utilities from `js/utils/token_manager.js`
5. **Testing**: Test with backend running locally

## Browser Compatibility

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Mobile

## Security Notes

- JWT tokens stored in localStorage (consider upgrading to httpOnly cookies)
- All API calls require valid JWT token
- Tokens automatically refresh before expiration
- Logout clears all stored tokens
- Input validation on all forms

## Performance Optimization

- Lazy loading of images
- Minified CSS and JavaScript
- Efficient DOM manipulation
- Token caching to reduce API calls
- Debounced search inputs

## Troubleshooting

### API Connection Failed
- Ensure backend is running on correct port (5000)
- Check CORS settings in backend
- Verify API_URL in `js/api/config.js`

### Token Expired
- Automatic refresh attempted
- Manual login required if refresh fails

### Page Not Loading
- Clear browser cache and localStorage
- Check browser console for errors
- Verify all CSS and JS files are loaded

## Contributing

Follow these guidelines:
- Use consistent naming conventions
- Comment complex logic
- Validate all inputs
- Test with backend API
- Maintain responsive design

## License

This project is part of the Smart Library Management System.
