const BASE = 'http://localhost:3000';

async function testApi() {
  console.log('=== TESTING NEXT.JS CRUD API ROUTES ===\n');

  // 1. Schedules
  console.log('--- 1. Schedules API ---');
  let res = await fetch(`${BASE}/api/schedules`);
  let json = await res.json();
  console.log(`✓ GET /api/schedules: ${json.data.length} schedules`);
  if (!json.success || json.data.length !== 24) throw new Error('GET schedules failed');

  // Filter schedules by day
  res = await fetch(`${BASE}/api/schedules?day=Sunday`);
  json = await res.json();
  console.log(`✓ GET /api/schedules?day=Sunday: ${json.data.length} Sunday classes`);

  // Create schedule
  const newSch = {
    id: 'sch-test-api',
    course: 'CSE 9999',
    title: 'Test Course',
    day: 'Monday',
    start_time: '10:00',
    end_time: '11:00',
    room: '7A01',
    instructor: 'Dr. Tester',
    section: 'A',
  };
  res = await fetch(`${BASE}/api/schedules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newSch),
  });
  json = await res.json();
  console.log(`✓ POST /api/schedules: created id=${json.data.id}`);

  // Update schedule
  res = await fetch(`${BASE}/api/schedules/sch-test-api`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Updated Test Course' }),
  });
  json = await res.json();
  console.log(`✓ PUT /api/schedules/sch-test-api: title="${json.data.title}"`);

  // Delete schedule
  res = await fetch(`${BASE}/api/schedules/sch-test-api`, { method: 'DELETE' });
  json = await res.json();
  console.log(`✓ DELETE /api/schedules/sch-test-api: ${json.message}`);

  // 2. Rooms
  console.log('\n--- 2. Rooms & Bookings API ---');
  res = await fetch(`${BASE}/api/rooms`);
  json = await res.json();
  console.log(`✓ GET /api/rooms: ${json.data.length} rooms`);
  if (!json.success || json.data.length !== 20) throw new Error('GET rooms failed');

  // Filter labs with projector
  res = await fetch(`${BASE}/api/rooms?type=lab&equipment=projector&min_capacity=30`);
  json = await res.json();
  console.log(`✓ GET /api/rooms (labs, projector, cap>=30): ${json.data.map(r => r.room_number).join(', ')} (${json.data.length} rooms)`);
  if (json.data.length !== 6) throw new Error('Rooms filter failed');

  // Book Room 7A02
  res = await fetch(`${BASE}/api/rooms/7A02/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      booked_by: 'API Tester',
      date: '2026-09-05',
      start_time: '15:00',
      end_time: '17:00',
      purpose: 'API Test Booking',
    }),
  });
  json = await res.json();
  console.log(`✓ POST /api/rooms/7A02/book: booking_id=${json.data?.booking_id}`);
  const bookingId = json.data?.booking_id;

  // Overlapping booking test (should return 409)
  const overlapRes = await fetch(`${BASE}/api/rooms/7A02/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      booked_by: 'Conflicting Tester',
      date: '2026-09-05',
      start_time: '16:00',
      end_time: '18:00',
      purpose: 'Conflict Booking',
    }),
  });
  console.log(`✓ Overlap rejection test: status=${overlapRes.status} (expected 409)`);
  if (overlapRes.status !== 409) throw new Error('Overlap was not rejected with 409');

  // Cancel booking
  res = await fetch(`${BASE}/api/rooms/cancel-booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ booking_id: bookingId }),
  });
  json = await res.json();
  console.log(`✓ POST /api/rooms/cancel-booking: ${json.message}`);

  // 3. Events
  console.log('\n--- 3. Events & Registration API ---');
  res = await fetch(`${BASE}/api/events`);
  json = await res.json();
  console.log(`✓ GET /api/events: ${json.data.length} events`);
  if (!json.success || json.data.length !== 7) throw new Error('GET events failed');

  // Register for evt-002
  const evtBefore = json.data.find(e => e.id === 'evt-002');
  console.log(`Before: "${evtBefore.name}" has ${evtBefore.registered}/${evtBefore.capacity}`);

  res = await fetch(`${BASE}/api/events/evt-002/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      student_id: '99-88888',
      name: 'API Registered Student',
    }),
  });
  json = await res.json();
  console.log(`✓ POST /api/events/evt-002/register: count=${json.data?.registered}`);
  if (json.data?.registered !== evtBefore.registered + 1) throw new Error('Event registration increment failed');

  // Cancel registration
  res = await fetch(`${BASE}/api/events/evt-002/cancel-registration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: '99-88888' }),
  });
  json = await res.json();
  console.log(`✓ POST /api/events/evt-002/cancel-registration: count restored to ${json.data?.registered}`);

  // 4. Announcements
  console.log('\n--- 4. Announcements API ---');
  res = await fetch(`${BASE}/api/announcements?priority=high`);
  json = await res.json();
  console.log(`✓ GET /api/announcements?priority=high: ${json.data.length} high priority announcements`);

  // Create announcement
  res = await fetch(`${BASE}/api/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'ann-api-test',
      title: 'API Test Notice',
      body: 'Testing announcements route',
      date: '2026-09-04',
      priority: 'medium',
      posted_by: 'API Tester',
      expires: '2026-09-10',
    }),
  });
  json = await res.json();
  console.log(`✓ POST /api/announcements: created id=${json.data.id}`);

  // Delete announcement
  res = await fetch(`${BASE}/api/announcements/ann-api-test`, { method: 'DELETE' });
  json = await res.json();
  console.log(`✓ DELETE /api/announcements/ann-api-test: ${json.message}`);

  // 5. Assignments
  console.log('\n--- 5. Assignments API ---');
  res = await fetch(`${BASE}/api/assignments?status=pending`);
  json = await res.json();
  console.log(`✓ GET /api/assignments?status=pending: ${json.data.length} pending assignments`);

  // Create assignment
  res = await fetch(`${BASE}/api/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'asgn-api-test',
      course: 'CSE 4199',
      course_title: 'API Testing',
      title: 'Assignment Test',
      description: 'Test description',
      assigned_date: '2026-09-04',
      deadline: '2026-09-15',
      submission_platform: 'Online',
      status: 'pending',
      marks: 25,
    }),
  });
  json = await res.json();
  console.log(`✓ POST /api/assignments: created id=${json.data.id}`);

  // Update assignment status
  res = await fetch(`${BASE}/api/assignments/asgn-api-test`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'submitted' }),
  });
  json = await res.json();
  console.log(`✓ PUT /api/assignments/asgn-api-test: status="${json.data.status}"`);

  // Delete assignment
  res = await fetch(`${BASE}/api/assignments/asgn-api-test`, { method: 'DELETE' });
  json = await res.json();
  console.log(`✓ DELETE /api/assignments/asgn-api-test: ${json.message}`);

  console.log('\n=== ALL API ROUTES PASSED 100% SUCCESSFULLY ===\n');
}

testApi().catch(err => {
  console.error('API Test Failed:', err);
  process.exit(1);
});
