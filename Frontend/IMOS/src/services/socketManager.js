// Socket connection manager to handle React StrictMode and multiple component mounts
import socketService from './socketService';

class SocketManager {
  constructor() {
    this.initialized = false;
    this.initializingPromise = null;
    this.subscribers = new Set();
  }

  // Ensure only one initialization happens
  async ensureConnection(user) {
    if (this.initialized && socketService.isConnected) {
      return socketService;
    }

    if (this.initializingPromise) {
      return this.initializingPromise;
    }

    this.initializingPromise = this.initializeConnection(user);
    return this.initializingPromise;
  }

  async initializeConnection(user) {
    try {
      console.log('🔌 SocketManager: Ensuring connection for user:', user?.name);
      
      if (!this.initialized) {
        socketService.initialize();
        this.initialized = true;
      }

      return socketService;
    } catch (error) {
      console.error('❌ SocketManager: Failed to initialize connection:', error);
      this.initializingPromise = null;
      throw error;
    }
  }

  // Subscribe to connection changes
  subscribe(callback) {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Notify all subscribers of connection changes
  notifySubscribers(connected) {
    this.subscribers.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('❌ SocketManager: Error in subscriber callback:', error);
      }
    });
  }

  // Disconnect when no more subscribers
  disconnect() {
    if (this.subscribers.size === 0) {
      console.log('🔌 SocketManager: No more subscribers, disconnecting');
      socketService.disconnect();
      this.initialized = false;
      this.initializingPromise = null;
    }
  }

  // Get connection status
  getConnectionStatus() {
    return socketService.getConnectionStatus();
  }
}

// Export singleton instance
const socketManager = new SocketManager();
export default socketManager;
