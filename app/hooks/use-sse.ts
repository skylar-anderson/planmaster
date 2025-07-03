import { useState, useEffect, useCallback, useRef } from 'react';

export interface SSEMessage {
  type: 'chunk' | 'complete' | 'error';
  content?: string;
  fullContent?: string;
  prd?: any;
  tasks?: any[];
  error?: string;
}

export interface UseSSEOptions {
  onMessage?: (message: SSEMessage) => void;
  onComplete?: (data: any) => void;
  onError?: (error: string) => void;
  onChunk?: (chunk: string, fullContent: string) => void;
}

export function useSSE() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [content, setContent] = useState<string>('');
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const optionsRef = useRef<UseSSEOptions>({});

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setIsLoading(false);
  }, []);

  const connect = useCallback((url: string, options: UseSSEOptions = {}) => {
    // Store options for event handlers
    optionsRef.current = options;
    
    // Clean up existing connection
    disconnect();
    
    // Reset state
    setError(null);
    setData(null);
    setContent('');
    setIsLoading(true);
    
    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        setIsConnected(true);
        setIsLoading(false);
      };
      
      eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);
          
          // Call the generic message handler
          if (optionsRef.current.onMessage) {
            optionsRef.current.onMessage(message);
          }
          
          // Handle specific message types
          switch (message.type) {
            case 'chunk':
              if (message.content && message.fullContent) {
                setContent(message.fullContent);
                if (optionsRef.current.onChunk) {
                  optionsRef.current.onChunk(message.content, message.fullContent);
                }
              }
              break;
              
            case 'complete':
              setData(message.prd || message.tasks);
              setIsLoading(false);
              if (optionsRef.current.onComplete) {
                optionsRef.current.onComplete(message.prd || message.tasks);
              }
              disconnect();
              break;
              
            case 'error':
              const errorMsg = message.error || 'Unknown error occurred';
              setError(errorMsg);
              setIsLoading(false);
              if (optionsRef.current.onError) {
                optionsRef.current.onError(errorMsg);
              }
              disconnect();
              break;
          }
        } catch (parseError) {
          console.error('Failed to parse SSE message:', parseError);
          setError('Failed to parse server response');
          setIsLoading(false);
          disconnect();
        }
      };
      
      eventSource.onerror = (event) => {
        console.error('SSE Error:', event);
        setError('Connection error occurred');
        setIsLoading(false);
        disconnect();
      };
      
    } catch (connectionError) {
      console.error('Failed to establish SSE connection:', connectionError);
      setError('Failed to connect to server');
      setIsLoading(false);
    }
  }, [disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    isConnected,
    isLoading,
    error,
    data,
    content,
  };
}

/**
 * Specialized hook for PRD generation with SSE
 */
export function useGeneratePRD() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [content, setContent] = useState<string>('');
  
  const generatePRD = useCallback((contextItemIds: string[], options: UseSSEOptions = {}) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    setContent('');
    
    fetch('/api/stream/generate-prd', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contextItemIds }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to start PRD generation');
      }
      
      if (!response.body) {
        throw new Error('No response body available');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data.trim()) {
                  try {
                    const message: SSEMessage = JSON.parse(data);
                    
                    // Handle message types
                    switch (message.type) {
                      case 'chunk':
                        if (message.content && message.fullContent) {
                          setContent(message.fullContent);
                          if (options.onChunk) {
                            options.onChunk(message.content, message.fullContent);
                          }
                        }
                        break;
                        
                      case 'complete':
                        setData(message.prd);
                        setIsLoading(false);
                        if (options.onComplete) {
                          options.onComplete(message.prd);
                        }
                        break;
                        
                      case 'error':
                        const errorMsg = message.error || 'Unknown error occurred';
                        setError(errorMsg);
                        setIsLoading(false);
                        if (options.onError) {
                          options.onError(errorMsg);
                        }
                        break;
                    }
                  } catch (parseError) {
                    console.error('Failed to parse SSE message:', parseError);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream reading error:', error);
          setError('Failed to read stream');
          setIsLoading(false);
        }
      };
      
      readStream();
    })
    .catch(error => {
      console.error('Failed to start PRD generation:', error);
      setError(error.message || 'Failed to start generation');
      setIsLoading(false);
    });
  }, []);

  return {
    generatePRD,
    isLoading,
    error,
    data,
    content,
  };
}

/**
 * Specialized hook for task creation with SSE
 */
export function useCreateTasks() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [content, setContent] = useState<string>('');
  
  const createTasks = useCallback((prdId: string, options: UseSSEOptions = {}) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    setContent('');
    
    fetch('/api/stream/create-tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prdId }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to start task creation');
      }
      
      if (!response.body) {
        throw new Error('No response body available');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data.trim()) {
                  try {
                    const message: SSEMessage = JSON.parse(data);
                    
                    // Handle message types
                    switch (message.type) {
                      case 'chunk':
                        if (message.content && message.fullContent) {
                          setContent(message.fullContent);
                          if (options.onChunk) {
                            options.onChunk(message.content, message.fullContent);
                          }
                        }
                        break;
                        
                      case 'complete':
                        setData(message.tasks);
                        setIsLoading(false);
                        if (options.onComplete) {
                          options.onComplete(message.tasks);
                        }
                        break;
                        
                      case 'error':
                        const errorMsg = message.error || 'Unknown error occurred';
                        setError(errorMsg);
                        setIsLoading(false);
                        if (options.onError) {
                          options.onError(errorMsg);
                        }
                        break;
                    }
                  } catch (parseError) {
                    console.error('Failed to parse SSE message:', parseError);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream reading error:', error);
          setError('Failed to read stream');
          setIsLoading(false);
        }
      };
      
      readStream();
    })
    .catch(error => {
      console.error('Failed to start task creation:', error);
      setError(error.message || 'Failed to start creation');
      setIsLoading(false);
    });
  }, []);

  return {
    createTasks,
    isLoading,
    error,
    data,
    content,
  };
}