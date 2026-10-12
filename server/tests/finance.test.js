import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, stopTestApp, clearDb, HEADERS, loginAs, makeBook } from './helpers.js';

let app;
before(async () => { app = await startTestApp(); });
after(stopTestApp);
beforeEach(clearDb);

async function loanFor(studentAgent, libAgent, book) {
  const req = await studentAgent.post('/api/requests').set(HEADERS).send({ bookId: String(book._id) });
  return (await libAgent.patch(`/api/requests/${req.body.data._id}/approve`).set(HEADERS)).body.data.issue;
}
async function makeFine(student, lib) {
  const book = await makeBook(2);
  const issue = await loanFor(student, lib, book);
  const { BookIssue } = await import('../models/BookIssue.js');
  await BookIssue.updateOne({ _id: issue._id }, { dueDate: new Date(Date.now() - 2 * 864e5) });
  return (await lib.patch(`/api/issues/${issue._id}/return`).set(HEADERS)).body.data.fine;
}

test('recording a payment uses the stored amount and marks the fine paid with a payment record', async () => {
  const { agent: student } = await loginAs(app, 'STUDENT');
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const fine = await makeFine(student, lib);
  assert.equal((await lib.post(`/api/fines/${fine._id}/payments`).set(HEADERS).send({ method: 'cash', amount: 1 })).status, 400); // client amount rejected
  const ok = await lib.post(`/api/fines/${fine._id}/payments`).set(HEADERS).send({ method: 'cash', reference: 'R-1' });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.data.payment.amount, fine.amount);
  assert.equal(ok.body.data.fine.status, 'paid');
  assert.equal((await lib.post(`/api/fines/${fine._id}/payments`).set(HEADERS).send({ method: 'cash' })).status, 409);
});

test('concurrent payments create exactly one payment record', async () => {
  const { agent: student } = await loginAs(app, 'STUDENT');
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const fine = await makeFine(student, lib);
  const results = await Promise.all([1, 2].map(() => lib.post(`/api/fines/${fine._id}/payments`).set(HEADERS).send({ method: 'upi' })));
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  const { PaymentRecord } = await import('../models/PaymentRecord.js');
  assert.equal(await PaymentRecord.countDocuments(), 1);
});

test('only admins can waive; paid fines cannot be waived; students cannot pay', async () => {
  const { agent: student } = await loginAs(app, 'STUDENT');
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const { agent: admin } = await loginAs(app, 'ADMIN');
  const fine = await makeFine(student, lib);
  assert.equal((await student.post(`/api/fines/${fine._id}/payments`).set(HEADERS).send({ method: 'cash' })).status, 403);
  assert.equal((await lib.patch(`/api/fines/${fine._id}/waive`).set(HEADERS).send({ reason: 'Hardship case' })).status, 403);
  assert.equal((await admin.patch(`/api/fines/${fine._id}/waive`).set(HEADERS).send({})).status, 400);
  assert.equal((await admin.patch(`/api/fines/${fine._id}/waive`).set(HEADERS).send({ reason: 'Hardship case' })).status, 200);
  assert.equal((await admin.patch(`/api/fines/${fine._id}/waive`).set(HEADERS).send({ reason: 'Again please' })).status, 409);
});

test('students see only their own fines', async () => {
  const { agent: s1 } = await loginAs(app, 'STUDENT', 's1@example.com');
  const { agent: s2 } = await loginAs(app, 'STUDENT', 's2@example.com');
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const fine = await makeFine(s1, lib);
  assert.equal((await s1.get('/api/fines/my')).body.data.length, 1);
  assert.equal((await s2.get('/api/fines/my')).body.data.length, 0);
  assert.equal((await s2.get(`/api/fines/${fine._id}`)).status, 404);
});

test('renewal: request, approve extends due date and counts; limit enforced', async () => {
  const { agent: student } = await loginAs(app, 'STUDENT');
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const { LibrarySettings } = await import('../models/LibrarySettings.js');
  await LibrarySettings.create({ key: 'default', finePerDay: 5, borrowDays: 7, maxBorrowedBooks: 5, maxRenewals: 1 });
  const issue = await loanFor(student, lib, await makeBook(2));
  const r = await student.post('/api/renewals').set(HEADERS).send({ issueId: issue._id });
  assert.equal(r.status, 201);
  assert.equal((await student.post('/api/renewals').set(HEADERS).send({ issueId: issue._id })).status, 409); // already pending
  const ok = await lib.patch(`/api/renewals/${r.body.data._id}/approve`).set(HEADERS);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.issue.renewalCount, 1);
  assert.equal(new Date(ok.body.data.issue.dueDate) - new Date(issue.dueDate), 7 * 864e5);
  assert.equal((await lib.patch(`/api/renewals/${r.body.data._id}/approve`).set(HEADERS)).status, 409);
  assert.equal((await student.post('/api/renewals').set(HEADERS).send({ issueId: issue._id })).status, 409); // limit reached
});

test('renewal rules: not for others\' loans, overdue loans or returned loans', async () => {
  const { agent: s1 } = await loginAs(app, 'STUDENT', 's1@example.com');
  const { agent: s2 } = await loginAs(app, 'STUDENT', 's2@example.com');
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const issue = await loanFor(s1, lib, await makeBook(2));
  assert.equal((await s2.post('/api/renewals').set(HEADERS).send({ issueId: issue._id })).status, 404);
  const { BookIssue } = await import('../models/BookIssue.js');
  await BookIssue.updateOne({ _id: issue._id }, { dueDate: new Date(Date.now() - 864e5 * 2) });
  assert.equal((await s1.post('/api/renewals').set(HEADERS).send({ issueId: issue._id })).status, 409);
  await lib.patch(`/api/issues/${issue._id}/return`).set(HEADERS);
  assert.equal((await s1.post('/api/renewals').set(HEADERS).send({ issueId: issue._id })).status, 409);
});

test('rejecting a renewal leaves the due date unchanged', async () => {
  const { agent: student } = await loginAs(app, 'STUDENT');
  const { agent: lib } = await loginAs(app, 'LIBRARIAN');
  const issue = await loanFor(student, lib, await makeBook(2));
  const r = await student.post('/api/renewals').set(HEADERS).send({ issueId: issue._id });
  assert.equal((await lib.patch(`/api/renewals/${r.body.data._id}/reject`).set(HEADERS).send({ reason: 'Needed by others' })).status, 200);
  const { BookIssue } = await import('../models/BookIssue.js');
  const after = await BookIssue.findById(issue._id);
  assert.equal(after.renewalCount, 0);
  assert.equal(after.dueDate.toISOString(), issue.dueDate);
});
