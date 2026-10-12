import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, stopTestApp, clearDb, agentFor, HEADERS, validStudent } from './helpers.js';

let app;
before(async () => { app = await startTestApp(); });
after(stopTestApp);
beforeEach(clearDb);

const sampleBook = { title: 'Clean Code', author: 'Robert C. Martin', category: 'Programming', totalCopies: 3, isbn: '9780132350884' };

async function loginAs(role) {
  const { User } = await import('../models/User.js');
  await User.create({ fullName: 'Test User', email: `${role.toLowerCase()}@example.com`, password: 'Passw0rdTest', role });
  const agent = agentFor(app);
  await agent.post('/api/auth/login').set(HEADERS).send({ email: `${role.toLowerCase()}@example.com`, password: 'Passw0rdTest' });
  return agent;
}

test('librarian creates a book; available copies start equal to total', async () => {
  const lib = await loginAs('LIBRARIAN');
  const res = await lib.post('/api/books').set(HEADERS).send(sampleBook);
  assert.equal(res.status, 201);
  assert.equal(res.body.data.availableCopies, 3);
});

test('students and anonymous users cannot create books', async () => {
  const student = await loginAs('STUDENT');
  assert.equal((await student.post('/api/books').set(HEADERS).send(sampleBook)).status, 403);
  assert.equal((await agentFor(app).post('/api/books').set(HEADERS).send(sampleBook)).status, 401);
});

test('client cannot set availableCopies and negative copies are rejected', async () => {
  const lib = await loginAs('LIBRARIAN');
  assert.equal((await lib.post('/api/books').set(HEADERS).send({ ...sampleBook, availableCopies: 99 })).status, 400);
  assert.equal((await lib.post('/api/books').set(HEADERS).send({ ...sampleBook, totalCopies: -1 })).status, 400);
});

test('duplicate ISBN is rejected', async () => {
  const lib = await loginAs('LIBRARIAN');
  await lib.post('/api/books').set(HEADERS).send(sampleBook);
  assert.equal((await lib.post('/api/books').set(HEADERS).send(sampleBook)).status, 409);
});

test('update keeps inventory consistent and blocks totals below copies on loan', async () => {
  const lib = await loginAs('LIBRARIAN');
  const { data } = (await lib.post('/api/books').set(HEADERS).send(sampleBook)).body;
  const { Book } = await import('../models/Book.js');
  await Book.updateOne({ _id: data._id }, { availableCopies: 1 }); // 2 on loan
  assert.equal((await lib.put(`/api/books/${data._id}`).set(HEADERS).send({ totalCopies: 1 })).status, 409);
  const ok = await lib.put(`/api/books/${data._id}`).set(HEADERS).send({ totalCopies: 5 });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.availableCopies, 3);
});

test('search, filter, sort and pagination work on the public endpoint', async () => {
  const lib = await loginAs('LIBRARIAN');
  for (let i = 1; i <= 5; i++) {
    await lib.post('/api/books').set(HEADERS).send({ title: `Algorithms ${i}`, author: 'Sedgewick', category: 'CS', totalCopies: 1 });
  }
  await lib.post('/api/books').set(HEADERS).send({ title: 'Wings of Fire', author: 'A. P. J. Abdul Kalam', category: 'Biography', totalCopies: 2 });
  const anon = agentFor(app);
  const page = await anon.get('/api/books?limit=2&page=2&sort=title');
  assert.equal(page.status, 200);
  assert.equal(page.body.data.length, 2);
  assert.deepEqual(page.body.pagination, { page: 2, limit: 2, total: 6, totalPages: 3 });
  assert.equal((await anon.get('/api/books?q=kalam')).body.data.length, 1);
  assert.equal((await anon.get('/api/books?category=cs')).body.data.length, 5);
  assert.equal((await anon.get('/api/books?q=.*')).body.data.length, 0); // regex input is escaped
  assert.equal((await anon.get('/api/books?limit=500')).status, 400);
});

test('deleting a book with active loans is blocked; with history it is archived', async () => {
  const lib = await loginAs('LIBRARIAN');
  const { data } = (await lib.post('/api/books').set(HEADERS).send(sampleBook)).body;
  const { User } = await import('../models/User.js');
  const { BookIssue } = await import('../models/BookIssue.js');
  const student = await User.create({ fullName: 'S', email: 's@example.com', password: 'Passw0rdTest' });
  const issue = await BookIssue.create({ book: data._id, student: student._id, issuedBy: student._id, dueDate: new Date(Date.now() + 864e5) });
  assert.equal((await lib.delete(`/api/books/${data._id}`).set(HEADERS)).status, 409);
  await BookIssue.updateOne({ _id: issue._id }, { status: 'returned', returnDate: new Date() });
  const res = await lib.delete(`/api/books/${data._id}`).set(HEADERS);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.archived, true);
  assert.equal((await agentFor(app).get(`/api/books/${data._id}`)).status, 404);
});
