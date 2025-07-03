import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PRDEditor } from '@/app/components/clarity-funnel/prd-editor';

const mockPRD = {
  id: 'test-id',
  title: 'Test PRD',
  markdown: '',
  updatedAt: new Date(),
  createdAt: new Date(),
  sourceContextItemIds: [],
  version: 1,
  isDraft: true,
};

// Mock the storage service
jest.mock('@/lib/storage/prd-service', () => ({
  PRDService: {
    getCurrentPRD: jest.fn(() => Promise.resolve(mockPRD)),
    createPRD: jest.fn(() => Promise.resolve(mockPRD)),
    savePRD: jest.fn(() => Promise.resolve()),
    setCurrentPRD: jest.fn(() => Promise.resolve()),
    autoSavePRD: jest.fn(),
    updatePRD: jest.fn(),
  },
}));

// Mock the markdown components
jest.mock('@/app/components/clarity-funnel/markdown-editor', () => ({
  MarkdownEditor: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea 
      data-testid="markdown-editor" 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
    />
  ),
}));

jest.mock('@/app/components/clarity-funnel/markdown-preview', () => ({
  MarkdownPreview: ({ markdown }: { markdown: string }) => (
    <div data-testid="markdown-preview">{markdown}</div>
  ),
}));

jest.mock('@/app/components/clarity-funnel/chat-assistant', () => ({
  ChatAssistant: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid="chat-assistant" style={{ display: isOpen ? 'block' : 'none' }}>
      Chat Assistant
    </div>
  ),
}));

jest.mock('@/app/components/clarity-funnel/context-linker', () => ({
  ContextLinker: () => <div data-testid="context-linker">Context Linker</div>,
}));

describe('PRDEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    render(<PRDEditor />);
    
    // Should eventually show the PRD title input
    const titleInput = await screen.findByDisplayValue('Test PRD');
    expect(titleInput).toBeInTheDocument();
  });

  it('displays new PRD button', async () => {
    render(<PRDEditor />);
    
    // Wait for loading to complete and check for new PRD button
    const newButton = await screen.findByText(/new prd/i);
    expect(newButton).toBeInTheDocument();
  });

  it('accepts context item IDs', async () => {
    const contextIds = ['context-1', 'context-2'];
    render(<PRDEditor contextItemIds={contextIds} />);
    
    // Component should render without errors and show sources count
    const sourcesButton = await screen.findByText(/sources \(0\)/i);
    expect(sourcesButton).toBeInTheDocument();
  });
});