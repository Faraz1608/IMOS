import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
    this.reconnectionAttempts = 0;
    this.maxReconnectionAttempts = 5;
  }

  // Initialize socket connection
  initialize(serverURL = 'http://localhost:7000') {
    // Prevent multiple connections
    if (this.socket && this.socket.connected) {
      console.log('✅ Socket already connected, reusing existing connection');
      return this.socket;
    }
    
    if (this.socket) {
      console.log('🔄 Cleaning up existing socket before reconnecting');
      this.disconnect();
    }

    console.log('🔌 Initializing new socket connection to', serverURL);
    this.socket = io(serverURL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectionAttempts,
      forceNew: false // Reuse existing connection if possible
    });

    this.setupEventHandlers();
    return this.socket;
  }

  setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectionAttempts = 0;
      
      // Send user authentication data
      const { user } = useAuthStore.getState();
      if (user) {
        this.socket.emit('user-connected', {
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        });
      }
      
      // Notify UI of connection status
      this.emit('connection-status', { connected: true });
      // Only show toast if it's not the initial connection to avoid spam
      if (this.reconnectionAttempts > 0) {
        toast.success('🔗 Reconnected to real-time updates');
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('connection-status', { connected: false });
      
      if (reason === 'io server disconnect') {
        // Reconnect manually if server disconnected the client
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectionAttempts++;
      
      if (this.reconnectionAttempts >= this.maxReconnectionAttempts) {
        toast.error('Unable to establish real-time connection');
      }
    });

    // User management events
    this.socket.on('user-joined', (data) => {
      console.log('👋 User joined:', data.name);
      // Only show toast for other users, not yourself
      const { user } = useAuthStore.getState();
      if (user && data.userId !== user.id) {
        toast(`👋 ${data.name} joined`, { icon: '👋', duration: 3000 });
      }
      this.emit('user-joined', data);
    });

    this.socket.on('user-left', (data) => {
      console.log('👋 User left:', data.name);
      this.emit('user-left', data);
    });

    this.socket.on('users-online', (data) => {
      console.log(`👥 ${data.count} users online`);
      this.emit('users-online', data);
    });

    // Inventory update events
    this.socket.on('inventory-update', (data) => {
      console.log(`📦 Inventory ${data.action}:`, data.data);
      
      // Show toast notification
      const messages = {
        create: '📦 New inventory item added',
        update: '🔄 Inventory updated',
        delete: '🗑️ Inventory item removed'
      };
      
      toast(messages[data.action] || '📦 Inventory changed', { 
        icon: data.action === 'create' ? '📦' : data.action === 'update' ? '🔄' : '🗑️' 
      });
      
      this.emit('inventory-update', data);
    });

    // SKU update events
    this.socket.on('sku-update', (data) => {
      console.log(`🏷️ SKU ${data.action}:`, data.data);
      
      const messages = {
        create: '🏷️ New SKU added',
        update: '🔄 SKU updated',
        delete: '🗑️ SKU removed'
      };
      
      toast(messages[data.action] || '🏷️ SKU changed');
      this.emit('sku-update', data);
    });

    // Alert update events
    this.socket.on('alert-update', (data) => {
      console.log(`🚨 Alert ${data.action}:`, data.data);
      
      const messages = {
        create: '🚨 New alert created',
        acknowledge: '✅ Alert acknowledged',
        resolve: '✅ Alert resolved',
        dismiss: '❌ Alert dismissed'
      };
      
      if (data.action === 'create' && data.data.priority === 'CRITICAL') {
        toast.error(`🚨 CRITICAL: ${data.data.title}`, { duration: 6000 });
      } else {
        toast(messages[data.action] || '🚨 Alert updated');
      }
      
      this.emit('alert-update', data);
    });

    // Dashboard update events
    this.socket.on('dashboard-update', (data) => {
      console.log('📊 Dashboard updated');
      this.emit('dashboard-update', data);
    });

    // Analytics update events
    this.socket.on('analytics-update', (data) => {
      console.log(`📈 Analytics updated: ${data.analyticsType}`);
      this.emit('analytics-update', data);
    });

    // Optimization update events
    this.socket.on('optimization-update', (data) => {
      console.log(`⚡ Optimization updated: ${data.optimizationType}`);
      this.emit('optimization-update', data);
    });

    // Layout update events
    this.socket.on('layout-update', (data) => {
      console.log(`🏗️ Layout ${data.action}:`, data.data);
      
      const messages = {
        create: '🏗️ New layout created',
        update: '🔄 Layout updated',
        delete: '🗑️ Layout removed'
      };
      
      toast(messages[data.action] || '🏗️ Layout changed');
      this.emit('layout-update', data);
    });

    // User management update events
    this.socket.on('user-management-update', (data) => {
      console.log(`👥 User ${data.action}:`, data.data);
      
      const messages = {
        create: '👥 New user added',
        update: '🔄 User updated',
        delete: '🗑️ User removed',
        'role-change': '🔧 User role changed'
      };
      
      toast(messages[data.action] || '👥 User management changed');
      this.emit('user-management-update', data);
    });

    // Notification events
    this.socket.on('personal-notification', (notification) => {
      console.log('📬 Personal notification:', notification);
      
      if (notification.priority === 'CRITICAL') {
        toast.error(`🚨 ${notification.title}: ${notification.message}`, { duration: 8000 });
      } else if (notification.priority === 'HIGH') {
        toast(`⚠️ ${notification.title}: ${notification.message}`, { duration: 6000 });
      } else {
        toast.success(`📬 ${notification.title}: ${notification.message}`, { duration: 4000 });
      }
      
      this.emit('personal-notification', notification);
    });

    this.socket.on('global-notification', (notification) => {
      console.log('📢 Global notification:', notification);
      toast(`📢 ${notification.title}: ${notification.message}`, { duration: 5000 });
      this.emit('global-notification', notification);
    });

    // System events
    this.socket.on('data-refresh', (data) => {
      console.log('🔄 Data refresh requested');
      toast('🔄 Data updated - refreshing...', { icon: '🔄' });
      this.emit('data-refresh', data);
    });

    this.socket.on('system-status', (data) => {
      console.log('🔧 System status:', data.status);
      
      const statusMessages = {
        maintenance: '🔧 System maintenance in progress',
        online: '✅ System is online',
        warning: '⚠️ System warning',
        error: '❌ System error detected'
      };
      
      const message = statusMessages[data.status] || '🔧 System status changed';
      
      if (data.status === 'error') {
        toast.error(message, { duration: 8000 });
      } else if (data.status === 'warning') {
        toast(message, { duration: 6000 });
      } else {
        toast.success(message);
      }
      
      this.emit('system-status', data);
    });
  }

  // Add event listener
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  // Emit event to local listeners
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Send event to server
  send(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot send event:', event);
    }
  }

  // Request data update from server
  requestDataUpdate() {
    this.send('request-data-update');
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id
    };
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectedUsers.clear();
      this.eventListeners.clear();
    }
  }

  // Reconnect socket
  reconnect() {
    if (this.socket) {
      console.log('🔄 Reconnecting socket');
      this.socket.connect();
    }
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
