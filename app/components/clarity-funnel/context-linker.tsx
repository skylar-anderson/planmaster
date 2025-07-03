'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

export interface ContextItem {
  id: string;
  type: 'document' | 'conversation' | 'note' | 'external';
  title: string;
  description?: string;
  url?: string;
  createdAt: Date;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface ContextLinkerProps {
  linkedContextIds: string[];
  onContextLinked: (contextId: string) => void;
  onContextUnlinked: (contextId: string) => void;
  className?: string;
}

export function ContextLinker({
  linkedContextIds,
  onContextLinked,
  onContextUnlinked,
  className
}: ContextLinkerProps) {
  const [availableContext, setAvailableContext] = useState<ContextItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ContextItem['type'] | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load available context items
  useEffect(() => {
    loadContextItems();
  }, []);

  const loadContextItems = async () => {
    setIsLoading(true);
    try {
      // Mock data - in real implementation, this would fetch from storage/API
      const mockContextItems: ContextItem[] = [
        {
          id: '1',
          type: 'document',
          title: 'User Research Summary',
          description: 'Comprehensive analysis of user pain points and needs',
          createdAt: new Date('2024-01-15'),
          tags: ['research', 'users', 'pain-points'],
        },
        {
          id: '2',
          type: 'conversation',
          title: 'Stakeholder Meeting Notes',
          description: 'Discussion about feature requirements and priorities',
          createdAt: new Date('2024-01-20'),
          tags: ['meeting', 'requirements', 'stakeholders'],
        },
        {
          id: '3',
          type: 'external',
          title: 'Competitor Analysis',
          description: 'Analysis of similar features in competitor products',
          url: 'https://example.com/competitor-analysis',
          createdAt: new Date('2024-01-18'),
          tags: ['competitive', 'analysis', 'features'],
        },
        {
          id: '4',
          type: 'note',
          title: 'Technical Constraints',
          description: 'Current system limitations and technical considerations',
          createdAt: new Date('2024-01-22'),
          tags: ['technical', 'constraints', 'architecture'],
        },
        {
          id: '5',
          type: 'document',
          title: 'Design Mockups',
          description: 'UI/UX designs for the proposed feature',
          createdAt: new Date('2024-01-25'),
          tags: ['design', 'ui', 'mockups'],
        },
      ];
      
      setAvailableContext(mockContextItems);
    } catch (error) {
      console.error('Failed to load context items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContext = availableContext.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedType === 'all' || item.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const linkedContext = availableContext.filter(item => 
    linkedContextIds.includes(item.id)
  );

  const getTypeIcon = (type: ContextItem['type']) => {
    switch (type) {
      case 'document':
        return '📄';
      case 'conversation':
        return '💬';
      case 'note':
        return '📝';
      case 'external':
        return '🔗';
      default:
        return '📋';
    }
  };

  const getTypeColor = (type: ContextItem['type']) => {
    switch (type) {
      case 'document':
        return 'bg-blue-100 text-blue-800';
      case 'conversation':
        return 'bg-green-100 text-green-800';
      case 'note':
        return 'bg-yellow-100 text-yellow-800';
      case 'external':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className={clsx('p-4', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Linked Context Items */}
      {linkedContext.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Linked Sources ({linkedContext.length})
          </h3>
          <div className="space-y-2">
            {linkedContext.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-start space-x-3 flex-1">
                  <span className="text-lg">{getTypeIcon(item.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </h4>
                      <span className={clsx(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                        getTypeColor(item.type)
                      )}>
                        {item.type}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                          >
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{item.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onContextUnlinked(item.id)}
                  className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                  title="Remove link"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          Add Context Sources
        </h3>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search context items..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ContextItem['type'] | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="document">Documents</option>
              <option value="conversation">Conversations</option>
              <option value="note">Notes</option>
              <option value="external">External</option>
            </select>
          </div>
        </div>
      </div>

      {/* Available Context Items */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredContext
          .filter(item => !linkedContextIds.includes(item.id))
          .map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-start space-x-3 flex-1">
                <span className="text-lg">{getTypeIcon(item.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </h4>
                    <span className={clsx(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      getTypeColor(item.type)
                    )}>
                      {item.type}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                    >
                      View external source →
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => onContextLinked(item.id)}
                className="ml-2 p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
                title="Link to PRD"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          ))}
        
        {filteredContext.filter(item => !linkedContextIds.includes(item.id)).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No context items found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
}