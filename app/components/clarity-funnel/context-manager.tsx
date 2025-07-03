'use client';

import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { ContextItem, CreateContextItem, UpdateContextItem, ContextFilter, ContextCategory } from '@/types/context';
import { ContextService } from '@/lib/storage/context-service';
import { ContextItemCard } from './context-item-card';
import { ToastContainer, ToastProps } from './toast';

interface ContextManagerProps {
  className?: string;
}

export function ContextManager({ className }: ContextManagerProps) {
  const [items, setItems] = useState<ContextItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ContextCategory | 'all'>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Toast helper functions
  const addToast = useCallback((message: string, type: ToastProps['type'] = 'info') => {
    const id = crypto.randomUUID();
    const toast: ToastProps = {
      id,
      message,
      type,
      onClose: (toastId) => setToasts(prev => prev.filter(t => t.id !== toastId))
    };
    setToasts(prev => [...prev, toast]);
  }, []);

  // Load items from storage
  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filter: ContextFilter = {
        searchTerm: searchTerm || undefined,
        categories: selectedCategory !== 'all' ? [selectedCategory] : undefined,
        isArchived: showArchived ? true : undefined,
        limit: 100,
        offset: 0
      };
      
      const loadedItems = await ContextService.getAll(filter);
      setItems(loadedItems);
      
      // Load available tags
      const tags = await ContextService.getAllTags();
      setAvailableTags(tags);
    } catch (err) {
      console.error('Failed to load context items:', err);
      setError('Failed to load context items. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, showArchived]);

  // Load items on mount and when filters change
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Create new context item
  const handleCreate = async (data: CreateContextItem) => {
    try {
      setError(null);
      const newItem = await ContextService.create(data);
      setItems(prev => [newItem, ...prev]);
      setIsAddingNew(false);
      addToast('Context item created successfully', 'success');
      return newItem;
    } catch (err) {
      console.error('Failed to create context item:', err);
      const errorMessage = 'Failed to create context item. Please try again.';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      throw err;
    }
  };

  // Add new item with default values
  const handleAddNew = async () => {
    const newItemData: CreateContextItem = {
      title: 'New Context Item',
      contentMd: '',
      category: 'note',
      tags: [],
      isArchived: false
    };
    
    try {
      const newItem = await handleCreate(newItemData);
      setEditingId(newItem.id);
    } catch (err) {
      // Error already handled in handleCreate
    }
  };

  // Update context item
  const handleUpdate = async (updates: UpdateContextItem) => {
    try {
      setError(null);
      const updatedItem = await ContextService.update(updates);
      if (updatedItem) {
        setItems(prev => prev.map(item => 
          item.id === updatedItem.id ? updatedItem : item
        ));
        setEditingId(null);
        addToast('Context item updated successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to update context item:', err);
      const errorMessage = 'Failed to update context item. Please try again.';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      throw err; // Re-throw so ContextItemCard can handle validation errors
    }
  };

  // Delete context item
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this context item?')) {
      return;
    }
    
    try {
      setError(null);
      const deleted = await ContextService.delete(id);
      if (deleted) {
        setItems(prev => prev.filter(item => item.id !== id));
        if (editingId === id) {
          setEditingId(null);
        }
        addToast('Context item deleted successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to delete context item:', err);
      const errorMessage = 'Failed to delete context item. Please try again.';
      setError(errorMessage);
      addToast(errorMessage, 'error');
    }
  };

  // Archive/unarchive context item
  const handleArchive = async (id: string, isArchived: boolean) => {
    try {
      setError(null);
      const updatedItem = await ContextService.archive(id, isArchived);
      if (updatedItem) {
        setItems(prev => prev.map(item => 
          item.id === updatedItem.id ? updatedItem : item
        ));
        addToast(
          isArchived ? 'Context item archived' : 'Context item unarchived', 
          'success'
        );
      }
    } catch (err) {
      console.error('Failed to archive context item:', err);
      const errorMessage = 'Failed to archive context item. Please try again.';
      setError(errorMessage);
      addToast(errorMessage, 'error');
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setShowArchived(false);
  };

  // Get item count text
  const getItemCountText = () => {
    const total = items.length;
    if (total === 0) return 'No items found';
    if (total === 1) return '1 item';
    return `${total} items`;
  };

  return (
    <>
      <ToastContainer toasts={toasts} />
      <div className={clsx('flex flex-col h-full', className)}>
        {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Context Items</h2>
          <button
            onClick={handleAddNew}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Context
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search context items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Category filter and toggles */}
          <div className="flex items-center gap-4 flex-wrap">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ContextCategory | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Categories</option>
              <option value="requirement">Requirements</option>
              <option value="feature">Features</option>
              <option value="constraint">Constraints</option>
              <option value="assumption">Assumptions</option>
              <option value="note">Notes</option>
              <option value="other">Other</option>
            </select>

            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
              />
              Show archived
            </label>

            {(searchTerm || selectedCategory !== 'all' || showArchived) && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-500">
            {getItemCountText()}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex-shrink-0 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2 text-gray-500">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading context items...</span>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium mb-2">No context items found</h3>
            <p className="text-center max-w-md">
              {searchTerm || selectedCategory !== 'all' || showArchived 
                ? "Try adjusting your filters or clear them to see more items."
                : "Get started by adding your first context item to capture project requirements, features, constraints, and notes."}
            </p>
            {(!searchTerm && selectedCategory === 'all' && !showArchived) && (
              <button
                onClick={handleAddNew}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Your First Context Item
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {items.map((item) => (
              <ContextItemCard
                key={item.id}
                item={item}
                onEdit={(item) => setEditingId(item.id)}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                isEditing={editingId === item.id}
                onCancelEdit={() => setEditingId(null)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Available tags (for reference) */}
      {availableTags.length > 0 && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 p-3">
          <div className="text-xs text-gray-500 mb-2">Available tags:</div>
          <div className="flex flex-wrap gap-1">
            {availableTags.slice(0, 10).map((tag) => (
              <span
                key={tag}
                onClick={() => setSearchTerm(tag)}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"
              >
                #{tag}
              </span>
            ))}
            {availableTags.length > 10 && (
              <span className="text-xs text-gray-400">
                +{availableTags.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}
      </div>
    </>
  );
}