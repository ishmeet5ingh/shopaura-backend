import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';

// Prevent NoSQL injection
export const preventNoSQLInjection = mongoSanitize({
  replaceWith: '_'
});

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    }
  },
  crossOriginEmbedderPolicy: false
});

// CORS configuration
export const corsOptions = {
  origin: function (origin, callback) {
    const whitelist = [
      process.env.FRONTEND_URL,
      process.env.ADMIN_PANEL_URL,
      'http://localhost:5173',
      'http://localhost:5174'
    ];
    
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
