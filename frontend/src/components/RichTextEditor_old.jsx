import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, Quote, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

const RichTextEditor = ({ content, onChange, placeholder = "Start writing your story..." }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleInput = () => {
    if (onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleInput();
  };

  return (
    <div className="border border-pink-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-pink-50 border-b border-pink-200 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-2 hover:bg-pink-100 rounded transition-colors"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-2 hover:bg-pink-100 rounded transition-colors"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-2 hover:bg-pink-100 rounded transition-colors"
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </button>
        <div className="w-px bg-pink-200 mx-1"></div>
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-2 hover:bg-pink-100 rounded transition-colors"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', 'blockquote')}
          className="p-2 hover:bg-pink-100 rounded transition-colors"
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </button>
        <div className="w-px bg-pink-200 mx-1"></div>
        <button
          type="button"
          onClick={() => execCommand('justifyLeft')}
          className="p-2 hover:bg-pink-100 rounded transition-colors"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyCenter')}
          className="p-2 hover:bg-pink-100 rounded transition-colors"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyRight')}
          className="p-2 hover:bg-pink-100 rounded transition-colors"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        className="rich-text-editor p-4 min-h-96 bg-white focus:outline-none"
        contentEditable
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: content }}
        data-placeholder={placeholder}
        style={{ 
          minHeight: '400px',
          outline: 'none'
        }}
      />
    </div>
  );
};

export default RichTextEditor;