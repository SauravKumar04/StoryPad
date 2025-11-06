import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Store logout callback that will be set by AuthContext
let logoutCallback = null;

export const setLogoutCallback = (callback) => {
  logoutCallback = callback;
};

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only logout on 401 if it's a genuine authentication error, not network issues
    if (error.response?.status === 401) {
      // Check if it's a token-related error by looking at the error message
      const errorMessage = error.response?.data?.message?.toLowerCase() || '';
      if (errorMessage.includes('expired') || errorMessage.includes('invalid') || errorMessage.includes('unauthorized')) {
        // Call the logout callback from AuthContext if available
        if (logoutCallback) {
          logoutCallback();
        } else {
          // Fallback: clear localStorage and redirect
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setTimeout(() => {
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
              window.location.href = '/login';
            }
          }, 100);
        }
      }
    }
    return Promise.reject(error);
  }
);

// Search functions
export const searchUsers = async (query) => {
  try {
    const response = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

// Notification functions
export const getNotifications = async (page = 1, limit = 20, filter = 'all') => {
  try {
    const response = await api.get(`/notifications?page=${page}&limit=${limit}&filter=${filter}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const getUnreadNotificationCount = async () => {
  try {
    const response = await api.get('/notifications?limit=1&filter=unread');
    return response.data.pagination?.unreadCount || 0;
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return 0;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

export default api;