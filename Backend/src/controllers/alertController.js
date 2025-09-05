import Alert from '../models/Alert.js';
import Inventory from '../models/Inventory.js';
import Sku from '../models/Sku.js';
import moment from 'moment';

// @desc    Get all alerts for the user
// @route   GET /api/alerts
export const getAlerts = async (req, res) => {
  try {
    const { status = 'ACTIVE', priority, type, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status !== 'ALL') query.status = status;
    if (priority) query.priority = priority;
    if (type) query.type = type;
    
    const skip = (page - 1) * limit;
    
    const alerts = await Alert.find(query)
      .populate('relatedEntity.entityId', 'skuCode name')
      .populate('acknowledgedBy', 'username')
      .populate('resolvedBy', 'username')
      .populate('assignedTo', 'username')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Alert.countDocuments(query);
    
    res.status(200).json({
      alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get alert statistics
// @route   GET /api/alerts/stats
export const getAlertStats = async (req, res) => {
  try {
    const stats = await Alert.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $eq: ['$priority', 'CRITICAL'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$priority', 'HIGH'] }, 1, 0] } },
          acknowledged: { $sum: { $cond: [{ $eq: ['$status', 'ACKNOWLEDGED'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } }
        }
      }
    ]);
    
    const typeStats = await Alert.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const priorityTrends = await Alert.aggregate([
      {
        $match: {
          createdAt: { $gte: moment().subtract(30, 'days').toDate() }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            priority: '$priority'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
    
    res.status(200).json({
      summary: stats[0] || {
        total: 0,
        active: 0,
        critical: 0,
        high: 0,
        acknowledged: 0,
        resolved: 0
      },
      typeDistribution: typeStats,
      priorityTrends
    });
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Acknowledge an alert
// @route   PUT /api/alerts/:id/acknowledge
export const acknowledgeAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    await alert.acknowledge(req.user.id);
    
    // Broadcast real-time alert update
    req.socketService.broadcastAlertUpdate('acknowledge', alert, req.user.id);
    
    res.status(200).json({ message: 'Alert acknowledged', alert });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Resolve an alert
// @route   PUT /api/alerts/:id/resolve
export const resolveAlert = async (req, res) => {
  try {
    const { actionTaken } = req.body;
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    await alert.resolve(req.user.id, actionTaken);
    
    // Broadcast real-time alert update
    req.socketService.broadcastAlertUpdate('resolve', alert, req.user.id);
    
    res.status(200).json({ message: 'Alert resolved', alert });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Dismiss an alert
// @route   DELETE /api/alerts/:id
export const dismissAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'DISMISSED' },
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    // Broadcast real-time alert update
    req.socketService.broadcastAlertUpdate('dismiss', alert, req.user.id);
    
    res.status(200).json({ message: 'Alert dismissed' });
  } catch (error) {
    console.error('Error dismissing alert:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a manual alert
// @route   POST /api/alerts
export const createAlert = async (req, res) => {
  try {
    const {
      type,
      priority = 'MEDIUM',
      title,
      message,
      relatedEntity,
      assignedTo,
      expiresAt,
      tags = []
    } = req.body;
    
    const alert = await Alert.create({
      type,
      priority,
      title,
      message,
      relatedEntity,
      assignedTo,
      autoGenerated: false,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      tags,
      metadata: {
        source: 'MANUAL',
        createdBy: req.user.id
      }
    });
    
    // Broadcast real-time alert creation
    req.socketService.broadcastAlertUpdate('create', alert, req.user.id);
    
    res.status(201).json({ message: 'Alert created', alert });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Run automated alert checks
// @route   POST /api/alerts/check-automated
export const runAutomatedAlertChecks = async (req, res) => {
  try {
    const results = {
      lowStockAlerts: 0,
      stockoutRiskAlerts: 0,
      slowMovingAlerts: 0,
      abcReclassificationAlerts: 0
    };
    
    // Check for low stock items
    const lowStockThreshold = 10;
    const lowStockItems = await Inventory.find({
      quantity: { $lte: lowStockThreshold }
    }).populate('sku', 'skuCode name');
    
    for (const item of lowStockItems) {
      // Check if alert already exists
      const existingAlert = await Alert.findOne({
        type: 'LOW_STOCK',
        'relatedEntity.entityId': item.sku._id,
        status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] }
      });
      
      if (!existingAlert) {
        await Alert.createLowStockAlert(
          item.sku._id,
          item.quantity,
          lowStockThreshold
        );
        results.lowStockAlerts++;
      }
    }
    
    // Check for slow-moving items (no movement in 60 days)
    const slowMovingThreshold = moment().subtract(60, 'days').toDate();
    const slowMovingItems = await Inventory.find({
      updatedAt: { $lte: slowMovingThreshold },
      quantity: { $gt: 0 }
    }).populate('sku', 'skuCode name velocity');
    
    for (const item of slowMovingItems) {
      const existingAlert = await Alert.findOne({
        type: 'SLOW_MOVING',
        'relatedEntity.entityId': item.sku._id,
        status: { $in: ['ACTIVE', 'ACKNOWLEDGED'] }
      });
      
      if (!existingAlert) {
        await Alert.create({
          type: 'SLOW_MOVING',
          priority: 'MEDIUM',
          title: 'Slow Moving Item',
          message: `Item has not moved in over 60 days`,
          relatedEntity: {
            entityType: 'SKU',
            entityId: item.sku._id
          },
          details: {
            lastMovement: item.updatedAt,
            currentStock: item.quantity,
            daysStagnant: moment().diff(item.updatedAt, 'days')
          },
          tags: ['inventory', 'optimization'],
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
        });
        results.slowMovingAlerts++;
      }
    }
    
    // Emit socket event for alert summary
    req.io.emit('automated_alerts_generated', {
      results,
      timestamp: new Date()
    });
    
    res.status(200).json({
      message: 'Automated alert checks completed',
      results
    });
  } catch (error) {
    console.error('Error running automated alert checks:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get alerts for a specific entity
// @route   GET /api/alerts/entity/:entityType/:entityId
export const getEntityAlerts = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { status = 'ACTIVE' } = req.query;
    
    const query = {
      'relatedEntity.entityType': entityType.toUpperCase(),
      'relatedEntity.entityId': entityId
    };
    
    if (status !== 'ALL') query.status = status;
    
    const alerts = await Alert.find(query)
      .populate('acknowledgedBy', 'username')
      .populate('resolvedBy', 'username')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ alerts });
  } catch (error) {
    console.error('Error fetching entity alerts:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Bulk update alerts
// @route   PUT /api/alerts/bulk
export const bulkUpdateAlerts = async (req, res) => {
  try {
    const { alertIds, action, actionData = {} } = req.body;
    
    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return res.status(400).json({ message: 'Alert IDs are required' });
    }
    
    let updateQuery = {};
    let eventType = '';
    
    switch (action) {
      case 'acknowledge':
        updateQuery = {
          status: 'ACKNOWLEDGED',
          acknowledgedBy: req.user.id,
          acknowledgedAt: new Date()
        };
        eventType = 'alerts_bulk_acknowledged';
        break;
      case 'resolve':
        updateQuery = {
          status: 'RESOLVED',
          resolvedBy: req.user.id,
          resolvedAt: new Date(),
          ...(actionData.actionTaken && { actionTaken: actionData.actionTaken })
        };
        eventType = 'alerts_bulk_resolved';
        break;
      case 'dismiss':
        updateQuery = { status: 'DISMISSED' };
        eventType = 'alerts_bulk_dismissed';
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }
    
    const result = await Alert.updateMany(
      { _id: { $in: alertIds } },
      updateQuery
    );
    
    // Broadcast real-time bulk alert update
    req.socketService.broadcastAlertUpdate(`bulk-${action}`, { 
      alertIds, 
      count: result.modifiedCount 
    }, req.user.id);
    
    res.status(200).json({
      message: `${result.modifiedCount} alerts updated`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk updating alerts:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export default {
  getAlerts,
  getAlertStats,
  acknowledgeAlert,
  resolveAlert,
  dismissAlert,
  createAlert,
  runAutomatedAlertChecks,
  getEntityAlerts,
  bulkUpdateAlerts
};
