import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

// Import middleware
import { apiLimiter, authLimiter, paymentLimiter, searchLimiter } from './middleware/rateLimiter.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Create Express app
const app = express();

// Create HTTP server for Socket.IO
const httpServer = createServer(app);

// CORS configuration - Simple and working
const corsOptions = {
  origin: [
    'http://localhost:5173',        // Frontend
    'http://localhost:5174',    
    'http://192.168.1.10:5173',    // Admin panel
    process.env.FRONTEND_URL,
    process.env.ADMIN_PANEL_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

// Apply CORS
app.use(cors(corsOptions));

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.FRONTEND_URL,
      process.env.ADMIN_PANEL_URL
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join', (userId) => {
    socket.join(userId);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible
global.io = io;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));


// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting
app.use('/api/', apiLimiter);

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/payment', paymentLimiter, paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchLimiter, searchRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ShopAura E-commerce API',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      cart: '/api/cart',
      wishlist: '/api/wishlist',
      orders: '/api/orders',
      checkout: '/api/checkout',
      payment: '/api/payment',
      profile: '/api/profile',
      addresses: '/api/addresses',
      settings: '/api/settings',
      notifications: '/api/notifications',
      search: '/api/search'
    }
  });
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

export { httpServer, io };
export default app;
