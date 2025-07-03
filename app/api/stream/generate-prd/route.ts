import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { aiModel, aiConfig } from '@/lib/ai';
import { storage } from '@/lib/storage';
import { ContextItem } from '@/types/context';
import { createNewPRD } from '@/app/types/prd';
import { mapToAIError, getUserFriendlyErrorMessage } from '@/lib/ai/errors';
import { 
  shouldUseMocks, 
  mockPRDStream, 
  getMockScenario, 
  simulateError, 
  MOCK_SCENARIOS 
} from '@/lib/ai/mocks';

export async function POST(request: NextRequest) {
  try {
    const { contextItemIds } = await request.json();

    if (!contextItemIds || !Array.isArray(contextItemIds)) {
      return NextResponse.json(
        { error: 'contextItemIds must be an array' },
        { status: 400 }
      );
    }

    // Fetch context items from storage
    const contextItems = await Promise.all(
      contextItemIds.map(id => storage.get<ContextItem>(`context:${id}`))
    );
    
    // Filter out null items and format context text
    const validContextItems = contextItems.filter((item): item is ContextItem => item !== null);
    
    if (validContextItems.length === 0) {
      return NextResponse.json(
        { error: 'No valid context items found' },
        { status: 400 }
      );
    }

    // Create structured context text for the AI prompt
    const contextText = validContextItems
      .map(item => {
        const categoryLabel = item.category.charAt(0).toUpperCase() + item.category.slice(1);
        const tags = item.tags.length > 0 ? ` (Tags: ${item.tags.join(', ')})` : '';
        return `## ${categoryLabel}: ${item.title}${tags}\n\n${item.contentMd}`;
      })
      .join('\n\n---\n\n');

    // Generate PRD using AI with streaming
    const { textStream } = await streamText({
      model: aiModel,
      ...aiConfig,
      prompt: `Generate a comprehensive Product Requirements Document (PRD) based on the following context items:

${contextText}

Format the PRD as a well-structured markdown document with the following sections:
1. Executive Summary
2. Problem Statement
3. Goals & Objectives
4. Requirements
5. User Stories
6. Technical Specifications
7. Acceptance Criteria
8. Timeline & Milestones
9. Risks & Mitigation
10. Success Metrics

Make sure to:
- Be specific and actionable
- Include relevant details from the context items
- Maintain consistency across sections
- Use clear, professional language
- Include technical details where appropriate

The PRD should be comprehensive enough to guide development while remaining focused and practical.`,
    });

    // Create a ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullText = '';

        try {
          for await (const chunk of textStream) {
            fullText += chunk;
            
            // Send the chunk as SSE
            const sseData = `data: ${JSON.stringify({
              type: 'chunk',
              content: chunk,
              fullContent: fullText
            })}\n\n`;
            
            controller.enqueue(encoder.encode(sseData));
          }

          // Extract title and create PRD
          const title = extractTitleFromContent(fullText) || 'Generated PRD';
          const prd = createNewPRD(title, fullText, contextItemIds);

          // Store the PRD
          await storage.set(`prd:${prd.id}`, prd);
          await storage.set('prd:current', prd);

          // Send completion message
          const completionData = `data: ${JSON.stringify({
            type: 'complete',
            prd: prd
          })}\n\n`;
          
          controller.enqueue(encoder.encode(completionData));
          controller.close();
        } catch (error) {
          const aiError = mapToAIError(error);
          const userMessage = getUserFriendlyErrorMessage(aiError);
          
          const errorData = `data: ${JSON.stringify({
            type: 'error',
            error: userMessage,
            code: aiError.code,
            originalError: aiError.originalError?.message
          })}\n\n`;
          
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    const aiError = mapToAIError(error);
    const userMessage = getUserFriendlyErrorMessage(aiError);
    
    console.error('Error in generate-prd stream:', aiError);
    
    return NextResponse.json(
      { 
        error: userMessage,
        code: aiError.code,
        originalError: aiError.originalError?.message
      },
      { status: 500 }
    );
  }
}

/**
 * Extract title from markdown content
 * @param content - Markdown content
 * @returns Extracted title or null
 */
function extractTitleFromContent(content: string): string | null {
  // Look for the first H1 heading
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Look for the first H2 heading as fallback
  const h2Match = content.match(/^##\s+(.+)$/m);
  if (h2Match) {
    return h2Match[1].trim();
  }

  return null;
}