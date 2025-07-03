'use client';

import { useState } from 'react';

export function StickyHeader() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);
  const [isExpandingTasks, setIsExpandingTasks] = useState(false);

  const handleGeneratePRD = async () => {
    setIsGenerating(true);
    try {
      console.log('Generate PRD clicked');
      // TODO: Implement actual PRD generation logic
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateTasks = async () => {
    setIsCreatingTasks(true);
    try {
      console.log('Create Tasks clicked');
      // TODO: Implement actual task creation logic
    } finally {
      setIsCreatingTasks(false);
    }
  };

  const handleExpandTasks = async () => {
    setIsExpandingTasks(true);
    try {
      console.log('Expand Tasks clicked');
      // TODO: Implement actual task expansion logic
    } finally {
      setIsExpandingTasks(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 p-4">
        <button
          onClick={handleGeneratePRD}
          disabled={isGenerating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto flex items-center justify-center gap-2"
          aria-label="Generate Product Requirements Document"
        >
          {isGenerating && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          Generate PRD
        </button>
        <button
          onClick={handleCreateTasks}
          disabled={isCreatingTasks}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full sm:w-auto flex items-center justify-center gap-2"
          aria-label="Create Tasks from PRD"
        >
          {isCreatingTasks && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          Create Tasks
        </button>
        <button
          onClick={handleExpandTasks}
          disabled={isExpandingTasks}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 w-full sm:w-auto flex items-center justify-center gap-2"
          aria-label="Expand Complex Tasks"
        >
          {isExpandingTasks && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          Expand Tasks
        </button>
      </div>
    </header>
  );
}