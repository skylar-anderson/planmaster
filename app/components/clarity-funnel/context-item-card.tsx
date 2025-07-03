'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { z } from 'zod';
import { ContextItem, ContextCategory, UpdateContextItem, UpdateContextItemSchema } from '@/types/context';
import { MarkdownEditor } from './markdown-editor';
import { MarkdownPreview } from './markdown-preview';

interface ContextItemCardProps {
  item: ContextItem;
  onEdit: (item: ContextItem) => void;
  onDelete: (id: string) => void;
  onUpdate: (updates: UpdateContextItem) => Promise<void>;
  isEditing: boolean;
  onCancelEdit: () => void;
}

export function ContextItemCard({
  item,
  onEdit,
  onDelete,
  onUpdate,
  isEditing,
  onCancelEdit
}: ContextItemCardProps) {
  const [editForm, setEditForm] = useState({
    title: item.title,
    contentMd: item.contentMd,
    category: item.category,
    tags: item.tags.join(', '),
    isArchived: item.isArchived
  });
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      setValidationErrors({});
      
      const updates: UpdateContextItem = {
        id: item.id,
        title: editForm.title.trim(),
        contentMd: editForm.contentMd,
        category: editForm.category,
        tags: editForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        isArchived: editForm.isArchived,
        updatedAt: new Date()
      };
      
      // Validate updates using Zod schema
      const validatedUpdates = UpdateContextItemSchema.parse(updates);
      
      await onUpdate(validatedUpdates);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle validation errors
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        setValidationErrors(errors);
      } else {
        // Handle other errors
        console.error('Save error:', error);
        setValidationErrors({ general: 'Failed to save changes. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      title: item.title,
      contentMd: item.contentMd,
      category: item.category,
      tags: item.tags.join(', '),
      isArchived: item.isArchived
    });
    setValidationErrors({});
    setIsSubmitting(false);
    onCancelEdit();
  };

  const getCategoryColor = (category: ContextCategory) => {
    const colors = {
      requirement: 'bg-blue-100 text-blue-800 border-blue-200',
      feature: 'bg-green-100 text-green-800 border-green-200',
      constraint: 'bg-red-100 text-red-800 border-red-200',
      assumption: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      note: 'bg-gray-100 text-gray-800 border-gray-200',
      other: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[category] || colors.note;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper component for error messages
  const ErrorMessage = ({ error }: { error?: string }) => {
    if (!error) return null;
    return (
      <p className="mt-1 text-sm text-red-600">
        {error}
      </p>
    );
  };

  // Helper function to get input classes with error state
  const getInputClasses = (fieldName: string, baseClasses: string) => {
    const hasError = validationErrors[fieldName];
    return clsx(
      baseClasses,
      hasError 
        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
        : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
    );
  };

  if (isEditing) {
    return (
      <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
        {/* General error message */}
        {validationErrors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{validationErrors.general}</p>
          </div>
        )}
        
        <div className="space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className={getInputClasses('title', 'w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2')}
              placeholder="Enter title..."
              disabled={isSubmitting}
            />
            <ErrorMessage error={validationErrors.title} />
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value as ContextCategory })}
              className={getInputClasses('category', 'w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2')}
              disabled={isSubmitting}
            >
              <option value="requirement">Requirement</option>
              <option value="feature">Feature</option>
              <option value="constraint">Constraint</option>
              <option value="assumption">Assumption</option>
              <option value="note">Note</option>
              <option value="other">Other</option>
            </select>
            <ErrorMessage error={validationErrors.category} />
          </div>

          {/* Tags Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={editForm.tags}
              onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
              className={getInputClasses('tags', 'w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2')}
              placeholder="tag1, tag2, tag3..."
              disabled={isSubmitting}
            />
            <ErrorMessage error={validationErrors.tags} />
            <p className="mt-1 text-xs text-gray-500">Maximum 10 tags allowed</p>
          </div>

          {/* Content Markdown Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content (Markdown)
            </label>
            <div className={clsx(
              'rounded-md',
              validationErrors.contentMd ? 'ring-1 ring-red-300' : ''
            )}>
              <MarkdownEditor
                value={editForm.contentMd}
                onChange={(value) => setEditForm({ ...editForm, contentMd: value })}
                placeholder="Enter markdown content..."
                className="border border-gray-300 rounded-md"
                autoSave={false}
              />
            </div>
            <ErrorMessage error={validationErrors.contentMd} />
            <p className="mt-1 text-xs text-gray-500">Maximum 10,000 characters</p>
          </div>

          {/* Archive Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`archive-${item.id}`}
              checked={editForm.isArchived}
              onChange={(e) => setEditForm({ ...editForm, isArchived: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={`archive-${item.id}`} className="ml-2 block text-sm text-gray-700">
              Archive this item
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className={clsx(
                'px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm font-medium inline-flex items-center',
                isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              )}
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(
      'border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow',
      item.isArchived ? 'border-gray-200 bg-gray-50' : 'border-gray-300'
    )}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className={clsx(
            'text-lg font-semibold leading-tight',
            item.isArchived ? 'text-gray-500' : 'text-gray-900'
          )}>
            {item.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={clsx(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
              getCategoryColor(item.category)
            )}>
              {item.category}
            </span>
            {item.isArchived && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                archived
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Preview */}
      {item.contentMd && (
        <div className={clsx(
          'mb-3',
          item.isArchived ? 'opacity-60' : ''
        )}>
          <MarkdownPreview
            markdown={item.contentMd.length > 500 ? `${item.contentMd.substring(0, 500)}...` : item.contentMd}
            className="text-sm"
          />
          {item.contentMd.length > 500 && (
            <button
              onClick={() => onEdit(item)}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
            >
              View full content...
            </button>
          )}
        </div>
      )}

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags.map((tag, index) => (
            <span
              key={index}
              className={clsx(
                'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium',
                item.isArchived 
                  ? 'bg-gray-100 text-gray-500' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
        <span>Created: {formatDate(item.createdAt)}</span>
        <span>Updated: {formatDate(item.updatedAt)}</span>
      </div>
    </div>
  );
}