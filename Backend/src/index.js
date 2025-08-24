import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import layoutRoutes from './routes/layoutRoutes.js';
import skuRoutes from './routes/skuRoutes.js'; // Import SKU routes
import inventoryRoutes from './routes/inventoryRoutes.js';
import optimizationRoutes from './routes/optimizationRoutes.js';
import searchRoutes from './routes/searchRoutes.js';  
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import userRoutes from './routes/userRoutes.js';
connectDB();
const app = express();
app.use(cors());
app.use(express.json());

// --- API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/layouts', layoutRoutes);
app.use('/api/skus', skuRoutes); // Add SKU routes
app.use('/api/inventory', inventoryRoutes); // Add inventory routes
app.use('/api/optimize', optimizationRoutes); // Add optimization routes
app.use('/api/search', searchRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});