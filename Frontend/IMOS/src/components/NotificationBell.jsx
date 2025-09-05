import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiAlertTriangle, FiX, FiCheck, FiClock } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const NotificationBell = () => {
  const { token } = useAuthStore();
  const [alerts, setAlerts] = useState([]);
  const [alertStats, setAlertStats] = useState({ active: 0, critical: 0, high: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/alerts?limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(response.data.alerts || []); 
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertStats = async () => {
    try {
      const response = await axios.get('/api/alerts/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // FIX: Safely set state with a fallback to prevent it from becoming undefined
      setAlertStats(response.data.summary || { active: 0, critical: 0, high: 0 });
    } catch (error) {
      console.error('Error fetching alert stats:', error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchAlertStats();
  }, [token]);

  const acknowledgeAlert = async (alertId) => {
    try {
      await axios.put(`/api/alerts/${alertId}/acknowledge`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAlerts();
      fetchAlertStats();
      toast.success('Alert acknowledged');
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      await axios.delete(`/api/alerts/${alertId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAlerts();
      fetchAlertStats();
      toast.success('Alert dismissed');
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast.error('Failed to dismiss alert');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'LOW_STOCK':
      case 'STOCKOUT_RISK':
        return <FiAlertTriangle className="w-4 h-4" />;
      default:
        return <FiBell className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const alertDate = new Date(date);
    const diffMs = now - alertDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);


  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-gray-800 focus:outline-none transition-colors duration-200 relative"
      >
        <FiBell className="w-6 h-6" />
        {alertStats.active > 0 && (
          <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white rounded-full ${
            alertStats.critical > 0 ? 'bg-red-600' :
            alertStats.high > 0 ? 'bg-orange-600' : 'bg-blue-600'
          }`}>
            {alertStats.active > 99 ? '99+' : alertStats.active}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Alerts</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            {alertStats.active > 0 && (
              <div className="flex space-x-2 mt-2">
                {alertStats.critical > 0 && (
                  <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                    {alertStats.critical} Critical
                  </span>
                )}
                {alertStats.high > 0 && (
                  <span className="px-2 py-1 text-xs font-medium text-orange-800 bg-orange-100 rounded-full">
                    {alertStats.high} High
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <FiClock className="w-6 h-6 mx-auto mb-2 animate-pulse" />
                Loading alerts...
              </div>
            ) : alerts.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {alerts.map((alert) => (
                  <div key={alert._id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-full ${getPriorityColor(alert.priority)}`}>
                          {getTypeIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {alert.title}
                            </p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              getPriorityColor(alert.priority)
                            }`}>
                              {alert.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {alert.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {formatTimeAgo(alert.createdAt)}
                            </span>
                            <div className="flex space-x-1">
                              {alert.status === 'ACTIVE' && (
                                <>
                                  <button
                                    onClick={() => acknowledgeAlert(alert._id)}
                                    className="p-1 text-green-600 hover:text-green-800 transition-colors"
                                    title="Acknowledge"
                                  >
                                    <FiCheck className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => dismissAlert(alert._id)}
                                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                    title="Dismiss"
                                  >
                                    <FiX className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <FiBell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No active alerts</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            )}
          </div>

          {alerts.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button 
                onClick={() => {
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all alerts
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;