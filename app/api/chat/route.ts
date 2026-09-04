import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { TOOL_DECLARATIONS, executeTool } from '@/lib/agent-tools';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/* ------------------------------------------------------------------ */
/*  System prompt — persona + behavioral rules for the campus agent   */
/* ------------------------------------------------------------------ */
const SYSTEM_PROMPT = `You are CampusOS AI — the official intelligent assistant for Ahsanullah University of Science and Technology (AUST).

IDENTITY:
• You speak as a friendly, knowledgeable campus aide — like a helpful senior who knows everything about AUST.
• The current user is Sakibul Hassan (Student ID: 20-40532) unless stated otherwise.
• Today is ${new Date().toISOString().split('T')[0]} (${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]}).

DATA ACCESS:
• You MUST call the provided tools/functions to answer ANY question about schedules, rooms, events, announcements, or assignments.
• NEVER answer from memory or make up data. If you're unsure, call the tool first.
• Every tool call reads the LIVE database, so data changed moments ago via the dashboard is immediately visible.

BEHAVIORAL RULES:
1. AMBIGUITY → ASK: If a request is vague (e.g. "book me any room"), ask the user for specifics (which room, what time, what date) BEFORE taking action. Never guess.
2. BOOKING/REGISTRATION → CONFIRM: Before booking a room or registering for an event, confirm with the user. Show them what you're about to do.
3. MULTI-STEP: Some queries need multiple tool calls (e.g. "Am I free until 2?" needs schedules AND events). Call as many tools as needed.
4. FORMATTING: Use clear, concise responses. Use markdown formatting for readability (bullet points, bold text, tables where appropriate).
5. ERRORS: If a tool returns an error, explain it clearly to the user. Never swallow errors.
6. SCOPE: You only know campus data. For questions outside your scope, politely say so.
7. WHEN LISTING SCHEDULES: Present them grouped by day or course for readability.
8. DEFAULT STUDENT: When booking or registering on behalf of the user, use name "Sakibul Hassan" and ID "20-40532" unless they specify otherwise.

AVAILABLE SYSTEMS:
1. Schedules — class timetable (course, day, time, room, instructor, section)
2. Rooms & Bookings — campus rooms (type, capacity, equipment) + booking management
3. Events — campus events (guest lectures, hackathons, workshops) + registration
4. Announcements — official university notices (priority levels, expiry)
5. Assignments — coursework deadlines and submission status`;

/* ------------------------------------------------------------------ */
/*  Build the Gemini-compatible tool config from our declarations      */
/* ------------------------------------------------------------------ */
function buildToolsConfig() {
  return [
    {
      functionDeclarations: TOOL_DECLARATIONS.map((d) => ({
        name: d.name,
        description: d.description,
        parameters: d.parameters,
      })),
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  POST /api/chat                                                     */
/*  Body: { messages: [{ role, content }], history?: Content[] }       */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY not set. Add it to .env.local' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { messages, history } = body as {
      messages: { role: string; content: string }[];
      history?: any[];
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No messages provided' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Build the contents array from the conversation history
    const contents: any[] = [];

    // Add prior conversation history if provided
    if (history && history.length > 0) {
      contents.push(...history);
    }

    // Add the latest user message
    const latestMessage = messages[messages.length - 1];
    contents.push({
      role: 'user',
      parts: [{ text: latestMessage.content }],
    });

    // Tool calling loop — keep going until the model produces a text response
    const MAX_TOOL_ROUNDS = 10;
    let toolCalls: any[] = [];
    let finalText = '';
    let updatedHistory = [...contents];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: updatedHistory,
        config: {
          tools: buildToolsConfig(),
          systemInstruction: SYSTEM_PROMPT,
        },
      });

      // Check for function calls
      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        // Record model's function call turn
        updatedHistory.push({
          role: 'model',
          parts: functionCalls.map((fc: any) => ({
            functionCall: {
              name: fc.name,
              args: fc.args,
            },
          })),
        });

        // Execute each function call and collect results
        const functionResponses: any[] = [];
        for (const fc of functionCalls) {
          try {
            const { result, didMutate } = await executeTool(fc.name, fc.args || {});
            if (didMutate) {
              toolCalls.push({ name: fc.name, args: fc.args, mutated: true });
            }
            functionResponses.push({
              functionResponse: {
                name: fc.name,
                response: { result: JSON.stringify(result) },
              },
            });
          } catch (toolError: any) {
            functionResponses.push({
              functionResponse: {
                name: fc.name,
                response: { error: toolError.message },
              },
            });
          }
        }

        // Send function results back to the model
        updatedHistory.push({
          role: 'user',
          parts: functionResponses,
        });

        // Continue the loop to let the model process the results
        continue;
      }

      // No function calls — model produced a text response
      finalText = response.text || '';
      updatedHistory.push({
        role: 'model',
        parts: [{ text: finalText }],
      });
      break;
    }

    // Determine if any tool call mutated data (so the client knows to refresh the dashboard)
    const didMutate = toolCalls.some((tc) => tc.mutated);

    return NextResponse.json({
      success: true,
      response: finalText,
      didMutate,
      toolCalls: toolCalls.map((tc) => ({ name: tc.name, args: tc.args })),
      history: updatedHistory,
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
