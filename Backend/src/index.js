import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import http from 'http';
import connectDB from './config/db.js';
import socketService from './services/socketService.js';
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
import advancedAnalyticsRoutes from './routes/advancedAnalyticsRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

connectDB();
const app = express();

app.use(cors());
app.use(express.json());

// Create an HTTP server from the Express app
const server = http.createServer(app); 

// Initialize Socket.IO service
const io = socketService.initialize(server);

// Make io and socketService accessible to our routes
app.use((req, res, next) => {
  req.io = io;
  req.socketService = socketService;
  next();
});

// --- API ROUTES ---
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
app.use('/api/advanced-analytics', advancedAnalyticsRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'IMOS Backend is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

const PORT = process.env.PORT || 7000;

// *** THE FIX: Start the http server, not the Express app ***
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});