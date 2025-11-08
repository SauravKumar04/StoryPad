import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle,
  Bookmark, 
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
import api, { searchUsers } from '../utils/api';

const Feed = () => {
  // ==================== STATE MANAGEMENT ====================
  
  // Must Watch section state
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Browse by Genre section state - separate state for ALL stories
  const [allStories, setAllStories] = useState([]);
  const [allStoriesLoading, setAllStoriesLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('popular'); // 'popular', 'recent', 'trending'
  const [showFilters, setShowFilters] = useState(false);
  const [browseRowsShown, setBrowseRowsShown] = useState(1);
  
  // User interaction state
  const [followedUsers, setFollowedUsers] = useState(new Set());
  const [bookmarkedStories, setBookmarkedStories] = useState(new Set());
  const [likedStories, setLikedStories] = useState(new Set());
  
  // User search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Story search state
  const [storySearchQuery, setStorySearchQuery] = useState('');
  const [storySearchResults, setStorySearchResults] = useState([]);
  const [storySearchLoading, setStorySearchLoading] = useState(false);
  const [showStorySearchResults, setShowStorySearchResults] = useState(false);

  // Responsive grid state
  const [storiesPerRow, setStoriesPerRow] = useState(2);

  // ==================== HOOKS & CONSTANTS ====================
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const genres = [
    'All', 'Romance', 'Fantasy', 'Mystery', 'Horror', 'Science Fiction', 
    'Adventure', 'Drama', 'Comedy', 'Thriller', 'Young Adult', 'Historical Fiction',
    'Poetry', 'Non-Fiction', 'Paranormal', 'Contemporary', 'Action'
  ];

  // ==================== EFFECTS ====================
  
  // Handle responsive grid calculations
  useEffect(() => {
    const updateStoriesPerRow = () => {
      const newStoriesPerRow = calculateStoriesPerRow();
      const previousStoriesPerRow = storiesPerRow;
      setStoriesPerRow(newStoriesPerRow);
      // Reset browse rows to 1 when screen size changes to ensure complete rows
      setBrowseRowsShown(1);
      

    };

    // Set initial value
    updateStoriesPerRow();

    // Add resize listener
    window.addEventListener('resize', updateStoriesPerRow);

    // Cleanup
    return () => window.removeEventListener('resize', updateStoriesPerRow);
  }, []);

  // Refetch Must Watch stories when screen size category changes
  useEffect(() => {
    if (storiesPerRow !== 2) { // Skip initial render
      fetchMustWatchStories();
    }
  }, [storiesPerRow]);

  useEffect(() => {
    fetchMustWatchStories();
    fetchAllStoriesForBrowse();
    fetchFollowedUsers();
    fetchBookmarkedStories();
    
    // Socket.io for realtime updates (optional)
    let socket;
    try {
      const socketUrl = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace('/api', '') 
        : 'http://localhost:3001';
      socket = io(socketUrl, {
        timeout: 5000,
        forceNew: true
      });
      
      socket.on('connect', () => {
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

  // ==================== UTILITY FUNCTIONS ====================
  
  // Function to calculate stories per row based on screen size
  const calculateStoriesPerRow = () => {
    // This mirrors the grid system: grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6
    if (window.innerWidth >= 1536) return 6; // 2xl
    if (window.innerWidth >= 1280) return 5; // xl
    if (window.innerWidth >= 1024) return 4; // lg
    if (window.innerWidth >= 768) return 3;  // md
    return 2; // default (sm and below)
  };

  // Load more rows for browse by genre section
  const loadMoreBrowseRows = () => {
    setBrowseRowsShown(prev => prev + 1);
  };

  // ==================== DATA FETCHING FUNCTIONS ====================
  
  const fetchMustWatchStories = async () => {
    try {
      // Calculate stories needed for Must Watch section:
      // Mobile/Tablet (≤3 cols): 2 complete rows = 4 stories
      // Desktop+ (4+ cols): 1 complete row = storiesPerRow stories  
      const isMobile = storiesPerRow <= 3; 
      const limit = isMobile ? 4 : storiesPerRow;
      
      const response = await api.get(`/stories/must-watch?limit=${limit}`);
      const { stories: fetchedStories } = response.data;
      
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
      
      // Set the Must Watch stories
      setStories(processedStories);
      
      // Initialize liked stories state
      const userLikedStories = new Set();
      processedStories.forEach(story => {
        if (story.likes?.some(like => like._id === user?.id)) {
          userLikedStories.add(story._id);
        }
      });
      setLikedStories(userLikedStories);
      
    } catch (error) {
      console.error('Error fetching must watch stories:', error);
      toast.error('Failed to load stories. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch ALL stories for Browse by Genre section
  const fetchAllStoriesForBrowse = async () => {
    try {
      setAllStoriesLoading(true);
      
      // Fetch all stories without pagination limit
      const response = await api.get('/stories?limit=1000'); // Get all stories
      const { stories: fetchedStories } = response.data;
      
      // Process stories with computed fields
      const processedStories = fetchedStories.map(story => ({
        ...story,
        totalLikes: story.likes?.length || 0,
        hasRating: !!(story.rating && story.rating > 0),
        rating: story.rating || 0,
        chapterCount: story.chapters?.length || 0,
        createdAtTimestamp: new Date(story.createdAt).getTime()
      }));
      
      setAllStories(processedStories);
      
    } catch (error) {
      console.error('Error fetching all stories for browse:', error);
    } finally {
      setAllStoriesLoading(false);
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
        .filter(bookmark => bookmark && bookmark.story && bookmark.story._id)
        .map(bookmark => bookmark.story._id);
      setBookmarkedStories(new Set(bookmarkIds));
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      // Set empty bookmarks on error
      setBookmarkedStories(new Set());
    }
  };

  // ==================== EVENT HANDLERS ====================
  
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
    let filtered = allStories; // Use allStories instead of stories

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

  // Search functionality
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    if (query.trim().length < 2) {
      return; // Don't search for single characters
    }

    setSearchLoading(true);
    try {
      const results = await searchUsers(query);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const handleSearchFocus = () => {
    if (searchResults.length > 0) {
      setShowSearchResults(true);
    }
  };

  const handleSearchBlur = () => {
    // Delay hiding to allow click events on results
    setTimeout(() => {
      setShowSearchResults(false);
    }, 200);
  };

  // Story search functionality
  const handleStorySearchChange = async (e) => {
    const query = e.target.value;
    setStorySearchQuery(query);

    if (query.trim().length === 0) {
      setStorySearchResults([]);
      setShowStorySearchResults(false);
      return;
    }

    if (query.trim().length < 2) {
      return; // Wait for at least 2 characters
    }

    setStorySearchLoading(true);
    try {
      // Search through all stories by title, description, and tags
      const filteredStories = allStories.filter(story => {
        const searchTerm = query.toLowerCase();
        const matchesTitle = story.title.toLowerCase().includes(searchTerm);
        const matchesDescription = story.description?.toLowerCase().includes(searchTerm);
        const matchesTags = story.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
        const matchesCategory = story.category?.toLowerCase().includes(searchTerm);
        
        return matchesTitle || matchesDescription || matchesTags || matchesCategory;
      });

      setStorySearchResults(filteredStories.slice(0, 8)); // Limit to 8 results
      setShowStorySearchResults(true);
    } catch (error) {
      console.error('Story search error:', error);
    } finally {
      setStorySearchLoading(false);
    }
  };

  const handleStoryClick = (storyId) => {
    navigate(`/story/${storyId}`);
    setShowStorySearchResults(false);
    setStorySearchQuery('');
  };

  const handleStorySearchFocus = () => {
    if (storySearchResults.length > 0) {
      setShowStorySearchResults(true);
    }
  };

  const handleStorySearchBlur = () => {
    // Delay hiding to allow click events on results
    setTimeout(() => {
      setShowStorySearchResults(false);
    }, 200);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        {/* Hero Section Skeleton */}
        <div className="bg-linear-to-br from-white via-orange-50/30 to-amber-50/40 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
            <div className="text-center animate-pulse">
              <div className="h-16 sm:h-20 md:h-24 bg-gray-200 rounded-lg mx-auto mb-4 w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded-lg mx-auto mb-6 w-1/2"></div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          {/* Must Watch Section Skeleton */}
          <div className="mb-8">
            <div className="bg-linear-to-br from-white to-amber-50/30 rounded-2xl p-5 border border-amber-200/30 shadow-xl mb-6 ring-1 ring-amber-100/50 animate-pulse">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                <div>
                  <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-xl overflow-hidden">
                    <div className="aspect-3/4 bg-gray-200"></div>
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Browse by Genre Section Skeleton */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg animate-pulse">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                <div>
                  <div className="h-6 bg-gray-200 rounded w-36 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-52"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-xl overflow-hidden">
                    <div className="aspect-3/4 bg-gray-200"></div>
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Compact Enhanced Hero Section */}
      <div className="bg-linear-to-br from-white via-orange-50/30 to-amber-50/40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 relative">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-20 w-24 h-24 bg-orange-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-20 w-32 h-32 bg-amber-500 rounded-full blur-3xl"></div>
          </div>
          
          <div className="text-center relative z-10">
            {/* Compact Rich Heading */}
            <div className="mb-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-tight mb-2">
                <span className="bg-linear-to-r from-orange-600 via-orange-500 to-amber-600 bg-clip-text text-transparent drop-shadow-sm">
                  Discover
                </span>
                <br />
                <span className="text-gray-800">Stories</span>
              </h1>
              <div className="w-20 h-0.5 bg-linear-to-r from-orange-500 to-amber-500 rounded-full mx-auto mt-2 opacity-80"></div>
            </div>
            
            {/* Compact Description */}
            <div className="max-w-2xl mx-auto mb-6">
              <p className="text-lg sm:text-xl text-gray-700 leading-relaxed mb-4 font-light">
                Where millions of readers find their next favorite story
              </p>
              
              {/* Compact Feature Icons */}
              <div className="flex items-center justify-center gap-6 sm:gap-8 text-gray-600 mb-6">
                <div className="flex items-center space-x-1.5 group">
                  <div className="p-2 rounded-full bg-orange-100 group-hover:bg-orange-200 transition-colors duration-200">
                    <BookOpen className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-xs font-semibold">Read</span>
                </div>
                <div className="flex items-center space-x-1.5 group">
                  <div className="p-2 rounded-full bg-amber-100 group-hover:bg-amber-200 transition-colors duration-200">
                    <Users className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-xs font-semibold">Connect</span>
                </div>
                <div className="flex items-center space-x-1.5 group">
                  <div className="p-2 rounded-full bg-orange-100 group-hover:bg-orange-200 transition-colors duration-200">
                    <Star className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-xs font-semibold">Create</span>
                </div>
              </div>
              
              {/* Enhanced Beautiful Search Component */}
              <div className="relative max-w-md mx-auto">
                <div className="relative group">
                  {/* Search Icon */}
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                    <div className="p-1 rounded-full bg-linear-to-r from-orange-100 to-amber-100 transition-all duration-300">
                      <Search className="h-4 w-4 text-orange-600 transition-colors" />
                    </div>
                  </div>
                  
                  {/* Main Search Input */}
                  <input
                    type="text"
                    placeholder="Discover amazing authors..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    className="w-full pl-14 pr-12 py-4 text-base font-medium border-2 border-gray-200/80 rounded-2xl focus:border-gray-300 focus:ring-2 focus:ring-gray-100 focus:outline-none bg-linear-to-r from-white via-orange-50/30 to-amber-50/30 backdrop-blur-sm shadow-lg hover:shadow-xl focus:shadow-xl transition-all duration-300 placeholder:text-gray-500 placeholder:font-normal hover:border-gray-300"
                  />
                  
                  {/* Loading Spinner */}
                  {searchLoading && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-200 border-t-orange-500"></div>
                        <div className="absolute inset-0 rounded-full bg-linear-to-r from-orange-100 to-amber-100 opacity-30"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Search Enhancement Badge */}
                  {!searchQuery && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="flex items-center space-x-1 text-xs text-gray-400 bg-gray-100/80 px-2 py-1 rounded-full">
                        <Users className="h-3 w-3" />
                        <span>Find</span>
                      </div>
                    </div>
                  )}
                  

                </div>

                {/* Compact Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm border border-orange-100 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                    {searchResults.length === 0 && !searchLoading ? (
                      <div className="p-4 text-gray-500 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">No authors found</p>
                      </div>
                    ) : (
                      <div className="p-1">
                        {searchResults.map((author, index) => (
                          <button
                            key={author._id}
                            onClick={() => handleUserClick(author._id)}
                            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-orange-50/80 transition-all duration-200 border-b border-gray-50 last:border-b-0 text-left group"
                          >
                            <div className="shrink-0 relative">
                              {author.profilePicture ? (
                                <img 
                                  src={author.profilePicture} 
                                  alt={author.username}
                                  className="h-10 w-10 rounded-full object-cover ring-1 ring-orange-100 group-hover:ring-orange-200 transition-all"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-linear-to-r from-orange-400 to-amber-400 flex items-center justify-center ring-1 ring-orange-100 group-hover:ring-orange-200 transition-all">
                                  <User className="h-5 w-5 text-white" />
                                </div>
                              )}
                              {/* Online indicator for top authors */}
                              {index < 3 && (
                                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <h4 className="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors text-sm">@{author.username}</h4>
                                {author.followersCount > 100 && (
                                  <Star className="h-3 w-3 text-amber-400 fill-current" />
                                )}
                              </div>
                              {author.bio && (
                                <p className="text-xs text-gray-600 truncate mt-0.5 group-hover:text-gray-700">{author.bio}</p>
                              )}
                              <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                                <span>{author.followersCount} followers</span>
                                <span>•</span>
                                <span>{author.followingCount} following</span>
                              </div>
                            </div>
                            <div className="shrink-0">
                              <div className="w-6 h-6 rounded-full bg-orange-100 group-hover:bg-orange-200 flex items-center justify-center transition-colors">
                                <Crown className="h-3 w-3 text-orange-600" />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Must Watch Section */}
        <div className="mb-8">
          <div className="bg-linear-to-br from-white to-amber-50/30 rounded-2xl p-5 border border-amber-200/30 shadow-xl mb-6 ring-1 ring-amber-100/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-linear-to-br from-amber-400 via-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Crown className="h-5 w-5 text-white fill-current" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Must Watch</h2>
                  <p className="text-sm text-gray-600">Curated stories that captivated our community</p>
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="bg-linear-to-r from-amber-50 to-orange-50 text-amber-700 px-3 py-1.5 rounded-full font-semibold text-xs border border-amber-200/50 flex items-center gap-1.5 shadow-sm">
                  <Crown className="h-3.5 w-3.5 text-amber-600 fill-current" />
                  <span>Premium</span>
                </div>
              </div>
            </div>

            {/* Stories Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6 mb-6">
              {stories.map((story) => (
                <Link
                  key={story._id}
                  to={`/story/${story._id}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-amber-200/50 hover:border-amber-300 ring-1 ring-amber-100/50"
                >
                  {/* Story Cover */}
                  <div className="relative aspect-3/4 overflow-hidden bg-linear-to-br from-orange-50 to-amber-50">
                    {story.coverImage ? (
                      <img 
                        src={story.coverImage}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-orange-100 via-amber-50 to-orange-200 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-orange-400" />
                      </div>
                    )}
                    
                    {/* Premium Badge */}
                    <div className="absolute top-2 left-2">
                      <div className="bg-white/95 backdrop-blur-sm text-gray-800 px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg border border-white/50 flex items-center gap-1.5">
                        <Crown className="h-3 w-3 text-amber-500 fill-current" />
                        <span>Featured</span>
                      </div>
                    </div>
                    
                    {/* Stats Overlay */}
                    <div className="absolute bottom-2 right-2 bg-amber-900/80 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg">
                      <div className="flex items-center space-x-2 text-white text-xs">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{story.reads || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="h-3 w-3" />
                          <span>{story.totalLikes || 0}</span>
                        </div>
                        {story.commentsCount > 0 && (
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-3 w-3" />
                            <span>{story.commentsCount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Story Info */}
                  <div className="p-3 space-y-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-amber-700 transition-colors">
                        {story.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>


          </div>
        </div>

        {/* Story Search Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                <Search className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Discover Stories</h2>
                <p className="text-sm text-gray-600">Search by title, genre, or keywords</p>
              </div>
            </div>

            {/* Story Search Input */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for stories..."
                  value={storySearchQuery}
                  onChange={handleStorySearchChange}
                  onFocus={handleStorySearchFocus}
                  onBlur={handleStorySearchBlur}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 placeholder-gray-500 font-medium transition-all"
                />
                {storySearchLoading && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Story Search Results Dropdown */}
              {showStorySearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                  {storySearchResults.length === 0 && !storySearchLoading ? (
                    <div className="p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">No stories found</p>
                      <p className="text-xs text-gray-500 mt-1">Try different keywords</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {storySearchResults.map((story) => (
                        <button
                          key={story._id}
                          onClick={() => handleStoryClick(story._id)}
                          className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-orange-50 transition-all duration-200 border-b border-gray-50 last:border-b-0 text-left group"
                        >
                          <div className="shrink-0 relative">
                            {story.coverImage ? (
                              <img 
                                src={story.coverImage} 
                                alt={story.title}
                                className="h-12 w-9 rounded-lg object-cover ring-1 ring-gray-200 group-hover:ring-orange-200 transition-all"
                              />
                            ) : (
                              <div className="h-12 w-9 rounded-lg bg-linear-to-br from-orange-400 to-amber-400 flex items-center justify-center ring-1 ring-gray-200 group-hover:ring-orange-200 transition-all">
                                <BookOpen className="h-5 w-5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors text-sm">
                                {story.title}
                              </h4>
                              {story.status === 'Completed' && (
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-lg text-xs font-medium">
                                  Complete
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <span className="font-medium">by {story.author?.username}</span>
                              <span>•</span>
                              <span>{story.category}</span>
                              <span>•</span>
                              <span>{story.reads || 0} reads</span>
                            </div>
                            {story.description && (
                              <p className="text-xs text-gray-600 truncate mt-1">{story.description}</p>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center space-x-1">
                            <Heart className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-500">{story.likes?.length || 0}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>



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
                ? allStories.length 
                : allStories.filter(story => story.category === genre).length;

              return (
                <button
                  key={genre}
                  onClick={() => {
                    setSelectedGenre(genre);
                    setBrowseRowsShown(1); // Reset to show only first row when changing genre
                  }}
                  className={`flex items-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-sm whitespace-nowrap transition-all ${
                    selectedGenre === genre
                      ? 'bg-linear-to-r from-orange-500 to-amber-500 text-white shadow-lg'
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
                <span className="wrap-break-word">
                  Filtered by: {selectedGenre}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedGenre('All');
                  setBrowseRowsShown(1);
                }}
                className="text-xs sm:text-sm text-orange-600 hover:text-orange-800 font-medium self-start sm:self-auto"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}

        {/* Premium Stories Grid - Wattpad Style */}
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
            {filteredStories.length > 0 ? (
              (() => {
                const currentStoriesPerRow = storiesPerRow;
                const storiesToShow = currentStoriesPerRow * browseRowsShown;
                const displayedBrowseStories = filteredStories.slice(0, storiesToShow);
                const hasMoreBrowseStories = filteredStories.length > storiesToShow;
                
                return displayedBrowseStories.map((story) => (
              <div 
                key={story._id} 
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-orange-200"
                onClick={() => navigate(`/story/${story._id}`)}
              >
                {/* Premium Story Cover - Compact */}
                <div className="relative aspect-3/4 overflow-hidden bg-gray-100">
                  {story.coverImage ? (
                    <img
                      src={story.coverImage}
                      alt={story.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-orange-100 via-amber-50 to-red-50 flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-orange-400" />
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
                      <div className="w-6 h-6 bg-linear-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
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
                ));
              })()
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
                      setBrowseRowsShown(1);
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
          
          {/* Load More Button for Browse Section */}
          {filteredStories.length > 0 && (() => {
            const currentStoriesPerRow = storiesPerRow;
            const storiesToShow = currentStoriesPerRow * browseRowsShown;
            const hasMoreBrowseStories = filteredStories.length > storiesToShow;
            
            return hasMoreBrowseStories && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMoreBrowseRows}
                  className="px-6 py-2.5 bg-white border border-gray-200 hover:border-orange-300 text-gray-700 hover:text-orange-600 rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow-md flex items-center space-x-2"
                >
                  <span>Load More</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg text-xs font-semibold">
                    +{Math.min(storiesPerRow, filteredStories.length - storiesToShow)}
                  </span>
                </button>
              </div>
            );
          })()}
        </div>
      </div>

    </div>
  );
};

export default Feed;