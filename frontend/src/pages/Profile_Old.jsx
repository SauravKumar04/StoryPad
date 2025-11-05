import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Users, 
  BookOpen, 
  Bookmark, 
  Plus,
  Settings,
  User,
  Camera,
  Grid3X3,
  Calendar,
  MapPin,
  Globe,
  Edit3,
  UserPlus,
  MessageCircle,
  X,
  Sparkles
} from 'lucide-react';
import Navbar from '../components/Navbar';
import StoryCard from '../components/StoryCard';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../utils/api';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stories, setStories] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stories');
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [userModal, setUserModal] = useState({ show: false, users: [], title: '' });
  const { user: currentUser } = useAuth();

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    fetchProfile();
    fetchUserStories();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      if (!userId) {
        setUser(currentUser);
        setLoading(false);
        return;
      }

      const response = await api.get(`/users/${userId}`);
      setUser(response.data.user);
      
      if (currentUser && currentUser.id !== userId) {
        const followResponse = await api.get(`/users/${userId}/follow-status`);
        setIsFollowing(followResponse.data.isFollowing);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStories = async () => {
    try {
      const targetUserId = userId || currentUser?.id;
      if (!targetUserId) return;
      
      const response = await api.get(`/stories/user/${targetUserId}`);
      setStories(response.data.stories || []);
    } catch (error) {
      console.error('Error fetching user stories:', error);
      setStories([]);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await api.delete(`/users/${user.id}/follow`);
        setIsFollowing(false);
        toast.success(`Unfollowed ${user.username}`);
      } else {
        await api.post(`/users/${user.id}/follow`);
        setIsFollowing(true);
        toast.success(`Following ${user.username}`);
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      toast.error('Error updating follow status');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await api.post('/users/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUser(prev => ({ ...prev, profilePicture: response.data.avatarUrl }));
      toast.success('Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Error uploading avatar');
    }
  };

  const getUserStats = () => ({
    stories: stories.length,
    followers: user?.followers?.length || 0,
    following: user?.following?.length || 0
  });

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const showFollowersList = () => {
    setUserModal({
      show: true,
      users: user?.followers || [],
      title: 'Followers'
    });
  };

  const showFollowingList = () => {
    setUserModal({
      show: true,
      users: user?.following || [],
      title: 'Following'
    });
  };

  const renderTabContent = () => {
    if (activeTab === 'stories') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
          {stories.length === 0 && (
            <div className="col-span-full text-center py-16">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {isOwnProfile ? "You haven't written any stories yet" : "No stories published yet"}
              </p>
              {isOwnProfile && (
                <Link
                  to="/create-story"
                  className="inline-flex items-center gap-2 mt-4 bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all"
                >
                  <Plus className="h-5 w-5" />
                  Write Your First Story
                </Link>
              )}
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 lg:py-8">
          {/* Loading Skeleton */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-6 sm:mb-8 animate-pulse">
            <div className="bg-gray-200 px-6 sm:px-8 lg:px-10 pt-8 sm:pt-12 pb-6">
              <div className="block lg:hidden text-center">
                <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gray-300 rounded-2xl mx-auto mb-6"></div>
                <div className="h-8 bg-gray-200 rounded-xl w-48 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-xl w-64 mx-auto mb-6"></div>
              </div>
              
              <div className="hidden lg:flex items-start gap-8">
                <div className="w-32 h-32 xl:w-36 xl:h-36 bg-gray-300 rounded-2xl"></div>
                <div className="flex-1">
                  <div className="h-10 bg-gray-200 rounded-xl w-64 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded-xl w-96 mb-6"></div>
                </div>
              </div>
              
              <div className="flex gap-8 mb-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="text-center">
                    <div className="h-8 w-16 bg-gray-200 rounded-xl mb-2"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
              
              <div className="h-20 bg-gray-200 rounded-2xl mb-6"></div>
              <div className="flex gap-3">
                <div className="h-12 w-32 bg-gray-200 rounded-xl"></div>
                <div className="h-12 w-32 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
            
            <div className="border-t border-gray-200">
              <div className="h-16 bg-gray-100"></div>
            </div>
          </div>
          
          {/* Stories Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6 animate-pulse">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                <div className="aspect-[3/4] bg-gray-200"></div>
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded-xl w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded-xl w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-sm">
              <User className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">User Not Found</h3>
            <p className="text-gray-600 mb-6">The profile you're looking for doesn't exist or may have been removed.</p>
            <button
              onClick={() => navigate('/feed')}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-sm"
            >
              Discover Stories
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 lg:py-8">
        {/* Premium Modern Profile Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-6 sm:mb-8 backdrop-blur-lg">
          {/* Minimal Gradient Background */}
          <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 px-6 sm:px-8 lg:px-10 pt-8 sm:pt-12 pb-6">
            {/* Subtle Pattern Overlay */}
            <div className="absolute inset-0 opacity-5">
              <div className="w-full h-full" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat'
              }}></div>
            </div>

            {/* Profile Layout */}
            <div className="relative z-10">
              {/* Mobile Layout - Stacked */}
              <div className="block lg:hidden text-center">
                {/* Profile Picture */}
                <div className="relative inline-block mb-6">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-white shadow-lg border-4 border-white ring-4 ring-gray-100/80">
                    {(avatarPreview || user.profilePicture) ? (
                      <img
                        src={avatarPreview || user.profilePicture}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <span className="text-2xl font-bold text-gray-600">
                          {getInitials(user.username)}
                        </span>
                      </div>
                    )}
                  </div>
                  {isOwnProfile && (
                    <label className="absolute -bottom-1 -right-1 bg-gray-900 text-white p-3 rounded-xl shadow-lg hover:bg-gray-800 transition-all duration-200 cursor-pointer hover:scale-105">
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* User Info */}
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {user.username}
                    </h1>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 text-gray-400" />
                    <span>Storyteller • Dream Weaver • Word Wizard</span>
                  </p>
                </div>
              </div>

              {/* Desktop Layout - Side by Side */}
              <div className="hidden lg:flex items-start gap-8">
                {/* Profile Picture */}
                <div className="relative shrink-0">
                  <div className="w-32 h-32 xl:w-36 xl:h-36 rounded-2xl overflow-hidden bg-white shadow-lg border-4 border-white ring-4 ring-gray-100/80">
                    {(avatarPreview || user.profilePicture) ? (
                      <img
                        src={avatarPreview || user.profilePicture}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <span className="text-2xl xl:text-3xl font-bold text-gray-600">
                          {getInitials(user.username)}
                        </span>
                      </div>
                    )}
                  </div>
                  {isOwnProfile && (
                    <label className="absolute -bottom-1 -right-1 bg-gray-900 text-white p-3 rounded-xl shadow-lg hover:bg-gray-800 transition-all duration-200 cursor-pointer hover:scale-105">
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl xl:text-4xl font-bold text-gray-900">
                        {user.username}
                      </h1>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-base mb-6 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-gray-400" />
                    <span>Storyteller • Dream Weaver • Word Wizard</span>
                  </p>
                </div>
              </div>

              {/* Stats Section */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-8 mb-6">
                <div className="text-center group">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">{getUserStats().stories}</div>
                  <div className="text-gray-500 text-sm font-medium">Stories</div>
                </div>
                <button 
                  onClick={showFollowersList}
                  className="text-center hover:bg-gray-100 rounded-xl px-4 py-3 transition-all duration-200 hover:scale-105 group"
                >
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">{getUserStats().followers}</div>
                  <div className="text-gray-500 text-sm font-medium">Followers</div>
                </button>
                <button 
                  onClick={showFollowingList}
                  className="text-center hover:bg-gray-100 rounded-xl px-4 py-3 transition-all duration-200 hover:scale-105 group"
                >
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">{getUserStats().following}</div>
                  <div className="text-gray-500 text-sm font-medium">Following</div>
                </button>
              </div>

              {/* Bio Section */}
              <div className="bg-gray-50/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 border border-gray-100">
                <p className="text-gray-700 leading-relaxed">
                  {user.bio || (
                    isOwnProfile 
                      ? '📚 Share your story with the world... Ready to inspire readers everywhere! ✍️'
                      : '🌟 A mysterious storyteller awaits... Their tales are yet to be discovered.'
                  )}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                {!isOwnProfile && (
                  <button
                    onClick={handleFollow}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all text-sm shadow-sm ${
                      isFollowing
                        ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Users className="h-4 w-4" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
                
                {isOwnProfile && (
                  <>
                    <Link
                      to="/create-story"
                      className="flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all font-medium shadow-sm text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>New Story</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm shadow-sm"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t border-gray-200">
            <nav className="flex">
              <button
                onClick={() => handleTabChange('stories')}
                className={`flex-1 flex items-center justify-center gap-3 px-4 sm:px-6 py-4 sm:py-5 text-sm font-medium transition-all border-b-2 ${
                  activeTab === 'stories'
                    ? 'text-gray-900 border-gray-900 bg-gray-50'
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  activeTab === 'stories' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  <BookOpen className="h-4 w-4" />
                </div>
                <span className="hidden sm:inline">Stories</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                  {getUserStats().stories}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="mt-6 sm:mt-8">
          {renderTabContent()}
        </div>
      </div>

      {/* User Modal */}
      {userModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{userModal.title}</h3>
              <button
                onClick={() => setUserModal({ show: false, users: [], title: '' })}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {userModal.users.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No {userModal.title.toLowerCase()} yet</p>
                </div>
              ) : (
                userModal.users.map((user) => (
                  <Link
                    key={user.id}
                    to={`/profile/${user.id}`}
                    onClick={() => setUserModal({ show: false, users: [], title: '' })}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-all duration-200 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.username}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      ) : (
                        getInitials(user.username)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {user.username}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {user.bio ? user.bio.substring(0, 50) + (user.bio.length > 50 ? '...' : '') : 'No bio available'}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;