import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Bell, Heart, UserPlus, MessageCircle, BookOpen, CheckCheck, Trash2, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import api from '../utils/api';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread'
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      setupSocketConnection();
    }
  }, [user, filter]);

  const fetchNotifications = async (pageNum = 1, reset = true) => {
    try {
      const response = await api.get(`/notifications?page=${pageNum}&filter=${filter}&limit=20`);
      
      if (reset) {
        setNotifications(response.data.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.data.notifications]);
      }
      
      setHasMore(response.data.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketConnection = () => {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001');
    
    socket.emit('join-user', user.id);
    
    socket.on('newNotification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      toast.info(`New ${notification.type}: ${notification.message}`);
    });

    return () => socket.disconnect();
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => 
        prev.filter(notif => notif._id !== notificationId)
      );
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="h-6 w-6 text-red-500 fill-current" />;
      case 'follow':
        return <UserPlus className="h-6 w-6 text-blue-500" />;
      case 'comment':
        return <MessageCircle className="h-6 w-6 text-green-500" />;
      case 'story':
        return <BookOpen className="h-6 w-6 text-purple-500" />;
      case 'chapter':
        return <BookOpen className="h-6 w-6 text-indigo-500" />;
      default:
        return <Bell className="h-6 w-6 text-gray-500" />;
    }
  };

  const getNotificationMessage = (notification) => {
    const { type, sender, story, chapter } = notification;
    
    switch (type) {
      case 'like':
        return `${sender?.username} liked your story "${story?.title}"`;
      case 'follow':
        return `${sender?.username} started following you`;
      case 'comment':
        return `${sender?.username} commented on your story "${story?.title}"`;
      case 'story':
        return `${sender?.username} published a new story "${story?.title}"`;
      case 'chapter':
        return `${sender?.username} added a new chapter "${chapter?.title}" to "${story?.title}"`;
      default:
        return notification.message || 'New notification';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return time.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-purple-100">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
            <div>
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Bell className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Notifications
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Stay connected with your story community
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <div className="flex bg-white/80 backdrop-blur-sm rounded-xl border border-purple-200 p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg transition-all font-medium ${
                    filter === 'all'
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 rounded-lg transition-all font-medium ${
                    filter === 'unread'
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  Unread
                </button>
              </div>
              
              <button
                onClick={markAllAsRead}
                className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-purple-200 text-purple-600 px-4 py-2 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all font-medium"
              >
                <CheckCheck className="h-4 w-4" />
                <span>Mark All Read</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.map(notification => (
            <div
              key={notification._id}
              className={`group bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-lg border transition-all hover:shadow-xl ${
                notification.read
                  ? 'border-purple-100/50'
                  : 'border-purple-200 bg-gradient-to-r from-purple-50/50 to-pink-50/50 shadow-purple-100/50'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    notification.read ? 'bg-gray-100' : 'bg-gradient-to-r from-purple-500 to-pink-500'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  {!notification.read && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-lg leading-relaxed">
                    {getNotificationMessage(notification)}
                  </p>
                  <p className="text-gray-500 mt-2 flex items-center space-x-2">
                    <span>{formatTimeAgo(notification.createdAt)}</span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                      title="Mark as read"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete notification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && notifications.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={() => fetchNotifications(page + 1, false)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
            >
              Load More Notifications
            </button>
          </div>
        )}

        {/* Empty State */}
        {notifications.length === 0 && !loading && (
          <div className="text-center py-24 bg-white/80 backdrop-blur-sm rounded-3xl border border-purple-100/50 shadow-lg">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Bell className="h-12 w-12 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              No notifications yet
            </h3>
            <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
              When readers interact with your stories or follow you, their notifications will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Bell className="h-8 w-8 text-pink-500" />
            <h1 className="text-3xl font-display font-bold text-gray-900">
              Notifications
            </h1>
          </div>
          <p className="text-gray-600">
            Stay updated with your story interactions
          </p>
        </div>

        <div className="space-y-4">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`bg-white p-6 rounded-2xl shadow-sm border transition-colors ${
                notification.read
                  ? 'border-pink-100'
                  : 'border-pink-300 bg-pink-50'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900">
                    {getNotificationText(notification)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {notification.timestamp.toLocaleDateString()} at{' '}
                    {notification.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {!notification.read && (
                  <div className="shrink-0">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-pink-100">
            <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No notifications yet
            </h3>
            <p className="text-gray-500">
              When you get likes, comments, or new followers, they'll appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;