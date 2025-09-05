import { useEffect, useState, useCallback } from 'react';
import socketService from '../services/socketService';
import useAuthStore from '../store/authStore';

// Hook for basic socket connection
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const { user } = useAuthStore();

  useEffect(() => {
    // Initialize socket when user is authenticated
    if (user) {
      console.log('🔌 useSocket: Initializing socket for user:', user.name);
      socketService.initialize();

      // Listen for connection status changes
      const handleConnectionStatus = ({ connected }) => {
        console.log('🔌 useSocket: Connection status changed:', connected);
        setIsConnected(connected);
        setSocketId(connected ? socketService.socket?.id : null);
      };

      socketService.on('connection-status', handleConnectionStatus);

      // Set initial state if already connected
      const currentStatus = socketService.getConnectionStatus();
      setIsConnected(currentStatus.connected);
      setSocketId(currentStatus.socketId);

      // Cleanup on unmount
      return () => {
        console.log('🧿 useSocket: Cleaning up connection status listener');
        socketService.off('connection-status', handleConnectionStatus);
        // Note: We don't disconnect here as other components might be using the socket
      };
    } else {
      // User logged out, disconnect socket
      if (isConnected) {
        console.log('🔌 useSocket: User logged out, disconnecting socket');
        socketService.disconnect();
        setIsConnected(false);
        setSocketId(null);
      }
    }
  }, [user]);

  const requestDataUpdate = useCallback(() => {
    socketService.requestDataUpdate();
  }, []);

  return {
    isConnected,
    socketId,
    requestDataUpdate,
    socketService
  };
};

// Hook for real-time inventory updates
export const useInventoryUpdates = (onUpdate) => {
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !onUpdate) return;

    const handleInventoryUpdate = (data) => {
      onUpdate(data);
    };

    socketService.on('inventory-update', handleInventoryUpdate);

    return () => {
      socketService.off('inventory-update', handleInventoryUpdate);
    };
  }, [isConnected, onUpdate]);
};

// Hook for real-time alert updates
export const useAlertUpdates = (onUpdate) => {
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !onUpdate) return;

    const handleAlertUpdate = (data) => {
      onUpdate(data);
    };

    socketService.on('alert-update', handleAlertUpdate);

    return () => {
      socketService.off('alert-update', handleAlertUpdate);
    };
  }, [isConnected, onUpdate]);
};

// Hook for real-time dashboard updates
export const useDashboardUpdates = (onUpdate) => {
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !onUpdate) return;

    const handleDashboardUpdate = (data) => {
      onUpdate(data);
    };

    socketService.on('dashboard-update', handleDashboardUpdate);

    return () => {
      socketService.off('dashboard-update', handleDashboardUpdate);
    };
  }, [isConnected, onUpdate]);
};

// Hook for real-time analytics updates
export const useAnalyticsUpdates = (onUpdate) => {
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !onUpdate) return;

    const handleAnalyticsUpdate = (data) => {
      onUpdate(data);
    };

    socketService.on('analytics-update', handleAnalyticsUpdate);

    return () => {
      socketService.off('analytics-update', handleAnalyticsUpdate);
    };
  }, [isConnected, onUpdate]);
};

// Hook for real-time SKU updates
export const useSkuUpdates = (onUpdate) => {
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !onUpdate) return;

    const handleSkuUpdate = (data) => {
      onUpdate(data);
    };

    socketService.on('sku-update', handleSkuUpdate);

    return () => {
      socketService.off('sku-update', handleSkuUpdate);
    };
  }, [isConnected, onUpdate]);
};

// Hook for real-time layout updates
export const useLayoutUpdates = (onUpdate) => {
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !onUpdate) return;

    const handleLayoutUpdate = (data) => {
      onUpdate(data);
    };

    socketService.on('layout-update', handleLayoutUpdate);

    return () => {
      socketService.off('layout-update', handleLayoutUpdate);
    };
  }, [isConnected, onUpdate]);
};

// Hook for online users
export const useOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const handleUsersOnline = (data) => {
      setOnlineUsers(data.users);
      setUserCount(data.count);
    };

    const handleUserJoined = (data) => {
      setOnlineUsers(prev => [...prev, {
        userId: data.userId,
        name: data.name,
        connectedAt: data.timestamp
      }]);
      setUserCount(prev => prev + 1);
    };

    const handleUserLeft = (data) => {
      setOnlineUsers(prev => prev.filter(user => user.userId !== data.userId));
      setUserCount(prev => Math.max(0, prev - 1));
    };

    socketService.on('users-online', handleUsersOnline);
    socketService.on('user-joined', handleUserJoined);
    socketService.on('user-left', handleUserLeft);

    return () => {
      socketService.off('users-online', handleUsersOnline);
      socketService.off('user-joined', handleUserJoined);
      socketService.off('user-left', handleUserLeft);
    };
  }, [isConnected]);

  return {
    onlineUsers,
    userCount
  };
};

// Hook for data refresh events
export const useDataRefresh = (onRefresh) => {
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !onRefresh) return;

    const handleDataRefresh = (data) => {
      onRefresh(data);
    };

    socketService.on('data-refresh', handleDataRefresh);

    return () => {
      socketService.off('data-refresh', handleDataRefresh);
    };
  }, [isConnected, onRefresh]);
};

// Hook for system status updates
export const useSystemStatus = () => {
  const [systemStatus, setSystemStatus] = useState('online');
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const handleSystemStatus = (data) => {
      setSystemStatus(data.status);
    };

    socketService.on('system-status', handleSystemStatus);

    return () => {
      socketService.off('system-status', handleSystemStatus);
    };
  }, [isConnected]);

  return {
    systemStatus,
    isOnline: systemStatus === 'online',
    isMaintenanceMode: systemStatus === 'maintenance',
    hasWarning: systemStatus === 'warning',
    hasError: systemStatus === 'error'
  };
};

// Hook for personal notifications
export const usePersonalNotifications = (onNotification) => {
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !onNotification) return;

    const handlePersonalNotification = (notification) => {
      onNotification(notification);
    };

    socketService.on('personal-notification', handlePersonalNotification);

    return () => {
      socketService.off('personal-notification', handlePersonalNotification);
    };
  }, [isConnected, onNotification]);
};

// Hook for global notifications
export const useGlobalNotifications = (onNotification) => {
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !onNotification) return;

    const handleGlobalNotification = (notification) => {
      onNotification(notification);
    };

    socketService.on('global-notification', handleGlobalNotification);

    return () => {
      socketService.off('global-notification', handleGlobalNotification);
    };
  }, [isConnected, onNotification]);
};

// Generic hook for custom events
export const useSocketEvent = (event, callback) => {
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !callback) return;

    socketService.on(event, callback);

    return () => {
      socketService.off(event, callback);
    };
  }, [isConnected, event, callback]);
};
