import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  Plus, 
  X, 
  ImageIcon, 
  BookOpen, 
  Feather,
  Target,
  Clock,
  Eye,
  Zap,
  Sparkles,
  PenTool,
  FileText,
  Settings,
  Palette,
  Globe,
  Users,
  Heart
} from 'lucide-react';
import Navbar from '../components/Navbar';
import RichTextEditor from '../components/RichTextEditor';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const CreateStory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const autoSaveTimeoutRef = useRef();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Romance',
    tags: '',
    targetAudience: 'Young Adult',
    language: 'English',
    status: 'Ongoing'
  });

  const [chapters, setChapters] = useState([
    { 
      id: 1, 
      title: 'Chapter 1', 
      content: '', 
      wordCount: 0,
      notes: ''
    }
  ]);

  const categories = [
    { id: 'romance', label: 'Romance', icon: '💕', color: 'from-pink-500 to-rose-500' },
    { id: 'fantasy', label: 'Fantasy', icon: '🧙‍♀️', color: 'from-purple-500 to-indigo-500' },
    { id: 'sci-fi', label: 'Science Fiction', icon: '🚀', color: 'from-blue-500 to-cyan-500' },
    { id: 'mystery', label: 'Mystery', icon: '🔍', color: 'from-gray-600 to-gray-800' },
    { id: 'horror', label: 'Horror', icon: '👻', color: 'from-red-600 to-red-800' },
    { id: 'adventure', label: 'Adventure', icon: '⚔️', color: 'from-green-500 to-emerald-500' },
    { id: 'drama', label: 'Drama', icon: '🎭', color: 'from-amber-500 to-orange-500' },
    { id: 'comedy', label: 'Comedy', icon: '😄', color: 'from-yellow-400 to-yellow-600' },
    { id: 'thriller', label: 'Thriller', icon: '⚡', color: 'from-red-500 to-pink-500' }
  ];

  const targetAudiences = ['General', 'Young Adult', 'New Adult', 'Adult'];
  const languages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese'];
  const statuses = ['Ongoing', 'Completed', 'Hiatus'];

  // Auto-save functionality
  useEffect(() => {
    if (formData.title || formData.description || chapters.some(ch => ch.content)) {
      setAutoSaveStatus('saving');
      
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        // Simulate auto-save
        setAutoSaveStatus('saved');
      }, 2000);
    }
  }, [formData, chapters]);

  // Calculate total word count
  useEffect(() => {
    const totalWords = chapters.reduce((total, chapter) => {
      const text = chapter.content.replace(/<[^>]*>/g, '');
      const words = text.trim().split(/\\s+/).filter(word => word.length > 0);
      return total + words.length;
    }, 0);
    setWordCount(totalWords);
  }, [chapters]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Image size should be less than 10MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addChapter = () => {
    const newChapter = {
      id: chapters.length + 1,
      title: `Chapter ${chapters.length + 1}`,
      content: '',
      wordCount: 0,
      notes: ''
    };
    setChapters([...chapters, newChapter]);
  };

  const removeChapter = (id) => {
    if (chapters.length === 1) {
      toast.error('Story must have at least one chapter');
      return;
    }
    setChapters(chapters.filter(chapter => chapter.id !== id));
  };

  const updateChapter = (id, field, value) => {
    setChapters(chapters.map(chapter => {
      if (chapter.id === id) {
        const updated = { ...chapter, [field]: value };
        if (field === 'content') {
          const text = value.replace(/<[^>]*>/g, '');
          const words = text.trim().split(/\\s+/).filter(word => word.length > 0);
          updated.wordCount = words.length;
        }
        return updated;
      }
      return chapter;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a story title');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a story description');
      return;
    }

    if (chapters[0].content.replace(/<[^>]*>/g, '').trim().length < 100) {
      toast.error('First chapter should have at least 100 words');
      return;
    }

    setLoading(true);

    try {
      const storyData = {
        ...formData,
        coverImage: coverImagePreview,
        content: chapters[0].content,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const storyResponse = await api.post('/stories', storyData);
      const storyId = storyResponse.data._id;

      // Update first chapter title if changed
      if (chapters[0].title !== 'Chapter 1') {
        const firstChapters = await api.get(`/chapters/story/${storyId}`);
        if (firstChapters.data.length > 0) {
          await api.put(`/chapters/${firstChapters.data[0]._id}`, {
            title: chapters[0].title,
            content: chapters[0].content
          });
        }
      }

      // Create additional chapters
      for (let i = 1; i < chapters.length; i++) {
        const chapterData = {
          title: chapters[i].title,
          content: chapters[i].content
        };
        await api.post(`/chapters/story/${storyId}`, chapterData);
      }

      toast.success(`Story published with ${chapters.length} chapters! 🎉`);
      navigate(`/story/${storyId}`);
    } catch (error) {
      toast.error('Error publishing story');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCategory = () => {
    return categories.find(cat => cat.id === formData.category.toLowerCase()) || categories[0];
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-16 px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Please Login to Create Stories</h1>
          <button
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold"
          >
            Login Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <Navbar />
      
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/feed')}
                className="flex items-center space-x-2 text-orange-100 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Feed</span>
              </button>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <Feather className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold">
                    Create Your Masterpiece
                  </h1>
                  <p className="text-xl text-orange-100 mt-2">
                    Bring your imagination to life
                  </p>
                </div>
              </div>
            </div>
            
            {/* Live Stats */}
            <div className="hidden lg:block text-right">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{wordCount}</div>
                    <div className="text-sm text-orange-100">Words</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{chapters.length}</div>
                    <div className="text-sm text-orange-100">Chapters</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center space-x-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    autoSaveStatus === 'saved' ? 'bg-green-400' : 
                    autoSaveStatus === 'saving' ? 'bg-yellow-400' : 'bg-red-400'
                  }`}></div>
                  <span className="text-orange-100">
                    {autoSaveStatus === 'saved' ? 'All changes saved' : 
                     autoSaveStatus === 'saving' ? 'Saving...' : 'Not saved'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-orange-50 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Story Details Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-orange-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-6 w-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Story Details</h2>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Story Info */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Story Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-lg font-medium"
                      placeholder="Enter your captivating title..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Story Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                      placeholder="Describe your story in a way that will hook readers..."
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Target Audience
                      </label>
                      <select
                        name="targetAudience"
                        value={formData.targetAudience}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      >
                        {targetAudiences.map(audience => (
                          <option key={audience} value={audience}>{audience}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      >
                        {languages.map(language => (
                          <option key={language} value={language}>{language}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="romance, fantasy, adventure, magic..."
                    />
                  </div>
                </div>

                {/* Cover Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cover Image
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="coverImage"
                    />
                    <label
                      htmlFor="coverImage"
                      className="group block w-full h-80 border-2 border-dashed border-orange-200 rounded-2xl cursor-pointer hover:border-orange-400 transition-colors relative overflow-hidden"
                    >
                      {coverImagePreview ? (
                        <div className="relative h-full">
                          <img
                            src={coverImagePreview}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                            <Upload className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 group-hover:text-orange-500 transition-colors">
                          <ImageIcon className="h-16 w-16 mb-4" />
                          <span className="font-semibold">Upload Cover Image</span>
                          <span className="text-sm mt-1">PNG, JPG up to 10MB</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-orange-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6">
              <div className="flex items-center space-x-3">
                <Palette className="h-6 w-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Choose Your Genre</h2>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: category.label }))}
                    className={`group relative p-6 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                      formData.category === category.label
                        ? 'border-orange-500 bg-gradient-to-br ' + category.color + ' text-white shadow-xl'
                        : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-lg'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{category.icon}</div>
                      <div className={`font-semibold text-sm ${
                        formData.category === category.label ? 'text-white' : 'text-gray-700'
                      }`}>
                        {category.label}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chapters Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-orange-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-6 w-6 text-white" />
                  <h2 className="text-2xl font-bold text-white">Write Your Story</h2>
                </div>
                <button
                  type="button"
                  onClick={addChapter}
                  className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Chapter</span>
                </button>
              </div>
            </div>
            
            <div className="p-8 space-y-8">
              {chapters.map((chapter, index) => (
                <div key={chapter.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <input
                          type="text"
                          value={chapter.title}
                          onChange={(e) => updateChapter(chapter.id, 'title', e.target.value)}
                          className="text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-lg px-2 py-1 flex-1"
                          placeholder="Chapter Title"
                        />
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{chapter.wordCount} words</span>
                          {index === 0 && <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-semibold">First Chapter</span>}
                        </div>
                      </div>
                      
                      {chapters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChapter(chapter.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <RichTextEditor
                      value={chapter.content}
                      onChange={(content) => updateChapter(chapter.id, 'content', content)}
                      placeholder={`Start writing ${chapter.title}... Let your creativity flow!`}
                      minHeight="400px"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Publish Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="group flex items-center space-x-4 px-12 py-6 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white rounded-3xl hover:from-orange-700 hover:via-red-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-2xl text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Sparkles className="h-6 w-6 group-hover:animate-pulse" />
              <span>{loading ? 'Publishing Your Story...' : 'Publish Your Story'}</span>
              <Sparkles className="h-6 w-6 group-hover:animate-pulse" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStory;