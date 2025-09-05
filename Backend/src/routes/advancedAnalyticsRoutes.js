import express from 'express';
import {
  getPredictiveAnalytics,
  getInventoryTurnoverAnalysis,
  getSpaceUtilizationAnalysis,
  getCostAnalysis,
  exportAnalyticsData
} from '../controllers/advancedAnalyticsController.js';
import {protect, authorize} from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect,authorize);

// @route   GET /api/advanced-analytics/predictive
// @desc    Get predictive analytics data including demand forecasting and stockout prediction
// @access  Private
router.get('/predictive', getPredictiveAnalytics);

// @route   GET /api/advanced-analytics/turnover
// @desc    Get inventory turnover analysis
// @access  Private
router.get('/turnover', getInventoryTurnoverAnalysis);

// @route   GET /api/advanced-analytics/space-utilization
// @desc    Get detailed space utilization analysis
// @access  Private
router.get('/space-utilization', getSpaceUtilizationAnalysis);

// @route   GET /api/advanced-analytics/cost-analysis
// @desc    Get cost analysis and ICC optimization data
// @access  Private
router.get('/cost-analysis', getCostAnalysis);

// @route   POST /api/advanced-analytics/export
// @desc    Export analytics data in various formats
// @access  Private
router.post('/export', exportAnalyticsData);

export default router;
