import { Server } from 'socket.io';

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socket info
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: ["http://localhost:5173", "http://localhost:5174"],
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupEventHandlers();
    return this.io;
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Handle user authentication and registration
      socket.on('user-connected', (userData) => {
        console.log(`User authenticated: ${userData.userId} - ${userData.name}`);
        
        // Store user information
        this.connectedUsers.set(socket.id, {
          userId: userData.userId,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          connectedAt: new Date()
        });

        // Join user to their personal room for direct messages
        socket.join(`user_${userData.userId}`);
        
        // Broadcast user connection to all other users
        socket.broadcast.emit('user-joined', {
          userId: userData.userId,
          name: userData.name,
          timestamp: new Date()
        });

        // Send current connected users count
        this.broadcastUserCount();
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const userData = this.connectedUsers.get(socket.id);
        if (userData) {
          console.log(`User disconnected: ${userData.userId} - ${userData.name}`);
          
          // Broadcast user disconnection
          socket.broadcast.emit('user-left', {
            userId: userData.userId,
            name: userData.name,
            timestamp: new Date()
          });
          
          this.connectedUsers.delete(socket.id);
          this.broadcastUserCount();
        }
      });

      // Handle real-time data requests
      socket.on('request-data-update', () => {
        this.broadcastDataUpdate();
      });
    });
  }

  // Broadcast inventory updates
  broadcastInventoryUpdate(action, data) {
    if (!this.io) return;

    const updateData = {
      action, // 'create', 'update', 'delete'
      data,
      timestamp: new Date(),
      type: 'inventory'
    };

    console.log(`Broadcasting inventory ${action}:`, data.sku || data._id);
    this.io.emit('inventory-update', updateData);
  }

  // Broadcast SKU updates
  broadcastSKUUpdate(action, data) {
    if (!this.io) return;

    const updateData = {
      action, // 'create', 'update', 'delete'
      data,
      timestamp: new Date(),
      type: 'sku'
    };

    console.log(`Broadcasting SKU ${action}:`, data.sku || data._id);
    this.io.emit('sku-update', updateData);
  }

  // Broadcast alert updates
  broadcastAlertUpdate(action, alertData, userId = null) {
    if (!this.io) return;

    const updateData = {
      action, // 'create', 'update', 'acknowledge', 'delete'
      data: alertData,
      timestamp: new Date(),
      type: 'alert',
      triggeredBy: userId
    };

    console.log(`Broadcasting alert ${action}:`, alertData.title || alertData._id);
    
    // Send to all users except the one who triggered it (optional)
    if (userId) {
      this.io.except(`user_${userId}`).emit('alert-update', updateData);
    } else {
      this.io.emit('alert-update', updateData);
    }
  }

  // Broadcast dashboard updates
  broadcastDashboardUpdate(statsData) {
    if (!this.io) return;

    const updateData = {
      stats: statsData,
      timestamp: new Date(),
      type: 'dashboard'
    };

    console.log('Broadcasting dashboard update');
    this.io.emit('dashboard-update', updateData);
  }

  // Broadcast analytics updates
  broadcastAnalyticsUpdate(analyticsType, data) {
    if (!this.io) return;

    const updateData = {
      analyticsType, // 'predictive', 'turnover', 'cost', etc.
      data,
      timestamp: new Date(),
      type: 'analytics'
    };

    console.log(`Broadcasting analytics update: ${analyticsType}`);
    this.io.emit('analytics-update', updateData);
  }

  // Broadcast optimization updates
  broadcastOptimizationUpdate(optimizationType, data) {
    if (!this.io) return;

    const updateData = {
      optimizationType, // 'abc-analysis', 'picking-routes', 'layout', 'reorder-points'
      data,
      timestamp: new Date(),
      type: 'optimization'
    };

    console.log(`Broadcasting optimization update: ${optimizationType}`);
    this.io.emit('optimization-update', updateData);
  }

  // Broadcast layout updates
  broadcastLayoutUpdate(action, layoutData) {
    if (!this.io) return;

    const updateData = {
      action, // 'create', 'update', 'delete'
      data: layoutData,
      timestamp: new Date(),
      type: 'layout'
    };

    console.log(`Broadcasting layout ${action}:`, layoutData.name || layoutData._id);
    this.io.emit('layout-update', updateData);
  }

  // Broadcast user management updates (admin only)
  broadcastUserUpdate(action, userData, adminId) {
    if (!this.io) return;

    const updateData = {
      action, // 'create', 'update', 'delete', 'role-change'
      data: userData,
      timestamp: new Date(),
      type: 'user-management',
      updatedBy: adminId
    };

    console.log(`Broadcasting user ${action}:`, userData.email || userData._id);
    this.io.emit('user-management-update', updateData);
  }

  // Send notification to specific user
  sendNotificationToUser(userId, notification) {
    if (!this.io) return;

    console.log(`Sending notification to user ${userId}:`, notification.title);
    this.io.to(`user_${userId}`).emit('personal-notification', {
      ...notification,
      timestamp: new Date(),
      type: 'personal'
    });
  }

  // Send notification to all users
  broadcastNotification(notification) {
    if (!this.io) return;

    console.log('Broadcasting notification to all users:', notification.title);
    this.io.emit('global-notification', {
      ...notification,
      timestamp: new Date(),
      type: 'global'
    });
  }

  // Broadcast general data update request
  broadcastDataUpdate() {
    if (!this.io) return;
    
    console.log('Broadcasting general data update request');
    this.io.emit('data-refresh', {
      timestamp: new Date(),
      message: 'Data updated - please refresh'
    });
  }

  // Broadcast connected users count
  broadcastUserCount() {
    if (!this.io) return;
    
    const activeUsers = Array.from(this.connectedUsers.values()).map(user => ({
      userId: user.userId,
      name: user.name,
      role: user.role,
      connectedAt: user.connectedAt
    }));

    this.io.emit('users-online', {
      count: activeUsers.length,
      users: activeUsers,
      timestamp: new Date()
    });
  }

  // Get connected users
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  // Get socket instance
  getIO() {
    return this.io;
  }

  // Send system status update
  broadcastSystemStatus(status) {
    if (!this.io) return;

    this.io.emit('system-status', {
      status, // 'maintenance', 'online', 'warning', 'error'
      timestamp: new Date()
    });
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
