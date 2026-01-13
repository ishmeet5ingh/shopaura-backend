import dotenv from 'dotenv';
import { httpServer, io } from './app.js';
import connectDB from './config/database.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Start server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║   🚀 ShopAura Backend Server Running     ║
  ║   📍 Port: ${PORT}                          ║
  ║   🌍 Environment: ${process.env.NODE_ENV}           ║
  ║   🔗 http://localhost:${PORT}               ║
  ╚═══════════════════════════════════════════╝
  `);
});

// Setup Socket.IO events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  httpServer.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  process.exit(1);
});
