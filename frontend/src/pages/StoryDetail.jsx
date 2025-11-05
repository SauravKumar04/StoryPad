import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Clock,
  MessageCircle,
  Plus,
  Edit,
  Play,
  ChevronRight,
  Trash2,
  Send,
  BookOpen,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const StoryDetail = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [story, setStory] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapter, setNewChapter] = useState({ title: "", content: "" });
  const [showEditChapter, setShowEditChapter] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchStory(), fetchChapters(), fetchComments()]);
      setLoading(false);
    };
    loadData();
  }, [storyId]);

  const fetchStory = async () => {
    try {
      const res = await api.get(`/stories/${storyId}`);
      setStory(res.data);
      setIsLiked(res.data.likes?.some((l) => l._id === user?.id) || false);
      setLikesCount(res.data.likes?.length || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChapters = async () => {
    try {
      const res = await api.get(`/chapters/story/${storyId}`);
      setChapters(res.data);
      if (res.data.length > 0) setSelectedChapter(res.data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await api.get(`/story-comments/${storyId}`);
      console.log('Fetched comments:', res.data); // Debug log
      const fetchedComments = res.data.comments || res.data || [];
      setComments(Array.isArray(fetchedComments) ? fetchedComments : []);
    } catch (err) {
      console.error('Fetch comments error:', err);
      setComments([]); // Set empty array on error
    }
  };

  const handleLike = async () => {
    if (!user) return toast.info("Login to like stories");
    try {
      const res = await api.post(`/stories/${storyId}/like`);
      setIsLiked(res.data.liked);
      setLikesCount((prev) => (res.data.liked ? prev + 1 : prev - 1));
    } catch {
      toast.error("Failed to like story");
    }
  };

  const handleBookmark = async () => {
    if (!user) return toast.info("Login to bookmark stories");
    try {
      const res = await api.post(`/bookmarks/${storyId}`);
      setIsBookmarked(res.data.bookmarked);
      toast.success(
        res.data.bookmarked ? "Added to bookmarks" : "Removed from bookmarks"
      );
    } catch {
      toast.error("Failed to bookmark story");
    }
  };

  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!newChapter.title.trim() || !newChapter.content.trim())
      return toast.error("Fill all fields");

    try {
      const res = await api.post(`/chapters/story/${storyId}`, newChapter);
      setChapters([...chapters, res.data]);
      setShowAddChapter(false);
      setNewChapter({ title: "", content: "" });
      toast.success("Chapter added");
    } catch {
      toast.error("Failed to add chapter");
    }
  };

  const handleEditChapter = (ch) => {
    setEditingChapter(ch);
    setShowEditChapter(true);
  };

  const handleUpdateChapter = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/chapters/${editingChapter._id}`, {
        title: editingChapter.title,
        content: editingChapter.content,
      });
      setChapters((prev) =>
        prev.map((c) => (c._id === editingChapter._id ? res.data : c))
      );
      if (selectedChapter?._id === editingChapter._id)
        setSelectedChapter(res.data);
      setEditingChapter(null);
      toast.success("Chapter updated");
    } catch (error) {
      console.error('Update chapter error:', error);
      toast.error("Failed to update chapter");
    }
  };

  const handleDeleteChapter = async (id) => {
    if (!window.confirm("Delete this chapter?")) return;
    try {
      await api.delete(`/chapters/${id}`);
      setChapters(chapters.filter((c) => c._id !== id));
      if (selectedChapter?._id === id)
        setSelectedChapter(chapters[0] || null);
      toast.success("Chapter deleted");
    } catch {
      toast.error("Failed to delete chapter");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/story-comments/${storyId}`, {
        text: newComment,
      });
      console.log('Comment added:', res.data); // Debug log
      setComments([res.data, ...comments]);
      setNewComment("");
      toast.success("Comment added");
    } catch (error) {
      console.error('Comment error:', error);
      toast.error("Failed to add comment");
    }
  };

  const handleDeleteStory = async () => {
    if (!window.confirm("Delete this story permanently?")) return;
    setDeleting(true);
    try {
      await api.delete(`/stories/${storyId}`);
      toast.success("Story deleted");
      navigate('/profile');
    } catch {
      toast.error("Failed to delete story");
    } finally {
      setDeleting(false);
    }
  };

  const isAuthor = user && story?.author?._id === user?.id;

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        {/* Minimal Loading Content */}
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <div className="mb-8">
              <BookOpen className="h-12 w-12 mx-auto text-orange-500 animate-pulse" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Story</h2>
            <p className="text-gray-600 text-lg mb-8">
              Preparing your reading experience...
            </p>
            
            {/* Minimal Progress Dots */}
            <div className="flex justify-center items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );

  if (!story)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        {/* Minimal Not Found Content */}
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <div className="mb-8">
              <BookOpen className="h-12 w-12 mx-auto text-gray-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Story Not Found</h2>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              The story you're looking for doesn't exist or may have been removed.
            </p>
            
            <Link 
              to="/feed" 
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Browse Stories</span>
            </Link>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100">
      <Navbar />
      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <Link
            to="/feed"
            className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl hover:bg-white transition-all shadow-md border border-orange-200/50 group"
          >
            <ArrowLeft className="h-4 w-4 text-orange-600 group-hover:translate-x-[-2px] transition-transform" />
            <span className="text-orange-700 font-medium text-sm sm:text-base">Back to Feed</span>
          </Link>
          
          {isAuthor && (
            <Link
              to={`/story/${storyId}/edit`}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg font-medium text-sm sm:text-base"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Edit Story</span>
              <span className="sm:hidden">Edit</span>
            </Link>
          )}
        </div>

        {/* --- PREMIUM STORY HEADER --- */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-orange-200/30 overflow-hidden mb-6 sm:mb-8">
          {/* Header Gradient */}
          <div className="h-3 bg-gradient-to-r from-orange-500 via-amber-500 to-red-500"></div>
          
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              {/* Enhanced Cover Image */}
              <div className="shrink-0 mx-auto lg:mx-0">
                <div className="relative group">
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="w-48 h-64 sm:w-56 sm:h-80 lg:w-64 lg:h-88 object-cover rounded-2xl shadow-2xl ring-4 ring-orange-200/50"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </div>

              {/* Enhanced Story Info */}
              <div className="flex-1 space-y-4 sm:space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent leading-tight mb-3 text-center lg:text-left">
                    {story.title}
                  </h1>
                  
                  <Link
                    to={`/profile/${story.author._id}`}
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-orange-100 hover:bg-orange-200 rounded-xl transition-all group mx-auto lg:mx-0"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                      {story.author.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-orange-700 font-semibold group-hover:text-orange-800 text-sm sm:text-base">
                      {story.author.username}
                    </span>
                  </Link>
                </div>

                {/* Story Description */}
                <div className="bg-orange-50/50 rounded-xl p-3 sm:p-4 border border-orange-200/30">
                  <p className="text-slate-700 leading-relaxed text-sm sm:text-base lg:text-lg text-center lg:text-left">
                    {story.description || "This story awaits your discovery..."}
                  </p>
                </div>

                {/* Story Stats */}
                <div className="flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start">
                  <div className="flex items-center gap-2 bg-white rounded-xl px-3 sm:px-4 py-2 shadow-sm border border-orange-200/30">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    <span className="text-xs sm:text-sm font-medium text-slate-700">{comments.length} comments</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-xl px-3 sm:px-4 py-2 shadow-sm border border-orange-200/30">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span className="text-xs sm:text-sm font-medium text-slate-700">
                      {new Date(story.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Premium Action Buttons */}
                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm sm:text-base ${
                      isLiked 
                        ? "bg-gradient-to-r from-red-500 to-pink-500 text-white" 
                        : "bg-white text-red-600 border-2 border-red-200 hover:bg-red-50"
                    }`}
                  >
                    <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isLiked ? "fill-current" : ""}`} />
                    <span className="hidden sm:inline">{likesCount} {isLiked ? "Liked" : "Like"}</span>
                    <span className="sm:hidden">{likesCount}</span>
                  </button>

                  <button
                    onClick={handleBookmark}
                    className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm sm:text-base ${
                      isBookmarked 
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white" 
                        : "bg-white text-orange-600 border-2 border-orange-200 hover:bg-orange-50"
                    }`}
                  >
                    <Bookmark className={`h-4 w-4 sm:h-5 sm:w-5 ${isBookmarked ? "fill-current" : ""}`} />
                    <span className="hidden sm:inline">{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
                    <span className="sm:hidden">Save</span>
                  </button>

                  {isAuthor && (
                    <button
                      onClick={handleDeleteStory}
                      disabled={deleting}
                      className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-white text-red-600 border-2 border-red-200 rounded-xl hover:bg-red-50 font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">{deleting ? "Deleting..." : "Delete Story"}</span>
                      <span className="sm:hidden">Delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- PREMIUM CHAPTERS SECTION --- */}
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Enhanced Chapter List Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-200/30 p-4 sm:p-6 lg:sticky lg:top-4">
              {/* Chapters Header */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-4 sm:mb-6 px-4 sm:px-6 py-3 sm:py-4 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Chapters ({chapters.length})</span>
                    <span className="sm:hidden">Ch. ({chapters.length})</span>
                  </h3>
                  {isAuthor && (
                    <Link
                      to={`/story/${storyId}/edit`}
                      className="bg-white/20 hover:bg-white/30 text-white p-1.5 sm:p-2 rounded-lg transition-all backdrop-blur-sm border border-white/10"
                      title="Edit Story & Chapters"
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Chapters List */}
              <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-96 overflow-y-auto">
                {chapters.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="h-6 w-6 text-orange-500" />
                    </div>
                    <p className="text-gray-500 text-sm">No chapters yet</p>
                    {isAuthor && (
                      <Link
                        to={`/story/${storyId}/edit`}
                        className="text-orange-600 text-sm font-medium hover:text-orange-700 mt-2 inline-block"
                      >
                        Add your first chapter
                      </Link>
                    )}
                  </div>
                ) : (
                  chapters.map((chapter, index) => (
                    <div
                      key={chapter._id}
                      className={`group relative p-3 sm:p-4 rounded-xl cursor-pointer transition-all border ${
                        selectedChapter?._id === chapter._id
                          ? "bg-gradient-to-r from-orange-100 to-amber-100 border-orange-300 shadow-md"
                          : "bg-white hover:bg-orange-50 border-orange-200/30 hover:border-orange-300 hover:shadow-md"
                      }`}
                      onClick={() => setSelectedChapter(chapter)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                              selectedChapter?._id === chapter._id
                                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                                : "bg-orange-200 text-orange-700"
                            }`}>
                              {index + 1}
                            </div>
                            <h4 className="font-semibold text-xs sm:text-sm text-slate-800 truncate">
                              {chapter.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 ml-7 sm:ml-8">
                            Chapter {chapter.chapterNumber || index + 1}
                          </p>
                        </div>
                        
                        {isAuthor && (
                          <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-2">
                            <Link
                              to={`/story/${storyId}/edit`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 sm:p-1.5 text-orange-600 hover:bg-orange-200 rounded-lg transition-all"
                              title="Edit in Story Editor"
                            >
                              <Edit className="h-3 w-3" />
                            </Link>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChapter(chapter._id);
                              }}
                              className="p-1 sm:p-1.5 text-red-600 hover:bg-red-200 rounded-lg transition-all"
                              title="Delete Chapter"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Premium Chapter Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {selectedChapter ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-orange-200/30 overflow-hidden mb-6 lg:mb-10">
                {/* Chapter Header */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">
                    {selectedChapter.title}
                  </h2>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-orange-100">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs sm:text-sm">
                        {Math.ceil((selectedChapter.content?.length || 0) / 1000)} min read
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-xs sm:text-sm">Chapter {selectedChapter.chapterNumber || chapters.findIndex(ch => ch._id === selectedChapter._id) + 1}</span>
                    </div>
                  </div>
                </div>

                {/* Chapter Content */}
                <div className="p-4 sm:p-6 lg:p-8 xl:p-12">
                  <div
                    className="prose prose-sm sm:prose-base lg:prose-lg max-w-none story-content"
                    dangerouslySetInnerHTML={{ __html: selectedChapter.content }}
                  />
                </div>

                {/* Chapter Navigation */}
                {chapters.length > 1 && (
                  <div className="border-t border-orange-200/50 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 bg-orange-50/50">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-2">
                      <button
                        onClick={() => {
                          const currentIndex = chapters.findIndex(ch => ch._id === selectedChapter._id);
                          if (currentIndex > 0) setSelectedChapter(chapters[currentIndex - 1]);
                        }}
                        disabled={chapters.findIndex(ch => ch._id === selectedChapter._id) === 0}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white text-orange-600 rounded-xl hover:bg-orange-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base w-full sm:w-auto justify-center"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Previous Chapter</span>
                        <span className="sm:hidden">Previous</span>
                      </button>

                      <div className="text-xs sm:text-sm text-slate-600 font-medium order-first sm:order-none">
                        {chapters.findIndex(ch => ch._id === selectedChapter._id) + 1} of {chapters.length}
                      </div>

                      <button
                        onClick={() => {
                          const currentIndex = chapters.findIndex(ch => ch._id === selectedChapter._id);
                          if (currentIndex < chapters.length - 1) setSelectedChapter(chapters[currentIndex + 1]);
                        }}
                        disabled={chapters.findIndex(ch => ch._id === selectedChapter._id) === chapters.length - 1}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white text-orange-600 rounded-xl hover:bg-orange-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base w-full sm:w-auto justify-center"
                      >
                        <span className="hidden sm:inline">Next Chapter</span>
                        <span className="sm:hidden">Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-200/30 p-12 mb-10 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to Begin?</h3>
                <p className="text-slate-600">Select a chapter from the sidebar to start reading this amazing story</p>
              </div>
            )}
          </div>
        </div>

        {/* --- PREMIUM COMMENTS SECTION --- */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-orange-200/30 overflow-hidden mt-8 sm:mt-10 lg:mt-12">
          {/* Comments Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 sm:gap-3">
              <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="hidden sm:inline">Reader Comments ({comments.length})</span>
              <span className="sm:hidden">Comments ({comments.length})</span>
            </h3>
            <p className="text-orange-100 mt-1 text-sm sm:text-base">Share your thoughts about this story</p>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {user && (
              <form onSubmit={handleAddComment} className="mb-6 sm:mb-8">
                <div className="bg-orange-50/50 rounded-xl p-4 sm:p-6 border border-orange-200/30">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full bg-white border-2 border-orange-200/50 rounded-xl p-3 sm:p-4 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none text-sm sm:text-base"
                        rows="3"
                        placeholder="Share your thoughts about this story..."
                      />
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 sm:mt-4 gap-3 sm:gap-0">
                        <span className="text-xs sm:text-sm text-slate-500">
                          Writing as <span className="font-semibold text-orange-600">{user.username}</span>
                        </span>
                        <button
                          type="submit"
                          disabled={!newComment.trim()}
                          className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base w-full sm:w-auto justify-center"
                        >
                          <Send className="h-4 w-4" />
                          Post Comment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {!user && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 sm:p-6 border border-orange-200/30 mb-6 sm:mb-8 text-center">
                <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 text-orange-500 mx-auto mb-3" />
                <h4 className="font-semibold text-slate-800 mb-2 text-sm sm:text-base">Join the Conversation</h4>
                <p className="text-slate-600 mb-4 text-sm sm:text-base">Login to share your thoughts and connect with other readers</p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg font-medium text-sm sm:text-base"
                >
                  Login to Comment
                </Link>
              </div>
            )}

            {/* Comments List */}
            {comments.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">No Comments Yet</h4>
                <p className="text-slate-600 text-sm sm:text-base">Be the first to share your thoughts about this story!</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {comments.map((c) => (
                  <div
                    key={c._id}
                    className="bg-gradient-to-r from-white to-orange-50/30 border border-orange-200/30 p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0">
                        {c.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-1 sm:gap-0">
                          <h5 className="font-semibold text-slate-800 text-sm sm:text-base">{c.user?.username || 'Anonymous'}</h5>
                          <time className="text-xs sm:text-sm text-slate-500">
                            {new Date(c.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </time>
                        </div>
                        <p className="text-slate-700 leading-relaxed text-sm sm:text-base">{c.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- ADD CHAPTER MODAL --- */}
      {showAddChapter && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleAddChapter}
            className="bg-white p-4 sm:p-6 rounded-2xl w-full max-w-lg space-y-4"
          >
            <h3 className="text-lg sm:text-xl font-bold">Add Chapter</h3>
            <input
              type="text"
              placeholder="Chapter Title"
              value={newChapter.title}
              onChange={(e) =>
                setNewChapter({ ...newChapter, title: e.target.value })
              }
              className="w-full border p-3 rounded-lg text-sm sm:text-base"
            />
            <textarea
              rows="6"
              placeholder="Chapter Content"
              value={newChapter.content}
              onChange={(e) =>
                setNewChapter({ ...newChapter, content: e.target.value })
              }
              className="w-full border p-3 rounded-lg text-sm sm:text-base"
            />
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddChapter(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg text-sm sm:text-base order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm sm:text-base order-1 sm:order-2"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- EDIT CHAPTER MODAL --- */}
      {editingChapter && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleUpdateChapter}
            className="bg-white p-4 sm:p-6 rounded-2xl w-full max-w-lg space-y-4"
          >
            <h3 className="text-lg sm:text-xl font-bold">Edit Chapter</h3>
            <input
              type="text"
              placeholder="Chapter Title"
              value={editingChapter.title}
              onChange={(e) =>
                setEditingChapter({ ...editingChapter, title: e.target.value })
              }
              className="w-full border p-3 rounded-lg text-sm sm:text-base"
            />
            <textarea
              rows="6"
              placeholder="Chapter Content"
              value={editingChapter.content}
              onChange={(e) =>
                setEditingChapter({ ...editingChapter, content: e.target.value })
              }
              className="w-full border p-3 rounded-lg text-sm sm:text-base"
            />
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingChapter(null)}
                className="px-4 py-2 bg-gray-200 rounded-lg text-sm sm:text-base order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm sm:text-base order-1 sm:order-2"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default StoryDetail;
