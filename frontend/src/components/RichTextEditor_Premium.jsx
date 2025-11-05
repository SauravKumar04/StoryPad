import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  Quote, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Type,
  Palette,
  Link,
  Image,
  MoreHorizontal,
  Eye,
  EyeOff,
  Zap,
  Target,
  Clock,
  BookOpen,
  PenTool,
  Maximize,
  Minimize,
  Save
} from 'lucide-react';

const RichTextEditor = ({ 
  value = '', 
  onChange, 
  placeholder = "Start writing your masterpiece...",
  minHeight = "300px",
  className = ""
}) => {
  const editorRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isPreview, setIsPreview] = useState(false);
  const [writingMode, setWritingMode] = useState('normal'); // normal, focus, zen

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
      updateCounts();
    }
  }, [value]);

  const updateCounts = useCallback(() => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || '';
      const words = text.trim().split(/\\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
      setCharCount(text.length);
    }
  }, []);

  const handleInput = () => {
    if (onChange) {
      onChange(editorRef.current.innerHTML);
    }
    updateCounts();
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertText = (text) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
    }
    handleInput();
  };

  const formatButtons = [
    { 
      icon: Bold, 
      command: 'bold', 
      title: 'Bold (Ctrl+B)',
      color: 'text-gray-700 hover:text-orange-600'
    },
    { 
      icon: Italic, 
      command: 'italic', 
      title: 'Italic (Ctrl+I)',
      color: 'text-gray-700 hover:text-orange-600'
    },
    { 
      icon: Underline, 
      command: 'underline', 
      title: 'Underline (Ctrl+U)',
      color: 'text-gray-700 hover:text-orange-600'
    },
  ];

  const alignButtons = [
    { icon: AlignLeft, command: 'justifyLeft', title: 'Align Left' },
    { icon: AlignCenter, command: 'justifyCenter', title: 'Align Center' },
    { icon: AlignRight, command: 'justifyRight', title: 'Align Right' },
  ];

  const listButtons = [
    { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
    { icon: Quote, command: 'formatBlock', value: 'blockquote', title: 'Quote' },
  ];

  const getWritingModeClass = () => {
    switch (writingMode) {
      case 'focus':
        return 'bg-gray-900 text-gray-100';
      case 'zen':
        return 'bg-gradient-to-br from-green-50 to-blue-50';
      default:
        return 'bg-white';
    }
  };

  const editorContent = (
    <div className={`${className} ${isFullscreen ? 'fixed inset-0 z-50 flex flex-col' : 'relative'}`}>
      <div className={`flex-1 flex flex-col ${getWritingModeClass()} rounded-2xl overflow-hidden shadow-xl border border-orange-200`}>
        {/* Enhanced Toolbar */}
        {showToolbar && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-1">
                {/* Format Group */}
                <div className="flex items-center space-x-1 bg-white/20 rounded-xl p-1">
                  {formatButtons.map(({ icon: Icon, command, title }) => (
                    <button
                      key={command}
                      type="button"
                      onClick={() => execCommand(command)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                      title={title}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>

                {/* Text Size */}
                <div className="bg-white/20 rounded-xl p-1">
                  <select
                    onChange={(e) => execCommand('fontSize', e.target.value)}
                    className="bg-transparent text-white text-sm border-none focus:outline-none"
                  >
                    <option value="3" className="text-gray-900">Normal</option>
                    <option value="4" className="text-gray-900">Large</option>
                    <option value="5" className="text-gray-900">Larger</option>
                    <option value="6" className="text-gray-900">Huge</option>
                  </select>
                </div>

                {/* Alignment Group */}
                <div className="flex items-center space-x-1 bg-white/20 rounded-xl p-1">
                  {alignButtons.map(({ icon: Icon, command, title }) => (
                    <button
                      key={command}
                      type="button"
                      onClick={() => execCommand(command)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                      title={title}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>

                {/* List Group */}
                <div className="flex items-center space-x-1 bg-white/20 rounded-xl p-1">
                  {listButtons.map(({ icon: Icon, command, value, title }) => (
                    <button
                      key={command}
                      type="button"
                      onClick={() => execCommand(command, value)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                      title={title}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Side Controls */}
              <div className="flex items-center space-x-2">
                {/* Writing Mode */}
                <div className="flex items-center space-x-1 bg-white/20 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setWritingMode(writingMode === 'normal' ? 'focus' : writingMode === 'focus' ? 'zen' : 'normal')}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                    title={`Switch to ${writingMode === 'normal' ? 'Focus' : writingMode === 'focus' ? 'Zen' : 'Normal'} mode`}
                  >
                    <PenTool className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPreview(!isPreview)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                    title={isPreview ? 'Edit Mode' : 'Preview Mode'}
                  >
                    {isPreview ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>

                {/* Fullscreen Toggle */}
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </button>

                {/* Toolbar Toggle */}
                <button
                  type="button"
                  onClick={() => setShowToolbar(!showToolbar)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                  title="Toggle Toolbar"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Editor Content */}
        <div className="flex-1 flex flex-col">
          {isPreview ? (
            <div 
              className={`flex-1 p-8 overflow-y-auto prose prose-lg max-w-none ${
                writingMode === 'focus' ? 'prose-invert' : ''
              }`}
              style={{ minHeight }}
              dangerouslySetInnerHTML={{ __html: value }}
            />
          ) : (
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              className={`flex-1 p-8 focus:outline-none overflow-y-auto leading-relaxed ${
                writingMode === 'focus' 
                  ? 'text-gray-100' 
                  : writingMode === 'zen' 
                    ? 'text-gray-800' 
                    : 'text-gray-900'
              }`}
              style={{ 
                minHeight,
                fontSize: '16px',
                lineHeight: '1.75'
              }}
              placeholder={placeholder}
              suppressContentEditableWarning={true}
            />
          )}
        </div>

        {/* Status Bar */}
        <div className={`px-6 py-3 border-t ${
          writingMode === 'focus' 
            ? 'bg-gray-800 border-gray-700 text-gray-300' 
            : 'bg-gray-50 border-gray-200 text-gray-600'
        }`}>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-orange-500" />
                <span>{wordCount} words</span>
              </div>
              <div className="flex items-center space-x-2">
                <Type className="h-4 w-4 text-blue-500" />
                <span>{charCount} characters</span>
              </div>
              {wordCount > 0 && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span>~{Math.ceil(wordCount / 200)} min read</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs">Auto-saved</span>
              </div>
              {writingMode !== 'normal' && (
                <div className="px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-semibold">
                  {writingMode === 'focus' ? 'Focus Mode' : 'Zen Mode'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Helper */}
      {isFullscreen && (
        <div className="absolute top-4 right-4 bg-black/80 text-white p-4 rounded-xl text-sm opacity-80 hover:opacity-100 transition-opacity">
          <div className="space-y-1">
            <div><kbd className="bg-gray-700 px-2 py-1 rounded">Ctrl+B</kbd> Bold</div>
            <div><kbd className="bg-gray-700 px-2 py-1 rounded">Ctrl+I</kbd> Italic</div>
            <div><kbd className="bg-gray-700 px-2 py-1 rounded">Ctrl+U</kbd> Underline</div>
            <div><kbd className="bg-gray-700 px-2 py-1 rounded">Esc</kbd> Exit Fullscreen</div>
          </div>
        </div>
      )}
    </div>
  );

  // Handle escape key for fullscreen
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  if (isFullscreen) {
    return editorContent;
  }

  return editorContent;
};

export default RichTextEditor;