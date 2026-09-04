import { executeTool } from '../lib/agent-tools.js';

async function testTools() {
  console.log('Testing executeTool:');

  const s = await executeTool('get_schedules', { day: 'Wednesday' });
  console.log('get_schedules:', Array.isArray(s.result) ? `${s.result.length} items` : s.result);

  const r = await executeTool('get_rooms', { type: 'lab' });
  console.log('get_rooms:', Array.isArray(r.result) ? `${r.result.length} items` : r.result);

  const e = await executeTool('get_events', {});
  console.log('get_events:', Array.isArray(e.result) ? `${e.result.length} items` : e.result);

  const a = await executeTool('get_announcements', {});
  console.log('get_announcements:', Array.isArray(a.result) ? `${a.result.length} items` : a.result);

  const as = await executeTool('get_assignments', {});
  console.log('get_assignments:', Array.isArray(as.result) ? `${as.result.length} items` : as.result);

  console.log('All read tools executed successfully!');
}

testTools().catch(console.error);
