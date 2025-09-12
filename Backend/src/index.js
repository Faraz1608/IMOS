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
import dispatchRoutes from './routes/dispatchRoutes.js'; // 1. Import dispatch routes

connectDB();
const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app); 
const io = new Server(server, { 
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Join a room based on user ID for targeted notifications
  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.join(userId);
    console.log(`User ${userId} joined their notification room.`);
  }

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

app.use((req, res, next) => {
  req.io = io;
  next();
});
// API ROUTES
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
app.use('/api/dispatches', dispatchRoutes); // 2. Add dispatch routes

const PORT = process.env.PORT || 7000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});