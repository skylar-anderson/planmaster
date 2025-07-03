'use client';

import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { PRD, createNewPRD } from '@/app/types/prd';
import { PRDService } from '@/lib/storage/prd-service';
import { MarkdownEditor } from './markdown-editor';
import { MarkdownPreview } from './markdown-preview';
import { ChatAssistant } from './chat-assistant';
import { ContextLinker } from './context-linker';

interface PRDEditorProps {
  contextItemIds?: string[];
  className?: string;
  onPRDSaved?: (prd: PRD) => void;
}

export function PRDEditor({ 
  contextItemIds = [], 
  className,
  onPRDSaved 
}: PRDEditorProps) {
  const [currentPRD, setCurrentPRD] = useState<PRD | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isContextLinkerOpen, setIsContextLinkerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const loadCurrentPRD = useCallback(async () => {
    setIsLoading(true);
    try {
      const prd = await PRDService.getCurrentPRD();
      if (prd) {
        setCurrentPRD(prd);
      } else {
        // Create a new PRD if none exists
        const newPRD = createNewPRD(
          'Untitled PRD',
          '',
          contextItemIds
        );
        setCurrentPRD(newPRD);
        // Save the new PRD to storage
        await PRDService.savePRD(newPRD);
        await PRDService.setCurrentPRD(newPRD.id);
      }
    } catch (error) {
      console.error('Failed to load PRD:', error);
      // Fallback to creating a new PRD
      const newPRD = createNewPRD('Untitled PRD', '', contextItemIds);
      setCurrentPRD(newPRD);
    } finally {
      setIsLoading(false);
    }
  }, [contextItemIds]);

  // Load current PRD on mount
  useEffect(() => {
    loadCurrentPRD();
  }, [loadCurrentPRD]);

  const handleSave = useCallback(async (markdown: string) => {
    if (!currentPRD) return;

    setIsSaving(true);
    try {
      const updated = await PRDService.autoSavePRD(currentPRD.id, markdown);
      if (updated) {
        setCurrentPRD(updated);
        setLastSaved(new Date());
        onPRDSaved?.(updated);
      }
    } catch (error) {
      console.error('Failed to save PRD:', error);
    } finally {
      setIsSaving(false);
    }
  }, [currentPRD, onPRDSaved]);

  const handleTitleChange = async (newTitle: string) => {
    if (!currentPRD) return;

    try {
      const updated = await PRDService.updatePRD(currentPRD.id, { title: newTitle });
      if (updated) {
        setCurrentPRD(updated);
        onPRDSaved?.(updated);
      }
    } catch (error) {
      console.error('Failed to update title:', error);
    }
  };

  const handleMarkdownChange = (newMarkdown: string) => {
    if (!currentPRD) return;

    setCurrentPRD(prev => prev ? {
      ...prev,
      markdown: newMarkdown,
      updatedAt: new Date(),
    } : null);
  };

  const handleContextLinked = async (contextId: string) => {
    if (!currentPRD) return;

    const newContextIds = [...currentPRD.sourceContextItemIds, contextId];
    try {
      const updated = await PRDService.updatePRD(currentPRD.id, {
        sourceContextItemIds: newContextIds
      });
      if (updated) {
        setCurrentPRD(updated);
        onPRDSaved?.(updated);
      }
    } catch (error) {
      console.error('Failed to link context:', error);
    }
  };

  const handleContextUnlinked = async (contextId: string) => {
    if (!currentPRD) return;

    const newContextIds = currentPRD.sourceContextItemIds.filter(id => id !== contextId);
    try {
      const updated = await PRDService.updatePRD(currentPRD.id, {
        sourceContextItemIds: newContextIds
      });
      if (updated) {
        setCurrentPRD(updated);
        onPRDSaved?.(updated);
      }
    } catch (error) {
      console.error('Failed to unlink context:', error);
    }
  };

  const handleChatSuggestion = (suggestion: string) => {
    if (!currentPRD) return;

    // Insert suggestion at the end of the document
    const newMarkdown = currentPRD.markdown + (currentPRD.markdown ? '\n\n' : '') + suggestion;
    handleMarkdownChange(newMarkdown);
  };

  const handleCreateNewPRD = async () => {
    try {
      const newPRD = await PRDService.createPRD('Untitled PRD', '', contextItemIds);
      setCurrentPRD(newPRD);
      onPRDSaved?.(newPRD);
    } catch (error) {
      console.error('Failed to create new PRD:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={clsx('flex items-center justify-center h-64', className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentPRD) {
    return (
      <div className={clsx('flex items-center justify-center h-64', className)}>
        <div className="text-center">
          <p className="text-gray-500 mb-4">No PRD loaded</p>
          <button
            onClick={handleCreateNewPRD}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create New PRD
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex-1">
          <input
            type="text"
            value={currentPRD.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 w-full"
            placeholder="Enter PRD title..."
          />
          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
            <span>Version {currentPRD.version}</span>
            <span>{currentPRD.isDraft ? 'Draft' : 'Published'}</span>
            {lastSaved && (
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            )}
            {isSaving && <span className="text-blue-600">Saving...</span>}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsContextLinkerOpen(!isContextLinkerOpen)}
            className={clsx(
              'px-3 py-1 text-sm rounded-md transition-colors',
              isContextLinkerOpen
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            Sources ({currentPRD.sourceContextItemIds.length})
          </button>
          
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={clsx(
              'px-3 py-1 text-sm rounded-md transition-colors',
              isPreview
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {isPreview ? 'Edit' : 'Preview'}
          </button>
          
          <button
            onClick={handleCreateNewPRD}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            New PRD
          </button>
        </div>
      </div>

      {/* Context Linker Panel */}
      {isContextLinkerOpen && (
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <ContextLinker
            linkedContextIds={currentPRD.sourceContextItemIds}
            onContextLinked={handleContextLinked}
            onContextUnlinked={handleContextUnlinked}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor/Preview Area */}
        <div className="flex-1 flex flex-col">
          {isPreview ? (
            <div className="flex-1 overflow-y-auto p-6">
              <MarkdownPreview markdown={currentPRD.markdown} />
            </div>
          ) : (
            <div className="flex-1 p-4">
              <MarkdownEditor
                value={currentPRD.markdown}
                onChange={handleMarkdownChange}
                onSave={handleSave}
                autoSave={true}
                autoSaveDelay={2000}
                className="h-full"
              />
            </div>
          )}
        </div>

        {/* Chat Assistant Panel */}
        <div className="w-80 border-l border-gray-200 flex flex-col">
          <ChatAssistant
            isOpen={isChatOpen}
            onToggle={() => setIsChatOpen(!isChatOpen)}
            onSuggestion={handleChatSuggestion}
            currentContext={currentPRD.markdown}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}