import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { aiModel, aiConfig } from '@/lib/ai';
import { storage } from '@/lib/storage';
import { PRD } from '@/app/types/prd';
import { mapToAIError, getUserFriendlyErrorMessage } from '@/lib/ai/errors';

export async function POST(request: NextRequest) {
  try {
    const { prdId } = await request.json();

    if (!prdId) {
      return NextResponse.json(
        { error: 'prdId is required' },
        { status: 400 }
      );
    }

    const prd = await storage.get<PRD>(`prd:${prdId}`);
    if (!prd) {
      return NextResponse.json(
        { error: 'PRD not found' },
        { status: 404 }
      );
    }

    // Generate tasks using AI with streaming
    const { textStream } = await streamText({
      model: aiModel,
      ...aiConfig,
      prompt: `Convert this PRD into actionable development tasks with complexity scores (1-10):

${prd.markdown}

Return a JSON array of tasks with the following structure:
[
  {
    "id": "unique-task-id",
    "title": "Task title",
    "description": "Detailed description of what needs to be done",
    "complexity": 7,
    "status": "pending",
    "priority": "high|medium|low",
    "dependencies": ["other-task-id"],
    "estimatedHours": 8,
    "category": "frontend|backend|infrastructure|design|testing"
  }
]

Guidelines:
- Break down large features into smaller, manageable tasks
- Include setup/configuration tasks
- Add testing tasks for each feature
- Consider dependencies between tasks
- Complexity should reflect technical difficulty and time investment
- Prioritize based on business value and dependencies
- Include both development and non-development tasks (documentation, deployment, etc.)

Focus on creating 8-15 well-structured tasks that cover the entire project scope.`,
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

          // Parse the JSON response
          let tasks;
          try {
            tasks = JSON.parse(fullText);
          } catch (parseError) {
            // If JSON parsing fails, try to extract JSON from the response
            const jsonMatch = fullText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              tasks = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('Failed to parse tasks from AI response');
            }
          }

          // Validate the tasks structure
          if (!Array.isArray(tasks)) {
            throw new Error('Expected tasks to be an array');
          }

          // Store the tasks
          await storage.set(`tasks:${prdId}`, tasks);
          await storage.set('tasks:current', tasks);

          // Send completion message
          const completionData = `data: ${JSON.stringify({
            type: 'complete',
            tasks: tasks
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
    
    console.error('Error in create-tasks stream:', aiError);
    
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