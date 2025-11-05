import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Plus, X, ImageIcon, BookOpen } from 'lucide-react';
import Navbar from '../components/Navbar';
import RichTextEditor from '../components/RichTextEditor';
import { toast } from 'react-toastify';
import api from '../utils/api';

const CreateStory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Romance',
    tags: ''
  });
  const [chapters, setChapters] = useState([
    { id: 1, title: 'Chapter 1', content: '<p>Start writing your first chapter here...</p>' }
  ]);

  const categories = [
    'Romance', 'Fantasy', 'Science Fiction', 'Mystery', 
    'Horror', 'Adventure', 'Drama', 'Comedy', 'Thriller'
  ];

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      setCoverImageFile(file);
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
      content: '<p>Start writing this chapter...</p>'
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
    setChapters(chapters.map(chapter => 
      chapter.id === id ? { ...chapter, [field]: value } : chapter
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in title and description');
      return;
    }

    if (chapters.some(chapter => !chapter.title.trim() || !chapter.content.trim())) {
      toast.error('Please fill in all chapter titles and content');
      return;
    }

    setLoading(true);

    try {
      let coverImageUrl = '';
      
      // For now, we'll use the preview URL. In production, you'd upload to a service
      if (coverImagePreview) {
        coverImageUrl = coverImagePreview;
      }

      const storyData = {
        ...formData,
        coverImage: coverImageUrl,
        content: chapters[0].content, // First chapter content for the story
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      // Create the story first
      const storyResponse = await api.post('/stories', storyData);
      const storyId = storyResponse.data._id;

      // Update the first chapter title if changed
      if (chapters[0].title !== 'Chapter 1') {
        const firstChapters = await api.get(`/chapters/story/${storyId}`);
        if (firstChapters.data.length > 0) {
          await api.put(`/chapters/${firstChapters.data[0]._id}`, {
            title: chapters[0].title,
            content: chapters[0].content
          });
        }
      }

      // Create additional chapters (skip first one as it's created with story)
      for (let i = 1; i < chapters.length; i++) {
        const chapterData = {
          title: chapters[i].title,
          content: chapters[i].content
        };
        await api.post(`/chapters/story/${storyId}`, chapterData);
      }

      toast.success(`Story created with ${chapters.length} chapters!`);
      navigate(`/story/${storyId}`);
    } catch (error) {
      toast.error('Error creating story');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"></div>
        <div className="relative max-w-7xl mx-auto py-12 px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Create Your Masterpiece
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Craft compelling stories that captivate readers around the world
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/feed')}
              className="group p-3 hover:bg-white hover:shadow-lg rounded-xl transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Create New Story
              </h1>
              <p className="text-gray-600">Share your creativity with the world</p>
            </div>
          </div>
        </div>

        {/* Premium Story Creation Form */}
        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Left Panel - Story Metadata */}
            <div className="xl:col-span-4 space-y-8">
              
              {/* Story Details Card */}
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-purple-100/50">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Story Details</h3>
                </div>

                <div className="space-y-6">
                  {/* Title Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Story Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Enter an engaging title..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-lg font-medium"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe your story in a few compelling sentences..."
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                      required
                    />
                  </div>

                  {/* Category & Tags */}
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        placeholder="love, drama, adventure..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cover Image Upload */}
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-purple-100/50">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Cover Image</h3>
                </div>
                
                <div className="space-y-4">
                  {coverImagePreview ? (
                    <div className="relative group">
                      <img
                        src={coverImagePreview}
                        alt="Cover preview"
                        className="w-full h-80 object-cover rounded-2xl shadow-lg"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setCoverImagePreview('');
                            setCoverImageFile(null);
                          }}
                          className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-colors flex items-center space-x-2"
                        >
                          <X className="h-4 w-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-purple-200 rounded-2xl p-12 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-300">
                      <div className="relative">
                        <ImageIcon className="mx-auto h-16 w-16 text-purple-400 mb-4" />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-pulse"></div>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Add Cover Image</h4>
                      <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                        Choose an eye-catching cover that represents your story
                      </p>
                      <label className="cursor-pointer bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all inline-flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105">
                        <Upload className="h-5 w-5" />
                        <span className="font-medium">Choose Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-4">Supports JPG, PNG up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>


            </div>

            {/* Right Panel - Chapters */}
            <div className="xl:col-span-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-purple-100/50 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 border-b border-purple-100/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Story Chapters</h3>
                        <p className="text-gray-600">{chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'} created</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addChapter}
                      className="flex items-center space-x-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Add New Chapter</span>
                    </button>
                  </div>
                </div>

                <div className="p-8 space-y-8 max-h-[800px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-purple-100">
                  {chapters.map((chapter, index) => (
                    <div key={chapter.id} className="bg-gradient-to-br from-white to-purple-50/30 border-2 border-purple-100/50 rounded-2xl p-8 hover:border-purple-200 hover:shadow-lg transition-all duration-300 group">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {index + 1}
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse"></div>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">Chapter {index + 1}</h4>
                            <p className="text-sm text-gray-600">Tell your story</p>
                          </div>
                        </div>
                        {chapters.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeChapter(chapter.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-3 hover:bg-red-50 rounded-xl transition-all duration-200 flex items-center space-x-2"
                          >
                            <X className="h-5 w-5" />
                            <span className="text-sm font-medium">Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="flex text-sm font-semibold text-gray-700 mb-3 items-center space-x-2">
                            <span>Chapter Title *</span>
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          </label>
                          <input
                            type="text"
                            value={chapter.title}
                            onChange={(e) => updateChapter(chapter.id, 'title', e.target.value)}
                            className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-lg font-medium bg-white/80 placeholder-gray-400"
                            placeholder={`Enter title for chapter ${index + 1}...`}
                            required
                          />
                        </div>

                        <div>
                          <label className="flex text-sm font-semibold text-gray-700 mb-3 items-center space-x-2">
                            <span>Chapter Content *</span>
                            <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                          </label>
                          <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white/80 focus-within:border-purple-500 focus-within:shadow-lg transition-all duration-200">
                            <RichTextEditor
                              content={chapter.content}
                              onChange={(content) => updateChapter(chapter.id, 'content', content)}
                              placeholder={`Start writing chapter ${index + 1}... Let your imagination flow!`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit Section */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 border-t border-purple-100/50">
                  <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Ready to publish?</h4>
                      <p className="text-gray-600">Share your story with readers around the world</p>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center space-x-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-105 text-lg min-w-[200px] justify-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span>Creating Story...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-6 w-6" />
                          <span>Publish Story</span>
                          <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1 text-sm">
                            <span>{chapters.length}</span>
                            <span>ch</span>
                          </div>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStory;