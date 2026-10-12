import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, stopTestApp, clearDb, HEADERS, loginAs, makeBook } from './helpers.js';

let app;
before(async () => { app = await startTestApp(); });
after(stopTestApp);
beforeEach(clearDb);

const request = (agent, bookId) => agent.post('/api/requests').set(HEADERS).send({ bookId: String(bookId) });
const approve = (agent, id) => agent.patch(`/api/requests/${id}/approve`).set(HEADERS);

test('full flow: request -> approve -> issued, inventory decremented, request fulfilled', async () => {
  const { agent: student } = await loginAs(app, 'STUDENT');
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const book = await makeBook(2);
  const req = await request(student, book._id);
  assert.equal(req.status, 201);
  assert.equal(req.body.data.status, 'pending');
  const ok = await approve(lib, req.body.data._id);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.request.status, 'fulfilled');
  assert.equal(ok.body.data.issue.status, 'issued');
  const { Book } = await import('../models/Book.js');
  assert.equal((await Book.findById(book._id)).availableCopies, 1);
});

test('students cannot approve and cannot request unavailable books', async () => {
  const { agent: student } = await loginAs(app, 'STUDENT');
  const book = await makeBook(1, { availableCopies: 0 });
  assert.equal((await request(student, book._id)).status, 409);
  const book2 = await makeBook(1, { title: 'Other' });
  const req = await request(student, book2._id);
  assert.equal((await approve(student, req.body.data._id)).status, 403);
});

test('duplicate pending request is rejected', async () => {
  const { agent: student } = await loginAs(app, 'STUDENT');
  const book = await makeBook(3);
  assert.equal((await request(student, book._id)).status, 201);
  assert.equal((await request(student, book._id)).status, 409);
});

