import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import { errorMiddleware, notFoundMiddleware, loggerMiddleware } from './middleware/index.js';
import { apiLimiter } from './middleware/rate_limit_middleware.js';
import { EmailHelper } from './utils/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging
app.use(loggerMiddleware);

// Rate limiting
app.use('/api/', apiLimiter);

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize email service
EmailHelper.initialize();

// API routes
app.use('/api', routes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Smart Library API', version: '1.0.0', status: 'running' });
});

// Error handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
