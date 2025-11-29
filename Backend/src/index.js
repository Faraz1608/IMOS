import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import layoutRoutes from './routes/layoutRoutes.js';
import skuRoutes from './routes/skuRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import optimizationRoutes from './routes/optimizationRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import userRoutes from './routes/userRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dispatchRoutes from './routes/dispatchRoutes.js';
import warehouseRoutes from './routes/warehouseRoutes.js';

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = new Server(server, { 
  cors: {
    // In production, this should be your Netlify URL (e.g., "https://your-site.netlify.app")
    // You can use an environment variable here too
    origin: process.env.FRONTEND_URL || "http://localhost:5173", 
    methods: ["GET", "POST"]
  }
});

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log('A user connected');

  // Join a room for targeted notifications using user ID from the client
  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.join(userId);
    console.log(`User ${userId} joined their notification room.`);
  }

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Make io accessible in all routes by attaching it to the request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/layouts', layoutRoutes);
app.use('/api/skus', skuRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/optimize', optimizationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dispatches', dispatchRoutes);
app.use('/api/warehouse',warehouseRoutes)
// Start server
const PORT = process.env.PORT || 7000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
