async function testChat(prompt) {
  console.log(`\nTesting query: "${prompt}"`);
  const t0 = Date.now();
  try {
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }]
      }),
    });

    const data = await res.json();
    console.log(`Response time: ${((Date.now() - t0)/1000).toFixed(2)}s`);
    if (!data.success) {
      console.error('❌ Error from /api/chat:', data.error);
      return false;
    }

    console.log('✅ Success!');
    console.log('Tools called:', data.toolCalls);
    console.log('Response excerpt:', data.response?.slice(0, 200) + '...');
    return true;
  } catch (err) {
    console.error('❌ Network error:', err.message);
    return false;
  }
}

async function run() {
  await testChat('When is my next class?');
  await testChat('What classes do I have on Wednesday?');
  await testChat('What assignments do I have due this week?');
}

run();
