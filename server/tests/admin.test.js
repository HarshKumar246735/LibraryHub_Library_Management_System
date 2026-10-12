import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, stopTestApp, clearDb, HEADERS, loginAs, makeBook, agentFor } from './helpers.js';

let app;
before(async () => { app = await startTestApp(); });
after(stopTestApp);
beforeEach(clearDb);

async function loan(student, lib, book) {
  const r = await student.post('/api/requests').set(HEADERS).send({ bookId: String(book._id) });
  return (await lib.patch(`/api/requests/${r.body.data._id}/approve`).set(HEADERS)).body.data.issue;
}

test('only admins can create staff accounts; librarians cannot', async () => {
  const { agent: admin } = await loginAs(app, 'ADMIN');
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const body = { fullName: 'New Staff', email: 'staff@example.com', password: 'Passw0rdTest', role: 'LIBRARIAN' };
  assert.equal((await lib.post('/api/members').set(HEADERS).send(body)).status, 403);
  const ok = await admin.post('/api/members').set(HEADERS).send(body);
  assert.equal(ok.status, 201);
  assert.equal(ok.body.data.password, undefined);
});

test('profile update cannot change role or status', async () => {
  const { agent: student } = await loginAs(app, 'STUDENT');
  assert.equal((await student.patch('/api/auth/profile').set(HEADERS).send({ role: 'ADMIN' })).status, 400);
  assert.equal((await student.patch('/api/auth/profile').set(HEADERS).send({ status: 'active' })).status, 400);
  assert.equal((await student.patch('/api/auth/profile').set(HEADERS).send({ fullName: 'New Name' })).status, 200);
});

test('librarians only see students; admins see everyone; search and role filter work', async () => {
  const { agent: admin } = await loginAs(app, 'ADMIN');
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  await loginAs(app, 'STUDENT');
  const asLib = await lib.get('/api/members');
  assert.ok(asLib.body.data.every((u) => u.role === 'STUDENT'));
  assert.equal((await admin.get('/api/members')).body.pagination.total, 3);
  assert.equal((await admin.get('/api/members?role=LIBRARIAN')).body.data.length, 1);
  assert.equal((await admin.get('/api/members?q=student')).body.data.length, 1);
  const adminDoc = (await admin.get('/api/members?role=ADMIN')).body.data[0];
  assert.equal((await lib.get(`/api/members/${adminDoc._id}`)).status, 404); // staff records hidden from librarians
});

test('deactivating a member with active loans is blocked; own role/status cannot be changed', async () => {
  const { agent: admin, user: adminUser } = await loginAs(app, 'ADMIN');
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const { agent: student, user } = await loginAs(app, 'STUDENT');
  const issue = await loan(student, lib, await makeBook(2));
  assert.equal((await admin.patch(`/api/members/${user._id}/status`).set(HEADERS).send({ status: 'inactive' })).status, 409);
  await lib.patch(`/api/issues/${issue._id}/return`).set(HEADERS);
  assert.equal((await admin.patch(`/api/members/${user._id}/status`).set(HEADERS).send({ status: 'inactive' })).status, 200);
  assert.equal((await admin.patch(`/api/members/${adminUser._id}/role`).set(HEADERS).send({ role: 'STUDENT' })).status, 409);
  assert.equal((await admin.patch(`/api/members/${adminUser._id}/status`).set(HEADERS).send({ status: 'inactive' })).status, 409);
});

test('a deactivated student with an existing session is locked out', async () => {
  const { agent: admin } = await loginAs(app, 'ADMIN');
  const { agent: student, user } = await loginAs(app, 'STUDENT');
  await admin.patch(`/api/members/${user._id}/status`).set(HEADERS).send({ status: 'inactive' });
  assert.equal((await student.get('/api/auth/me')).status, 403);
});

