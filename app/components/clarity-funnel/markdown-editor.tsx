'use client';

import { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoSave?: boolean;
  onSave?: (value: string) => void;
  autoSaveDelay?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your PRD in markdown...',
  className,
  autoSave = true,
  onSave,
  autoSaveDelay = 2000,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDirty, setIsDirty] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && isDirty && onSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        onSave(value);
        setIsDirty(false);
      }, autoSaveDelay);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [value, isDirty, autoSave, onSave, autoSaveDelay]);

  // Handle text changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsDirty(true);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }

    // Handle Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      insertMarkdownFormat('**', '**', 'bold text');
    }

    // Handle Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      insertMarkdownFormat('*', '*', 'italic text');
    }

    // Handle Ctrl/Cmd + K for link
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      insertMarkdownFormat('[', '](url)', 'link text');
    }

    // Handle Ctrl/Cmd + S for manual save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (onSave) {
        onSave(value);
        setIsDirty(false);
      }
    }
  };

  // Insert markdown formatting
  const insertMarkdownFormat = (before: string, after: string, placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newValue = 
      value.substring(0, start) + 
      before + textToInsert + after + 
      value.substring(end);
    
    onChange(newValue);
    
    // Set cursor position
    setTimeout(() => {
      if (selectedText) {
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = start + before.length + selectedText.length;
      } else {
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = start + before.length + placeholder.length;
      }
      textarea.focus();
    }, 0);
  };

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div className={clsx('relative', className)}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={clsx(
          'w-full p-4 border border-gray-300 rounded-lg',
          'font-mono text-sm leading-relaxed',
          'resize-none overflow-hidden',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'placeholder:text-gray-400',
          'min-h-[300px]'
        )}
        spellCheck={false}
      />
      
      {/* Auto-save indicator */}
      {autoSave && (
        <div className="absolute top-2 right-2 text-xs text-gray-500">
          {isDirty ? 'Unsaved changes...' : 'Saved'}
        </div>
      )}
      
      {/* Toolbar with shortcuts hint */}
      <div className="mt-2 text-xs text-gray-400 flex flex-wrap gap-4">
        <span>Shortcuts:</span>
        <span><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl/Cmd + B</kbd> Bold</span>
        <span><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl/Cmd + I</kbd> Italic</span>
        <span><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl/Cmd + K</kbd> Link</span>
        <span><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl/Cmd + S</kbd> Save</span>
        <span><kbd className="px-1 py-0.5 bg-gray-100 rounded">Tab</kbd> Indent</span>
      </div>
    </div>
  );
}