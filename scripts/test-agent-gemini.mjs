import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
let apiKey = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('GEMINI_API_KEY=')) {
    apiKey = line.replace('GEMINI_API_KEY=', '').trim();
  }
}

async function testFullLoop() {
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-3.6-flash';

  const tools = [{
    functionDeclarations: [{
      name: 'get_schedules',
      description: 'Fetch class timetable/schedules. Returns classes for day.',
      parameters: {
        type: 'OBJECT',
        properties: {
          day: { type: 'STRING', description: 'Day of week' }
        }
      }
    }]
  }];

  const contents = [
    { role: 'user', parts: [{ text: 'What classes do I have on Wednesday?' }] }
  ];

  console.log('Sending first round...');
  const res1 = await ai.models.generateContent({
    model,
    contents,
    config: { tools }
  });

  console.log('Round 1 functionCalls:', res1.functionCalls);

  if (res1.functionCalls && res1.functionCalls.length > 0) {
    const fc = res1.functionCalls[0];
    console.log('Function called:', fc.name, fc.args, 'id:', fc.id);

    // Check how response.candidates[0].content looks:
    console.log('Candidate content parts:', JSON.stringify(res1.candidates?.[0]?.content?.parts, null, 2));

    const updatedHistory = [...contents];
    
    // Add model turn
    updatedHistory.push(res1.candidates[0].content);

    // Mock tool result
    const toolResult = [
      { course: 'CSE 4113', title: 'Data Communication', start_time: '08:00', end_time: '09:15', room: '7A03' }
    ];

    // Add function response
    updatedHistory.push({
      role: 'user',
      parts: [{
        functionResponse: {
          name: fc.name,
          id: fc.id, // check if id is needed/allowed
          response: { result: toolResult }
        }
      }]
    });

    console.log('Sending round 2 with tool response...');
    const res2 = await ai.models.generateContent({
      model,
      contents: updatedHistory,
      config: { tools }
    });

    console.log('Round 2 text:', res2.text);
  }
}

testFullLoop().catch(console.error);
