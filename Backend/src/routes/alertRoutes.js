import express from 'express';
import {
  getAlerts,
  getAlertStats,
  acknowledgeAlert,
  resolveAlert,
  dismissAlert,
  createAlert,
  runAutomatedAlertChecks,
  getEntityAlerts,
  bulkUpdateAlerts
} from '../controllers/alertController.js';
import {protect, authorize} from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect,authorize);

// @route   GET /api/alerts
// @desc    Get all alerts with filtering and pagination
// @access  Private
router.get('/', getAlerts);

// @route   GET /api/alerts/stats
// @desc    Get alert statistics and trends
// @access  Private
router.get('/stats', getAlertStats);

// @route   POST /api/alerts
// @desc    Create a manual alert
// @access  Private
router.post('/', createAlert);

// @route   POST /api/alerts/check-automated
// @desc    Run automated alert checks
// @access  Private
router.post('/check-automated', runAutomatedAlertChecks);

// @route   GET /api/alerts/entity/:entityType/:entityId
// @desc    Get alerts for a specific entity
// @access  Private
router.get('/entity/:entityType/:entityId', getEntityAlerts);

// @route   PUT /api/alerts/bulk
// @desc    Bulk update alerts (acknowledge, resolve, dismiss)
// @access  Private
router.put('/bulk', bulkUpdateAlerts);

// @route   PUT /api/alerts/:id/acknowledge
// @desc    Acknowledge a specific alert
// @access  Private
router.put('/:id/acknowledge', acknowledgeAlert);

// @route   PUT /api/alerts/:id/resolve
// @desc    Resolve a specific alert
// @access  Private
router.put('/:id/resolve', resolveAlert);

// @route   DELETE /api/alerts/:id
// @desc    Dismiss a specific alert
// @access  Private
router.delete('/:id', dismissAlert);

export default router;
