// cors options — only origins listed in ALLOWED_ORIGINS are permitted
import env from './env_config.js';

const corsOptions = {
  origin(origin, callback) {
    // allow requests with no origin (e.g. curl, Postman) in development
    if (!origin && !env.IS_PROD) {
      return callback(null, true);
    }
    if (env.ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true, // allow cookies to be sent cross-origin
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export default corsOptions;