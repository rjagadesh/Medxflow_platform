import React, { useState, useRef, useEffect } from 'react';
import { Smile, AtSign, Plus, Send, Trash2, Wand2, Type, MoreHorizontal, X } from 'lucide-react';

const RichTextEditor = () => {
  const [content, setContent] = useState('');
  const [showToolbar, setShowToolbar] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const editorRef = useRef(null);
  const [activeFormats, setActiveFormats] = useState({});

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateActiveFormats();
    setShowMoreMenu(false);
  };

  const updateActiveFormats = () => {
    const formats = {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
    };
    setActiveFormats(formats);
  };

  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleSend = () => {
    if (editorRef.current && editorRef.current.textContent.trim()) {
      console.log('Sending message:', editorRef.current.innerHTML);
      editorRef.current.innerHTML = '';
      setContent('');
      setShowToolbar(false);
    }
  };

  const handleClear = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
      setContent('');
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      if (showToolbar) {
        updateActiveFormats();
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [showToolbar]);

  const ToolbarButton = ({ onClick, active, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
        active ? 'bg-gray-600' : 'hover:bg-gray-700'
      }`}
      title={title}
    >
      {children}
    </button>
  );

  const MenuButton = ({ onClick, active, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-4 py-2 flex items-center gap-3 transition-colors text-left ${
        active ? 'bg-gray-600 text-white' : 'hover:bg-gray-700 text-gray-200'
      }`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <>
      <div className="border border-gray-700 rounded-lg overflow-hidden bg-[var(--chakra-colors-droidal-black-300)] shadow-xl relative">
        {/* Custom Toolbar */}
        {showToolbar && (
          <div className="flex items-center gap-1 px-4 py-3 border-b border-gray-700 bg-[var(--chakra-colors-droidal-black-300)]">
            {/* Always visible buttons */}
            <ToolbarButton
              onClick={() => execCommand('bold')}
              active={activeFormats.bold}
              title="Bold"
            >
              <span className="font-bold text-gray-200">B</span>
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => execCommand('italic')}
              active={activeFormats.italic}
              title="Italic"
            >
              <span className="italic text-gray-200">I</span>
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => execCommand('underline')}
              active={activeFormats.underline}
              title="Underline"
            >
              <span className="underline text-gray-200">U</span>
            </ToolbarButton>
            
            {/* Hidden on mobile, visible on tablet+ */}
            <ToolbarButton
              onClick={() => execCommand('strikeThrough')}
              active={activeFormats.strikeThrough}
              title="Strikethrough"
            >
              <span className="line-through text-gray-200 hidden sm:inline">S</span>
            </ToolbarButton>
            
            <div className="w-px h-6 bg-gray-600 mx-1 hidden sm:block"></div>
            
            <ToolbarButton
              onClick={() => execCommand('insertUnorderedList')}
              active={activeFormats.insertUnorderedList}
              title="Bullet List"
            >
              <svg className="w-4 h-4 text-gray-200 hidden sm:block" viewBox="0 0 18 18" fill="none">
                <line stroke="currentColor" strokeWidth="2" x1="6" x2="15" y1="4" y2="4" />
                <line stroke="currentColor" strokeWidth="2" x1="6" x2="15" y1="9" y2="9" />
                <line stroke="currentColor" strokeWidth="2" x1="6" x2="15" y1="14" y2="14" />
                <circle fill="currentColor" cx="3" cy="4" r="1" />
                <circle fill="currentColor" cx="3" cy="9" r="1" />
                <circle fill="currentColor" cx="3" cy="14" r="1" />
              </svg>
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => execCommand('insertOrderedList')}
              active={activeFormats.insertOrderedList}
              title="Numbered List"
            >
              <svg className="w-4 h-4 text-gray-200 hidden sm:block" viewBox="0 0 18 18" fill="none">
                <line stroke="currentColor" strokeWidth="2" x1="7" x2="15" y1="4" y2="4" />
                <line stroke="currentColor" strokeWidth="2" x1="7" x2="15" y1="9" y2="9" />
                <line stroke="currentColor" strokeWidth="2" x1="7" x2="15" y1="14" y2="14" />
                <text x="2" y="6" fontSize="6" fill="currentColor">1</text>
                <text x="2" y="11" fontSize="6" fill="currentColor">2</text>
                <text x="2" y="16" fontSize="6" fill="currentColor">3</text>
              </svg>
            </ToolbarButton>
            
            {/* Hidden on mobile and tablet, visible on desktop */}
            <div className="w-px h-6 bg-gray-600 mx-1 hidden md:block"></div>
            
            <ToolbarButton
              onClick={() => execCommand('outdent')}
              title="Decrease Indent"
            >
              <svg className="w-4 h-4 text-gray-200 hidden md:block" viewBox="0 0 18 18" fill="none">
                <line stroke="currentColor" strokeWidth="2" x1="3" x2="15" y1="14" y2="14" />
                <line stroke="currentColor" strokeWidth="2" x1="3" x2="15" y1="4" y2="4" />
                <line stroke="currentColor" strokeWidth="2" x1="9" x2="15" y1="9" y2="9" />
                <polyline stroke="currentColor" strokeWidth="2" fill="none" points="5,7 3,9 5,11" />
              </svg>
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => execCommand('justifyLeft')}
              title="Align Left"
            >
              <svg className="w-4 h-4 text-gray-200 hidden md:block" viewBox="0 0 18 18" fill="none">
                <line stroke="currentColor" strokeWidth="2" x1="3" x2="15" y1="4" y2="4" />
                <line stroke="currentColor" strokeWidth="2" x1="3" x2="15" y1="9" y2="9" />
                <line stroke="currentColor" strokeWidth="2" x1="3" x2="11" y1="14" y2="14" />
              </svg>
            </ToolbarButton>
            
            <div className="w-px h-6 bg-gray-600 mx-1 hidden lg:block"></div>
            
            <select
              onChange={(e) => execCommand('fontSize', e.target.value)}
              className="h-8 px-2 border-0 bg-transparent hover:bg-gray-700 rounded cursor-pointer text-sm text-gray-200 hidden lg:block"
              defaultValue="3"
            >
              <option value="1" className="bg-[var(--chakra-colors-droidal-black-300)]">Small</option>
              <option value="3" className="bg-[var(--chakra-colors-droidal-black-300)]">Normal</option>
              <option value="5" className="bg-[var(--chakra-colors-droidal-black-300)]">Large</option>
              <option value="7" className="bg-[var(--chakra-colors-droidal-black-300)]">Huge</option>
            </select>
            
            <ToolbarButton
              onClick={() => execCommand('formatBlock', 'blockquote')}
              title="Quote"
            >
              <span className="text-gray-300 text-lg hidden lg:inline">"</span>
            </ToolbarButton>
            
            <ToolbarButton
              onClick={insertLink}
              title="Insert Link"
            >
              <svg className="w-4 h-4 text-gray-200 hidden lg:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </ToolbarButton>
            
            <ToolbarButton title="Emoji">
              <Smile className="w-4 h-4 text-gray-300 hidden lg:block" />
            </ToolbarButton>
            
            {/* More button - visible when some options are hidden */}
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded ml-auto lg:ml-0"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-300" />
            </button>
            
            <button 
              onClick={handleClear}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded text-gray-300 hidden lg:flex lg:ml-auto"
              title="Clear content"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* More Menu Dropdown */}
        {showMoreMenu && showToolbar && (
          <div className="absolute top-14 right-4 w-56 bg-[var(--chakra-colors-droidal-black-300)] border border-gray-700 rounded-lg shadow-xl z-50 py-1">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
              <span className="text-gray-200 text-sm font-medium">More Options</span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="w-6 h-6 flex items-center justify-center hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            {/* Mobile-only options */}
            <div className="sm:hidden">
              <MenuButton
                onClick={() => execCommand('strikeThrough')}
                active={activeFormats.strikeThrough}
                title="Strikethrough"
              >
                <span className="line-through">S</span>
                <span>Strikethrough</span>
              </MenuButton>
              <MenuButton
                onClick={() => execCommand('insertUnorderedList')}
                active={activeFormats.insertUnorderedList}
                title="Bullet List"
              >
                <svg className="w-4 h-4" viewBox="0 0 18 18" fill="none">
                  <line stroke="currentColor" strokeWidth="2" x1="6" x2="15" y1="9" y2="9" />
                  <circle fill="currentColor" cx="3" cy="9" r="1" />
                </svg>
                <span>Bullet List</span>
              </MenuButton>
              <MenuButton
                onClick={() => execCommand('insertOrderedList')}
                active={activeFormats.insertOrderedList}
                title="Numbered List"
              >
                <span>1.</span>
                <span>Numbered List</span>
              </MenuButton>
            </div>
            
            {/* Tablet-only options */}
            <div className="md:hidden">
              <MenuButton onClick={() => execCommand('outdent')} title="Decrease Indent">
                <span>←</span>
                <span>Decrease Indent</span>
              </MenuButton>
              <MenuButton onClick={() => execCommand('justifyLeft')} title="Align Left">
                <span>≡</span>
                <span>Align Left</span>
              </MenuButton>
            </div>
            
            {/* Desktop-hidden options */}
            <div className="lg:hidden">
              <MenuButton onClick={() => execCommand('formatBlock', 'blockquote')} title="Quote">
                <span className="text-lg">"</span>
                <span>Quote</span>
              </MenuButton>
              <MenuButton onClick={insertLink} title="Insert Link">
                <span>🔗</span>
                <span>Insert Link</span>
              </MenuButton>
              <MenuButton onClick={() => {}} title="Emoji">
                <Smile className="w-4 h-4" />
                <span>Emoji</span>
              </MenuButton>
            </div>
            
            <div className="border-t border-gray-700 mt-1 pt-1">
              <MenuButton onClick={handleClear} title="Clear Content">
                <Trash2 className="w-4 h-4" />
                <span>Clear Content</span>
              </MenuButton>
            </div>
            
            <div className="px-4 py-2 border-t border-gray-700">
              <label className="text-gray-400 text-xs mb-1 block">Font Size</label>
              <select
                onChange={(e) => {
                  execCommand('fontSize', e.target.value);
                  setShowMoreMenu(false);
                }}
                className="w-full h-8 px-2 bg-gray-700 hover:bg-gray-600 rounded cursor-pointer text-sm text-gray-200 border border-gray-600"
                defaultValue="3"
              >
                <option value="1" className="bg-[var(--chakra-colors-droidal-black-300)]">Small</option>
                <option value="3" className="bg-[var(--chakra-colors-droidal-black-300)]">Normal</option>
                <option value="5" className="bg-[var(--chakra-colors-droidal-black-300)]">Large</option>
                <option value="7" className="bg-[var(--chakra-colors-droidal-black-300)]">Huge</option>
              </select>
            </div>
          </div>
        )}

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="min-h-[60px] p-4 text-[15px] text-gray-100 outline-none focus:outline-none"
          data-placeholder="Type a message"
          suppressContentEditableWarning
        />

        {/* Bottom Action Bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-700 bg-[var(--chakra-colors-droidal-black-300)]">
          <button 
            onClick={() => setShowToolbar(!showToolbar)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              showToolbar ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-300'
            }`}
            title="Toggle formatting toolbar"
          >
            <Type className="w-5 h-5" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center hover:bg-gray-700 rounded-lg transition-colors">
            <Smile className="w-5 h-5 text-gray-300" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center hover:bg-gray-700 rounded-lg transition-colors">
            <AtSign className="w-5 h-5 text-gray-300" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center hover:bg-gray-700 rounded-lg transition-colors">
            <Plus className="w-5 h-5 text-gray-300" />
          </button>
          
          <button 
            onClick={handleSend}
            disabled={!content.trim()}
            className="ml-auto w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #6b7280;
          pointer-events: none;
          position: absolute;
        }
        
        [contenteditable]:focus {
          outline: none;
        }
        
        [contenteditable] blockquote {
          border-left: 4px solid #4b5563;
          padding-left: 16px;
          margin: 8px 0;
          color: #9ca3af;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 24px;
          margin: 8px 0;
        }
        
        [contenteditable] a {
          color: #60a5fa;
          text-decoration: underline;
        }
      `}</style>
    </>
  );
};

export default RichTextEditor;