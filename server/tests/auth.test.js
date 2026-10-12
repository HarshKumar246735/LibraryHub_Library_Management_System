import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, stopTestApp, clearDb, agentFor, HEADERS, validStudent } from './helpers.js';

let app;
before(async () => { app = await startTestApp(); });
after(stopTestApp);
beforeEach(clearDb);

const post = (agent, url, body) => agent.post(url).set(HEADERS).send(body);

test('registers a student, hashes the password, never returns it', async () => {
  const res = await post(agentFor(app), '/api/auth/register', validStudent);
  assert.equal(res.status, 201);
  assert.equal(res.body.data.role, 'STUDENT');
  assert.equal(res.body.data.password, undefined);
  const { User } = await import('../models/User.js');
  const stored = await User.findOne({ email: 'asha@example.com' }).select('+password');
  assert.notEqual(stored.password, validStudent.password);
  assert.ok(stored.password.startsWith('$2'));
});

test('rejects duplicate email', async () => {
  await post(agentFor(app), '/api/auth/register', validStudent);
  const res = await post(agentFor(app), '/api/auth/register', validStudent);
  assert.equal(res.status, 409);
});

test('public registration cannot choose a role', async () => {
  const res = await post(agentFor(app), '/api/auth/register', { ...validStudent, role: 'ADMIN' });
  assert.equal(res.status, 400);
});

test('rejects weak passwords and mismatched confirmation', async () => {
  const weak = await post(agentFor(app), '/api/auth/register', { ...validStudent, password: 'abc', confirmPassword: 'abc' });
  assert.equal(weak.status, 400);
  const mismatch = await post(agentFor(app), '/api/auth/register', { ...validStudent, confirmPassword: 'Different1Pass' });
  assert.equal(mismatch.status, 400);
});

test('login succeeds, /me works with the cookie, logout clears access', async () => {
  const agent = agentFor(app);
  await post(agent, '/api/auth/register', validStudent);
  await post(agent, '/api/auth/logout', {});
  const login = await post(agent, '/api/auth/login', { email: validStudent.email, password: validStudent.password });
  assert.equal(login.status, 200);
  assert.equal((await agent.get('/api/auth/me')).status, 200);
  await post(agent, '/api/auth/logout', {});
  assert.equal((await agent.get('/api/auth/me')).status, 401);
});

test('invalid login returns a generic 401', async () => {
  await post(agentFor(app), '/api/auth/register', validStudent);
  const wrongPw = await post(agentFor(app), '/api/auth/login', { email: validStudent.email, password: 'WrongPass1' });
  const noUser = await post(agentFor(app), '/api/auth/login', { email: 'nobody@example.com', password: 'WrongPass1' });
  assert.equal(wrongPw.status, 401);
  assert.equal(noUser.status, 401);
  assert.equal(wrongPw.body.message, noUser.body.message);
});

test('protected route rejects anonymous requests', async () => {
  assert.equal((await agentFor(app).get('/api/auth/me')).status, 401);
});

test('state-changing requests without the CSRF header are rejected', async () => {
  const res = await agentFor(app).post('/api/auth/login').send({ email: 'a@b.co', password: 'x' });
  assert.equal(res.status, 403);
});

test('deactivated users cannot log in', async () => {
  await post(agentFor(app), '/api/auth/register', validStudent);
  const { User } = await import('../models/User.js');
  await User.updateOne({ email: validStudent.email }, { status: 'inactive' });
  const res = await post(agentFor(app), '/api/auth/login', { email: validStudent.email, password: validStudent.password });
  assert.equal(res.status, 403);
});

test('change password requires the current password', async () => {
  const agent = agentFor(app);
  await post(agent, '/api/auth/register', validStudent);
  const bad = await post(agent, '/api/auth/change-password', { currentPassword: 'Nope12345', newPassword: 'NewPassw0rd1' });
  assert.equal(bad.status, 400);
  const ok = await post(agent, '/api/auth/change-password', { currentPassword: validStudent.password, newPassword: 'NewPassw0rd1' });
  assert.equal(ok.status, 200);
});

test('password reset token is single-use and stored hashed', async () => {
  await post(agentFor(app), '/api/auth/register', validStudent);
  const { createPasswordReset } = await import('../services/authService.js');
  const { rawToken, user } = await createPasswordReset(validStudent.email);
  const { User } = await import('../models/User.js');
  const stored = await User.findById(user._id).select('+passwordResetTokenHash');
  assert.notEqual(stored.passwordResetTokenHash, rawToken);
  const first = await post(agentFor(app), '/api/auth/reset-password', { token: rawToken, newPassword: 'BrandNew1Pass' });
  assert.equal(first.status, 200);
  const second = await post(agentFor(app), '/api/auth/reset-password', { token: rawToken, newPassword: 'AnotherNew1Pass' });
  assert.equal(second.status, 400);
});
