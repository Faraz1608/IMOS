import React, { useState, useEffect, useRef } from 'react';
import { FiBell } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import { getNotifications, markAllAsRead, deleteNotification } from '../services/notificationService';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000';

const NotificationBell = () => {
  const { token, user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
    } catch (error) {
      toast.error('Could not fetch notifications.');
    }
  };

  useEffect(() => {
    if (token && user?._id) {
      fetchNotifications();

      // UPDATE THIS LINE: Use SOCKET_URL instead of 'http://localhost:7000'
      const socket = io(SOCKET_URL, {
        auth: { token },
        query: { userId: user._id }
      });

      socket.on('new_notification', (newNotification) => {
        toast.success(newNotification.message, { icon: '🔔' });
        setNotifications(prev => [newNotification, ...prev]);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [token, user]);

  const handleToggle = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      try {
        await markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch (error) {
        console.error('Failed to mark notifications as read');
      }
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification removed');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

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
                <div key={notification._id} className={`p-4 border-b hover:bg-gray-50 flex justify-between items-start ${!notification.read ? 'bg-blue-50' : ''}`}>
                  <div>
                    <p className="text-sm text-gray-700">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, notification._id)}
                    className="text-gray-400 hover:text-red-500 ml-2"
                    title="Delete"
                  >
                    &times;
                  </button>
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