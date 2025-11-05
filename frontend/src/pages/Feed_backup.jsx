import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share2,
  User,
  Clock,
  Eye,
  Star,
  TrendingUp,
  Filter,
  Search,
  BookOpen,
  Users,
  Fire,
  Crown,
  Sparkles
} from 'lucide-react';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../utils/api';

const Feed = () => {
  const [stories, setStories] = useState([]);
  const [featuredStories, setFeaturedStories] = useState([]);
  const [trendingStories, setTrendingStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('popular'); // 'popular', 'recent', 'trending'
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [followedUsers, setFollowedUsers] = useState(new Set());
  const [bookmarkedStories, setBookmarkedStories] = useState(new Set());
  const [likedStories, setLikedStories] = useState(new Set());
  const { user } = useAuth();
  const navigate = useNavigate();

  const genres = [
    'All', 'Romance', 'Fantasy', 'Mystery', 'Horror', 'Science Fiction', 
    'Adventure', 'Drama', 'Comedy', 'Thriller', 'Young Adult', 'Historical Fiction',
    'Poetry', 'Non-Fiction', 'Paranormal', 'Contemporary', 'Action'
  ];

  useEffect(() => {
    fetchStories();
    fetchFollowedUsers();
    fetchBookmarkedStories();
    
    // Socket.io for realtime updates
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001');
    socket.emit('join-feed', user?.id);
    
    socket.on('newStory', (newStory) => {
      setStories(prev => [newStory, ...prev]);
    });

    return () => socket.disconnect();
  }, [user]);

  const fetchStories = async () => {
    try {
      const response = await api.get('/stories');
      setStories(response.data);
      
      // Initialize liked stories state
      const userLikedStories = new Set();
      response.data.forEach(story => {
        if (story.likes?.some(like => like._id === user?.id)) {
          userLikedStories.add(story._id);
        }
      });
      setLikedStories(userLikedStories);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowedUsers = async () => {
    try {
      const response = await api.get('/users/following');
      setFollowedUsers(new Set(response.data.map(u => u._id)));
    } catch (error) {
      console.error('Error fetching followed users:', error);
    }
  };

  const fetchBookmarkedStories = async () => {
    try {
      const response = await api.get('/bookmarks');
      setBookmarkedStories(new Set(response.data.map(bookmark => bookmark.story._id)));
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const handleLike = async (storyId, e) => {
    e.stopPropagation();
    try {
      const response = await api.post(`/stories/${storyId}/like`);
      
      // Update liked stories state
      if (response.data.liked) {
        setLikedStories(prev => new Set([...prev, storyId]));
      } else {
        setLikedStories(prev => {
          const newSet = new Set(prev);
          newSet.delete(storyId);
          return newSet;
        });
      }
      
      // Update stories with new like count
      setStories(stories.map(story => 
        story._id === storyId 
          ? {
              ...story,
              likes: response.data.liked 
                ? [...story.likes, { _id: user.id }]
                : story.likes.filter(like => like._id !== user.id)
            }
          : story
      ));
    } catch (error) {
      toast.error('Failed to like story');
    }
  };

  const handleBookmark = async (storyId, e) => {
    e.stopPropagation();
    try {
      const response = await api.post(`/bookmarks/${storyId}`);
      
      if (response.data.bookmarked) {
        setBookmarkedStories(prev => new Set([...prev, storyId]));
        toast.success('Story bookmarked!');
      } else {
        setBookmarkedStories(prev => {
          const newSet = new Set(prev);
          newSet.delete(storyId);
          return newSet;
        });
        toast.success('Bookmark removed!');
      }
    } catch (error) {
      toast.error('Failed to bookmark story');
    }
  };

  const handleFollow = async (userId, e) => {
    e.stopPropagation();
    try {
      const response = await api.post(`/users/${userId}/follow`);
      if (response.data.following) {
        setFollowedUsers(prev => new Set([...prev, userId]));
        toast.success('User followed!');
      } else {
        setFollowedUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        toast.success('User unfollowed!');
      }
    } catch (error) {
      toast.error('Failed to follow user');
    }
  };

  const openCommentModal = async (story, e) => {
    e.stopPropagation();
    setSelectedStory(story);
    setShowCommentModal(true);
    
    try {
      const response = await api.get(`/story-comments/${story._id}`);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await api.post(`/story-comments/${selectedStory._id}`, {
        text: newComment
      });
      setComments([response.data, ...comments]);
      setNewComment('');
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const isLiked = (story) => {
    return likedStories.has(story._id);
  };

  const isFollowing = (userId) => {
    return followedUsers.has(userId);
  };

  const isBookmarked = (storyId) => {
    return bookmarkedStories.has(storyId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex space-x-4">
                  <div className="w-24 h-32 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10"></div>
        <div className="relative max-w-7xl mx-auto py-16 px-4">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-6">
              Discover Stories
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Explore millions of stories from talented writers around the world
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for stories, authors, or genres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-orange-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/80 backdrop-blur-sm shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Genre Filter Tabs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Browse by Genre</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>
          
          <div className="flex overflow-x-auto pb-4 space-x-3 scrollbar-thin scrollbar-thumb-orange-300">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all ${
                  selectedGenre === genre
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                    : 'bg-white/80 text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-orange-200'
                }`}
              >
                {genre === 'Romance' && <Heart className="h-4 w-4" />}
                {genre === 'Fantasy' && <Sparkles className="h-4 w-4" />}
                {genre === 'Trending' && <TrendingUp className="h-4 w-4" />}
                {genre === 'Popular' && <Fire className="h-4 w-4" />}
                <span>{genre}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">Sort by:</span>
            <div className="flex bg-white/80 rounded-xl border border-orange-200 p-1">
              {['popular', 'recent', 'trending'].map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                    sortBy === option
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-orange-600'
                  }`}
                >
                  {option === 'popular' && <Crown className="h-4 w-4 inline mr-2" />}
                  {option === 'trending' && <Fire className="h-4 w-4 inline mr-2" />}
                  {option}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <BookOpen className="h-4 w-4" />
            <span>{stories.length} stories found</span>
          </div>
        </div>

        {/* Stories Grid - Wattpad Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stories.length > 0 ? (
            stories.map((story) => (
              <div 
                key={story._id} 
                className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100/50 overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/story/${story._id}`)}
              >
                {/* Story Cover */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  {story.coverImage ? (
                    <img
                      src={story.coverImage}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-200 via-amber-200 to-yellow-200 flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-orange-400" />
                    </div>
                  )}
                  
                  {/* Overlay with stats */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between text-white text-sm">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>{story.views || Math.floor(Math.random() * 10000)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className={`h-4 w-4 ${isLiked(story) ? 'fill-current text-red-400' : ''}`} />
                            <span>{story.likes?.length || 0}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookmark(story._id, e);
                          }}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                        >
                          <Bookmark className={`h-4 w-4 ${isBookmarked(story._id) ? 'fill-current text-orange-400' : 'text-white'}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Genre Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                      {story.category}
                    </span>
                  </div>

                  {/* Trending Badge */}
                  {Math.random() > 0.7 && (
                    <div className="absolute top-3 right-3">
                      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full flex items-center space-x-1 text-xs font-bold shadow-lg">
                        <Fire className="h-3 w-3" />
                        <span>HOT</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Story Info */}
                <div className="p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                    {story.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {story.description}
                  </p>

                  {/* Author Info */}
                  <div 
                    className="flex items-center space-x-3 mb-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${story.author._id}`);
                    }}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {story.author.profilePicture ? (
                        <img 
                          src={story.author.profilePicture} 
                          alt={story.author.username}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        story.author.username?.[0]?.toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm hover:text-orange-600 transition-colors">
                        {story.author.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(story.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Story Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-current text-yellow-400" />
                        <span>{(Math.random() * 2 + 3).toFixed(1)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{Math.floor(Math.random() * 500)}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      {Math.floor(Math.random() * 50 + 1)} chapters
                    </div>
                  </div>
                </div>
              </div>
            ))

                  {/* Story Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={(e) => handleLike(story._id, e)}
                        className={`flex items-center space-x-1 transition-colors ${
                          isLiked(story)
                            ? 'text-red-500'
                            : 'text-gray-500 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`h-5 w-5 ${isLiked(story) ? 'fill-current' : ''}`} />
                        <span className="text-sm font-medium">{story.likes?.length || 0}</span>
                      </button>
                      
                      <button
                        onClick={(e) => openCommentModal(story, e)}
                        className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Comment</span>
                      </button>
                      
                      <button
                        onClick={(e) => handleBookmark(story._id, e)}
                        className={`flex items-center space-x-1 transition-colors ${
                          isBookmarked(story._id)
                            ? 'text-pink-500'
                            : 'text-gray-500 hover:text-pink-500'
                        }`}
                      >
                        <Bookmark className={`h-5 w-5 ${isBookmarked(story._id) ? 'fill-current' : ''}`} />
                        <span className="text-sm font-medium">
                          {isBookmarked(story._id) ? 'Saved' : 'Save'}
                        </span>
                      </button>
                    </div>


                  </div>

                  {/* Tags */}
                  {story.tags && story.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {story.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-pink-100 text-pink-600 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                      {story.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                          +{story.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-pink-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No stories yet</h3>
                <p className="text-gray-600 mb-4">Start following writers or create your own story!</p>
                <Link
                  to="/create-story"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-full font-medium hover:from-pink-600 hover:to-rose-600 transition-all"
                >
                  <span>Create Story</span>
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Comment Modal */}
      {showCommentModal && selectedStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
              <button
                onClick={() => setShowCommentModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Comments List */}
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment._id} className="flex space-x-3">
                      <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-pink-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm">
                            {comment.user?.username || 'Anonymous'}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">{comment.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Add Comment */}
            <form onSubmit={handleAddComment} className="p-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-pink-600" />
                </div>
                <div className="flex-1 flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full hover:from-pink-600 hover:to-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;