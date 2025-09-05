import React, { useState, useEffect } from 'react';
import { useSocket, useOnlineUsers, useInventoryUpdates, useAlertUpdates, useDashboardUpdates } from '../hooks/useSocket';
import { FiUsers, FiWifi, FiWifiOff, FiPackage, FiAlertTriangle, FiBarChart } from 'react-icons/fi';
import toast from 'react-hot-toast';

const RealTimeTest = () => {
  const { isConnected, socketId } = useSocket();
  const { userCount, onlineUsers } = useOnlineUsers();
  const [updates, setUpdates] = useState([]);

  // Add update to the list with timestamp
  const addUpdate = (type, message, data = null) => {
    const update = {
      id: Date.now(),
      type,
      message,
      data,
      timestamp: new Date()
    };
    
    setUpdates(prev => [update, ...prev.slice(0, 9)]); // Keep last 10 updates
  };

  // Real-time update handlers
  useInventoryUpdates((data) => {
    addUpdate('inventory', `Inventory ${data.action}: ${data.data?.sku?.skuCode || data.data._id}`, data);
    toast(`📦 Inventory ${data.action}`, { icon: '📦' });
  });

  useAlertUpdates((data) => {
    addUpdate('alert', `Alert ${data.action}: ${data.data?.title || data.data._id}`, data);
    toast(`🚨 Alert ${data.action}`, { icon: '🚨' });
  });

  useDashboardUpdates((data) => {
    addUpdate('dashboard', 'Dashboard data updated', data);
    toast('📊 Dashboard updated', { icon: '📊' });
  });

  const getUpdateIcon = (type) => {
    switch (type) {
      case 'inventory': return <FiPackage className="w-4 h-4 text-blue-500" />;
      case 'alert': return <FiAlertTriangle className="w-4 h-4 text-red-500" />;
      case 'dashboard': return <FiBarChart className="w-4 h-4 text-green-500" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const getUpdateColor = (type) => {
    switch (type) {
      case 'inventory': return 'border-l-blue-500 bg-blue-50';
      case 'alert': return 'border-l-red-500 bg-red-50';
      case 'dashboard': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Real-Time Status</h3>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <>
              <FiWifi className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-600">Connected</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </>
          ) : (
            <>
              <FiWifiOff className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-red-600">Disconnected</span>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            </>
          )}
        </div>
      </div>

      {/* Connection Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Socket ID</p>
              <p className="text-xs text-blue-600 font-mono">{socketId || 'Not connected'}</p>
            </div>
            <FiWifi className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">Online Users</p>
              <p className="text-2xl font-bold text-green-600">{userCount}</p>
            </div>
            <FiUsers className="w-6 h-6 text-green-500" />
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-900">Live Updates</p>
              <p className="text-2xl font-bold text-purple-600">{updates.length}</p>
            </div>
            <FiBarChart className="w-6 h-6 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Online Users ({onlineUsers.length})</h4>
          <div className="flex flex-wrap gap-2">
            {onlineUsers.map((user) => (
              <div key={user.userId} className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-medium text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Updates Feed */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Updates</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {updates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiBarChart className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No real-time updates yet</p>
              <p className="text-xs">Make changes in another tab/window to see updates here</p>
            </div>
          ) : (
            updates.map((update) => (
              <div key={update.id} className={`border-l-4 pl-3 py-2 ${getUpdateColor(update.type)}`}>
                <div className="flex items-start space-x-2">
                  {getUpdateIcon(update.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{update.message}</p>
                    <p className="text-xs text-gray-500">
                      {update.timestamp.toLocaleTimeString()}
                    </p>
                    {update.data && (
                      <details className="mt-1">
                        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                          View data
                        </summary>
                        <pre className="text-xs bg-gray-800 text-green-400 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(update.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h5 className="text-sm font-medium text-yellow-900 mb-2">Testing Real-Time Updates</h5>
        <div className="text-xs text-yellow-800 space-y-1">
          <p>• Open this app in multiple browser tabs/windows</p>
          <p>• Make changes in one tab (add inventory, create alerts, etc.)</p>
          <p>• Watch this feed update in real-time across all tabs</p>
          <p>• Check the online users count to see multiple connections</p>
        </div>
      </div>
    </div>
  );
};

export default RealTimeTest;
