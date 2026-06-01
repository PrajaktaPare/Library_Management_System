<div align="center">

# 📚 Smart Library Management System

A secure and centralized web-based application for managing library operations, including books, users, requests, issue/return workflows, and authentication.

</div>

---

## Overview

The Smart Library Management System is a backend application developed using Node.js, Express.js, and MySQL to digitize library operations.

The system enables administrators to manage books, users, requests, and issued books efficiently, while students can search books, request borrowing, and track issued books. It reduces manual effort, improves data accuracy, and provides secure role-based access control.

---

## Features

- JWT Authentication & Authorization
- Role-Based Access Control (Admin & Student)
- User Management
- Book Management
- Book Request Workflow
- Book Issue & Return Management
- Automated Fine Calculation
- Email Verification
- Forgot Password & Reset Password
- AJV Request Validation
- Winston Logging
- Secure Password Hashing

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MySQL |
| Authentication | JWT |
| Validation | AJV |
| Logging | Winston |
| Email Service | Nodemailer |

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd Backend_Project/backend
```

Install dependencies:

```bash
npm install
```

Install only production dependencies:

```bash
npm install --omit=dev
```

---

## Running the Application

Start the server:

```bash
npm start
```

Run in development mode:

```bash
npm run dev
```

---

## Available Scripts

Run development server:

```bash
npm run dev
```

Start application:

```bash
npm start
```

Lint code:

```bash
npm run lint
```

Format code:

```bash
npm run format
```

## Base URL

```http
http://localhost:3000
```