test('admin dashboard numbers come from the database', async () => {
  const { agent: admin } = await loginAs(app, 'ADMIN');
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const { agent: student } = await loginAs(app, 'STUDENT');
  const book = await makeBook(3);
  await loan(student, lib, book);
  const { summary, charts } = (await admin.get('/api/dashboard/admin')).body.data;
  assert.equal(summary.totalBooks, 1);
  assert.equal(summary.totalCopies, 3);
  assert.equal(summary.availableCopies, 2);
  assert.equal(summary.issuedBooks, 1);
  assert.equal(summary.registeredStudents, 1);
  assert.equal(charts.monthlyActivity.length, 6);
  assert.equal(charts.monthlyActivity.at(-1).issued, 1);
  assert.equal(charts.mostBorrowed[0].count, 1);
});

test('dashboards are role-scoped', async () => {
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const { agent: student } = await loginAs(app, 'STUDENT');
  assert.equal((await student.get('/api/dashboard/admin')).status, 403);
  assert.equal((await lib.get('/api/dashboard/admin')).status, 403);
  assert.equal((await lib.get('/api/dashboard/librarian')).status, 200);
  assert.equal((await student.get('/api/dashboard/student')).status, 200);
  assert.equal((await student.get('/api/reports/inventory')).status, 403);
});

test('reports: inventory, borrowing and CSV export work for staff', async () => {
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const { agent: student } = await loginAs(app, 'STUDENT');
  await loan(student, lib, await makeBook(2, { title: '=HYPERLINK("x")' }));
  assert.equal((await lib.get('/api/reports/inventory')).body.data.totals.currentlyIssued, 1);
  assert.equal((await lib.get('/api/reports/borrowing')).body.data.totals.issued, 1);
  const csv = await lib.get('/api/reports/borrowing?format=csv');
  assert.match(csv.headers['content-type'], /text\/csv/);
  assert.ok(csv.text.includes("'=HYPERLINK")); // formula neutralised
  assert.equal((await lib.get('/api/reports/borrowing?from=2026-12-01&to=2026-01-01')).status, 400);
});

test('public stats need no login and reflect real counts', async () => {
  await makeBook(4);
  const res = await agentFor(app).get('/api/public/stats');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.totalBooks, 1);
  assert.equal(res.body.data.totalCopies, 4);
});

test('notifications: created on approval, private to the owner, mark read / read all', async () => {
  const { agent: s1 } = await loginAs(app, 'STUDENT', 's1@example.com');
  const { agent: s2 } = await loginAs(app, 'STUDENT', 's2@example.com');
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  await loan(s1, lib, await makeBook(2));
  const list = await s1.get('/api/notifications');
  assert.ok(list.body.unreadCount >= 2); // submitted + approved
  assert.equal((await s2.get('/api/notifications')).body.data.length, 0);
  const id = list.body.data[0]._id;
  assert.equal((await s2.patch(`/api/notifications/${id}/read`).set(HEADERS)).status, 404);
  assert.equal((await s1.patch(`/api/notifications/${id}/read`).set(HEADERS)).status, 200);
  await s1.patch('/api/notifications/read-all').set(HEADERS);
  assert.equal((await s1.get('/api/notifications')).body.unreadCount, 0);
});

test('due-date job notifies once per loan state, however often it runs', async () => {
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const { agent: student, user } = await loginAs(app, 'STUDENT');
  const issue = await loan(student, lib, await makeBook(2));
  const { BookIssue } = await import('../models/BookIssue.js');
  const { Notification } = await import('../models/Notification.js');
  const { runDueDateJob } = await import('../jobs/dueDateJob.js');
  await BookIssue.updateOne({ _id: issue._id }, { dueDate: new Date(Date.now() + 864e5) });
  await runDueDateJob();
  await runDueDateJob();
  assert.equal(await Notification.countDocuments({ recipient: user._id, type: 'DUE_SOON' }), 1);
  await BookIssue.updateOne({ _id: issue._id }, { dueDate: new Date(Date.now() - 3 * 864e5) });
  await runDueDateJob();
  await runDueDateJob();
  assert.equal(await Notification.countDocuments({ recipient: user._id, type: 'BOOK_OVERDUE' }), 1);
});
