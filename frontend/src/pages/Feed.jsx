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
  Flame as Fire,
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
    
    // Socket.io for realtime updates (optional)
    let socket;
    try {
      socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
        timeout: 5000,
        forceNew: true
      });
      
      socket.on('connect', () => {
        console.log('Socket connected');
        socket.emit('join-feed', user?.id);
      });
      
      socket.on('newStory', (newStory) => {
        setStories(prev => [newStory, ...prev]);
      });

      socket.on('connect_error', (error) => {
        console.warn('Socket connection failed:', error);
        // Don't block the UI if socket fails
      });
    } catch (error) {
      console.warn('Socket initialization failed:', error);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  const fetchStories = async () => {
    try {
      // Fetch stories with basic endpoint first
      const response = await api.get('/stories');
      let fetchedStories = response.data;
      
      // Process stories with computed fields
      const processedStories = fetchedStories.map(story => {
        return {
          ...story,
          totalLikes: story.likes?.length || 0,
          // Only show rating if it exists, otherwise don't show rating section
          hasRating: !!(story.rating && story.rating > 0),
          rating: story.rating || 0,
          // Use real chapter count if available
          chapterCount: story.chapters?.length || 0,
          createdAtTimestamp: new Date(story.createdAt).getTime()
        };
      });
      
      setStories(processedStories);
      
      // Initialize liked stories state
      const userLikedStories = new Set();
      processedStories.forEach(story => {
        if (story.likes?.some(like => like._id === user?.id)) {
          userLikedStories.add(story._id);
        }
      });
      setLikedStories(userLikedStories);
      
      // Fetch comment counts in background after initial load (optional enhancement)
      fetchCommentCounts(processedStories);
      
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.error('Failed to load stories. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Background function to update comment counts without blocking initial load
  const fetchCommentCounts = async (stories) => {
    try {
      const updatedStories = await Promise.all(
        stories.map(async (story) => {
          try {
            // Try to get more accurate comment count
            const commentsResponse = await api.get(`/stories/${story._id}/comments`);
            return {
              ...story,
              totalComments: commentsResponse.data?.length || story.totalComments
            };
          } catch (error) {
            // Keep existing comment count if API call fails
            return story;
          }
        })
      );
      
      // Update stories with new comment counts
      setStories(updatedStories);
    } catch (error) {
      console.log('Background comment count update failed:', error);
      // Silent fail - don't disrupt user experience
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
      const bookmarkIds = response.data
        .filter(bookmark => bookmark.story && bookmark.story._id)
        .map(bookmark => bookmark.story._id);
      setBookmarkedStories(new Set(bookmarkIds));
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      // Set empty bookmarks on error
      setBookmarkedStories(new Set());
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
      
      // Update stories with new like count and computed fields
      setStories(prevStories => prevStories.map(story => 
        story._id === storyId 
          ? {
              ...story,
              likes: response.data.liked 
                ? [...(story.likes || []), { _id: user.id }]
                : (story.likes || []).filter(like => like._id !== user.id),
              totalLikes: response.data.liked 
                ? (story.totalLikes || 0) + 1
                : Math.max((story.totalLikes || 0) - 1, 0)
            }
          : story
      ));
      
      // Show feedback
      if (response.data.liked) {
        toast.success('❤️ Liked!');
      } else {
        toast.success('Like removed');
      }
    } catch (error) {
      console.error('Like error:', error);
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
      toast.error('Failed to follow/unfollow user');
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

  // Filter and sort stories
  const getFilteredAndSortedStories = () => {
    let filtered = stories;

    // Filter by genre
    if (selectedGenre !== 'All') {
      filtered = filtered.filter(story => 
        story.category === selectedGenre
      );
    }

    // Sort stories
    const sortedStories = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          // Sort by likes, then views, then rating
          return (b.totalLikes + b.totalViews * 0.1) - (a.totalLikes + a.totalViews * 0.1);
        case 'recent':
          // Sort by creation date
          return b.createdAtTimestamp - a.createdAtTimestamp;
        case 'trending':
          // Sort by recent activity (likes) with recency boost
          const aScore = a.totalLikes * (Date.now() - a.createdAtTimestamp < 7 * 24 * 60 * 60 * 1000 ? 2 : 1);
          const bScore = b.totalLikes * (Date.now() - b.createdAtTimestamp < 7 * 24 * 60 * 60 * 1000 ? 2 : 1);
          return bScore - aScore;
        default:
          return 0;
      }
    });

    return sortedStories;
  };

  const filteredStories = getFilteredAndSortedStories();

  const handleCommentClick = (story, e) => {
    e.stopPropagation();
    // Navigate to story detail page, same as clicking the story card
    navigate(`/story/${story._id}`);
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="animate-pulse">
            <div className="h-8 sm:h-10 bg-gray-200 rounded-lg w-1/2 sm:w-1/3 mb-6 sm:mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <div className="aspect-[3/4] bg-gray-200 animate-pulse"></div>
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                      </div>
                      <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Minimal Premium Hero Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="text-center">
            {/* Rich Heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 leading-tight mb-6">
              <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Discover
              </span>
              <br />
              Stories
            </h1>
            
            {/* Clean Description */}
            <div className="max-w-2xl mx-auto mb-8">
              <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed mb-4">
                Where millions of readers find their next favorite story
              </p>
              <div className="flex items-center justify-center space-x-6 text-gray-500">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium">Read</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium">Connect</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium">Create</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Genre Filter Tabs - Responsive */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Browse by Genre</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-medium text-sm sm:text-base self-start sm:self-auto"
            >
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Filters</span>
            </button>
          </div>
          
          <div className="flex overflow-x-auto pb-4 space-x-3 sm:space-x-3 scrollbar-thin scrollbar-thumb-orange-300 px-1">
            {genres.map((genre) => {
              const getGenreIcon = () => {
                switch(genre) {
                  case 'Romance': return <Heart className="h-4 w-4" />;
                  case 'Fantasy': return <Sparkles className="h-4 w-4" />;
                  case 'Mystery': return <Search className="h-4 w-4" />;
                  case 'Horror': return <Eye className="h-4 w-4" />;
                  case 'Science Fiction': return <Star className="h-4 w-4" />;
                  case 'Adventure': return <TrendingUp className="h-4 w-4" />;
                  case 'Thriller': return <Fire className="h-4 w-4" />;
                  case 'Young Adult': return <Users className="h-4 w-4" />;
                  case 'All': return <BookOpen className="h-4 w-4" />;
                  default: return <BookOpen className="h-4 w-4" />;
                }
              };
              
              const genreStoryCount = genre === 'All' 
                ? stories.length 
                : stories.filter(story => story.category === genre).length;

              return (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`flex items-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-sm whitespace-nowrap transition-all ${
                    selectedGenre === genre
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                      : 'bg-white/80 text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-orange-200'
                  }`}
                >
                  <span className="h-4 w-4 sm:h-4 sm:w-4">{getGenreIcon()}</span>
                  <span>{genre}</span>
                  <span className="text-xs opacity-75 hidden sm:inline">({genreStoryCount})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort Options - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <span className="text-gray-700 font-medium text-sm sm:text-base">Sort by:</span>
            <div className="flex bg-white/80 rounded-xl border border-orange-200 p-1 w-fit">
              {['popular', 'recent', 'trending'].map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium capitalize transition-all flex items-center space-x-2 whitespace-nowrap text-sm ${
                    sortBy === option
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  {option === 'popular' && <Crown className="h-4 w-4" />}
                  {option === 'trending' && <Fire className="h-4 w-4" />}
                  {option === 'recent' && <Clock className="h-4 w-4" />}
                  <span>{option}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 justify-center sm:justify-end">
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{filteredStories.length} stories found</span>
          </div>
        </div>

        {/* Filter Summary - Responsive */}
        {selectedGenre !== 'All' && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-orange-50 border border-orange-200 rounded-xl sm:rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-orange-700">
                <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="break-words">
                  Filtered by: {selectedGenre}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedGenre('All');
                }}
                className="text-xs sm:text-sm text-orange-600 hover:text-orange-800 font-medium self-start sm:self-auto"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}

        {/* Premium Stories Grid - Wattpad Style */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
          {filteredStories.length > 0 ? (
            filteredStories.map((story) => (
              <div 
                key={story._id} 
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-orange-200"
                onClick={() => navigate(`/story/${story._id}`)}
              >
                {/* Premium Story Cover - Compact */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  {story.coverImage ? (
                    <img
                      src={story.coverImage}
                      alt={story.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-100 via-amber-50 to-red-50 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-orange-400" />
                    </div>
                  )}
                  
                  {/* Premium Bookmark - Always Visible */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookmark(story._id, e);
                    }}
                    className={`absolute top-2 right-2 p-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
                      isBookmarked(story._id) 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-white/90 text-gray-600 hover:bg-orange-500 hover:text-white'
                    }`}
                  >
                    <Bookmark className={`h-4 w-4 ${isBookmarked(story._id) ? 'fill-current' : ''}`} />
                  </button>

                  {/* Premium Category Badge */}
                  {story.category && (
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-black/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                        {story.category}
                      </span>
                    </div>
                  )}

                  {/* Stats Overlay - Top Left */}
                  {(story.hasRating || story.totalLikes > 0) && (
                    <div className="absolute top-2 left-2 flex flex-col space-y-1">
                      {story.hasRating && (
                        <div className="flex items-center space-x-1 bg-black/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
                          <Star className="h-3 w-3 fill-current text-yellow-400" />
                          <span className="text-xs font-medium">{story.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Compact Story Info */}
                <div className="p-3">
                  <h3 className="font-bold text-sm text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors">
                    {story.title}
                  </h3>

                  {/* Author & Stats Row */}
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-2 group/author cursor-pointer flex-1 min-w-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${story.author._id}`);
                      }}
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
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
                      <p className="font-medium text-xs text-gray-700 truncate group-hover/author:text-orange-600 transition-colors">
                        {story.author.username}
                      </p>
                    </div>

                    {/* Like Button */}
                    <button
                      onClick={(e) => handleLike(story._id, e)}
                      className={`flex items-center space-x-1 p-1 rounded-full transition-all hover:scale-110 shrink-0 ${
                        isLiked(story) 
                          ? 'text-red-600' 
                          : 'text-gray-400 hover:text-red-600'
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${isLiked(story) ? 'fill-current' : ''}`} />
                      <span className="text-xs font-medium">{story.totalLikes || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 sm:py-16 lg:py-24 bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-orange-100/50 mx-3 sm:mx-0">
              <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-orange-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 px-4">
                {selectedGenre !== 'All' 
                  ? `No stories found in ${selectedGenre}`
                  : 'No stories found'
                }
              </h3>
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base px-4">
                {selectedGenre !== 'All' 
                  ? 'Try browsing different genres.'
                  : 'Be the first to share your story with the community!'
                }
              </p>
              
              {selectedGenre !== 'All' ? (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
                  <button
                    onClick={() => {
                      setSelectedGenre('All');
                    }}
                    className="inline-flex items-center space-x-2 bg-gray-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl hover:bg-gray-600 transition-all shadow-lg font-semibold text-sm sm:text-base w-full sm:w-auto"
                  >
                    <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Clear Filters</span>
                  </button>
                  <Link 
                    to="/create-story"
                    className="inline-flex items-center space-x-2 bg-linear-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-2xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg font-semibold"
                  >
                    <BookOpen className="h-5 w-5" />
                    <span>Create Story</span>
                  </Link>
                </div>
              ) : (
                <Link 
                  to="/create-story"
                  className="inline-flex items-center space-x-2 bg-linear-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-2xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg font-semibold"
                >
                  <BookOpen className="h-5 w-5" />
                  <span>Create Your First Story</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Feed;