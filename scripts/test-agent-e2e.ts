import { POST } from '../app/api/chat/route';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      process.env[key] = val;
    }
  }
}

async function testQuery(query: string, history: any[] = []) {
  console.log(`\n======================================================`);
  console.log(`PROMPT: "${query}"`);
  console.log(`======================================================`);

  const req = new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: query }],
      history,
    }),
  });

  const res = await POST(req);
  const data = await res.json();

  if (!data.success) {
    console.error('❌ FAILED:', data.error);
    return null;
  }

  console.log('✅ SUCCESS!');
  console.log('Tool Calls:', JSON.stringify(data.toolCalls, null, 2));
  console.log('Response:\n', data.response);
  return data.history;
}

async function runAllTests() {
  // Test 1: Simple lookup
  await testQuery('When is my next class?');

  // Test 2: Wednesday classes
  await testQuery('What classes do I have on Wednesday?');

  // Test 3: Assignments due
  await testQuery('What assignments do I have due this week?');

  // Test 4: Vague request (should ask for clarification)
  await testQuery('Just book me any room tomorrow afternoon.');

  // Test 5: Multi-source free time
  await testQuery("I'm free until 2 PM — is there anything on campus I could drop into?");

  // Test 6: Labs with projector
  await testQuery('Which labs have a projector and can fit at least 30 people?');
}

runAllTests().catch(console.error);
