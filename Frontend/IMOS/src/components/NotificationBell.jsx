import React, { useState, useEffect, useRef } from 'react';
import { FiBell } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import { getNotifications, markAllAsRead } from '../services/notificationService';
import toast from 'react-hot-toast';

const NotificationBell = () => {
  const { token } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications(token);
      setNotifications(res.data);
    } catch (error) {
      toast.error('Could not fetch notifications.');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const handleToggle = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // Mark all as read when opening the dropdown
      try {
        await markAllAsRead(token);
        // Refresh notifications to show them as "read"
        fetchNotifications();
      } catch (error) {
        console.error('Failed to mark notifications as read');
      }
    }
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
      <button onClick={handleToggle} className="relative">
        <FiBell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-20">
          <div className="p-4 font-bold border-b">Notifications</div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div key={notification._id} className={`p-4 border-b hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}>
                  <p className="text-sm text-gray-700">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="p-4 text-sm text-center text-gray-500">No new notifications.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;