test('approving the same request twice concurrently issues exactly one loan', async () => {
  const { agent: student } = await loginAs(app, 'STUDENT');
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const book = await makeBook(3);
  const id = (await request(student, book._id)).body.data._id;
  const results = await Promise.all([approve(lib, id), approve(lib, id)]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  const { BookIssue } = await import('../models/BookIssue.js');
  const { Book } = await import('../models/Book.js');
  assert.equal(await BookIssue.countDocuments({ book: book._id }), 1);
  assert.equal((await Book.findById(book._id)).availableCopies, 2);
});

test('two students racing for the last copy: one succeeds, inventory never negative', async () => {
  const { agent: s1 } = await loginAs(app, 'STUDENT', 's1@example.com');
  const { agent: s2 } = await loginAs(app, 'STUDENT', 's2@example.com');
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const book = await makeBook(1);
  const r1 = (await request(s1, book._id)).body.data._id;
  const r2 = (await request(s2, book._id)).body.data._id;
  const results = await Promise.all([approve(lib, r1), approve(lib, r2)]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  const { Book } = await import('../models/Book.js');
  assert.equal((await Book.findById(book._id)).availableCopies, 0);
  const { BorrowRequest } = await import('../models/BorrowRequest.js');
  assert.equal(await BorrowRequest.countDocuments({ status: 'pending' }), 1); // loser rolled back to pending
});

test('borrowing limit is enforced on the server', async () => {
  const { agent: student } = await loginAs(app, 'STUDENT');
  const { agent: lib, user: librarian } = await loginAs(app, 'LIBRARIAN');
  const { LibrarySettings } = await import('../models/LibrarySettings.js');
  await LibrarySettings.create({ key: 'default', finePerDay: 5, borrowDays: 7, maxBorrowedBooks: 1 });
  const a = await makeBook(1, { title: 'A' });
  const b = await makeBook(1, { title: 'B' });
  const first = (await request(student, a._id)).body.data._id;
  await approve(lib, first);
  const blocked = await request(student, b._id);
  assert.equal(blocked.status, 409);
  assert.match(blocked.body.message, /limit/i);
  assert.ok(librarian);
});

test('return restores inventory once; second return is rejected', async () => {
  const { agent: student } = await loginAs(app, 'STUDENT');
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const book = await makeBook(1);
  const id = (await request(student, book._id)).body.data._id;
  const issueId = (await approve(lib, id)).body.data.issue._id;
  const first = await lib.patch(`/api/issues/${issueId}/return`).set(HEADERS);
  assert.equal(first.status, 200);
  assert.equal(first.body.data.fine, null);
  assert.equal((await lib.patch(`/api/issues/${issueId}/return`).set(HEADERS)).status, 409);
  const { Book } = await import('../models/Book.js');
  assert.equal((await Book.findById(book._id)).availableCopies, 1);
});

test('concurrent double return restores exactly one copy', async () => {
  const { agent: student } = await loginAs(app, 'STUDENT');
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const book = await makeBook(2);
  const id = (await request(student, book._id)).body.data._id;
  const issueId = (await approve(lib, id)).body.data.issue._id;
  const results = await Promise.all([1, 2].map(() => lib.patch(`/api/issues/${issueId}/return`).set(HEADERS)));
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  const { Book } = await import('../models/Book.js');
  assert.equal((await Book.findById(book._id)).availableCopies, 2);
});

test('late return creates a server-calculated fine and blocks further borrowing', async () => {
  const { agent: student, user } = await loginAs(app, 'STUDENT');
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const book = await makeBook(2);
  const id = (await request(student, book._id)).body.data._id;
  const issueId = (await approve(lib, id)).body.data.issue._id;
  const { BookIssue } = await import('../models/BookIssue.js');
  await BookIssue.updateOne({ _id: issueId }, { dueDate: new Date(Date.now() - 3 * 864e5) }); // 3 days overdue
  const res = await lib.patch(`/api/issues/${issueId}/return`).set(HEADERS);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.fine.amount, 15);
  assert.equal(String(res.body.data.fine.student), String(user._id));
});

test('overdue students cannot request more books', async () => {
  const { agent: student } = await loginAs(app, 'STUDENT');
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const a = await makeBook(2, { title: 'A' });
  const b = await makeBook(2, { title: 'B' });
  const issueId = (await approve(lib, (await request(student, a._id)).body.data._id)).body.data.issue._id;
  const { BookIssue } = await import('../models/BookIssue.js');
  await BookIssue.updateOne({ _id: issueId }, { dueDate: new Date(Date.now() - 2 * 864e5) });
  assert.equal((await request(student, b._id)).status, 409);
});

test('students only see their own requests and loans; others get 404', async () => {
  const { agent: s1 } = await loginAs(app, 'STUDENT', 's1@example.com');
  const { agent: s2 } = await loginAs(app, 'STUDENT', 's2@example.com');
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const book = await makeBook(3);
  const reqId = (await request(s1, book._id)).body.data._id;
  const issueId = (await approve(lib, reqId)).body.data.issue._id;
  assert.equal((await s2.get('/api/requests/my')).body.data.length, 0);
  assert.equal((await s2.get('/api/issues/my')).body.data.length, 0);
  assert.equal((await s2.get(`/api/requests/${reqId}`)).status, 404);
  assert.equal((await s2.get(`/api/issues/${issueId}`)).status, 404);
  assert.equal((await s1.get(`/api/issues/${issueId}`)).status, 200);
  assert.equal((await s1.get('/api/issues')).status, 403); // staff-only list
});

test('student can cancel own pending request only', async () => {
  const { agent: s1 } = await loginAs(app, 'STUDENT', 's1@example.com');
  const { agent: s2 } = await loginAs(app, 'STUDENT', 's2@example.com');
  const book = await makeBook(2);
  const id = (await request(s1, book._id)).body.data._id;
  assert.equal((await s2.patch(`/api/requests/${id}/cancel`).set(HEADERS)).status, 404);
  assert.equal((await s1.patch(`/api/requests/${id}/cancel`).set(HEADERS)).status, 200);
  assert.equal((await s1.patch(`/api/requests/${id}/cancel`).set(HEADERS)).status, 404);
});

test('validation: malformed ids and bodies are rejected', async () => {
  const { agent: student } = await loginAs(app, 'STUDENT');
  assert.equal((await student.post('/api/requests').set(HEADERS).send({ bookId: 'nope' })).status, 400);
  assert.equal((await student.get('/api/requests/not-an-id')).status, 400);
});
