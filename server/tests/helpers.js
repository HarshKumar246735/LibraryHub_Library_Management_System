// Sets test env BEFORE app modules load, and starts an isolated in-memory MongoDB.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_that_is_definitely_longer_than_32_chars';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/unused-in-tests';
process.env.AUTH_RATE_LIMIT = '1000';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

let mongod;
export async function startTestApp() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const { createApp } = await import('../app.js');
  return createApp();
}
export async function stopTestApp() {
  await mongoose.disconnect();
  await mongod?.stop();
}
export async function clearDb() {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
}

export const HEADERS = { 'X-Requested-With': 'LibraryHub' };
export const validStudent = {
  fullName: 'Asha Verma',
  email: 'asha@example.com',
  password: 'Passw0rdTest',
  confirmPassword: 'Passw0rdTest',
};

// Returns a supertest agent that keeps the auth cookie.
export const agentFor = (app) => request.agent(app);
export { request };

// Creates a user directly in the DB and returns a logged-in agent plus the user document.
export async function loginAs(app, role, email = `${role.toLowerCase()}@example.com`) {
  const { User } = await import('../models/User.js');
  const user = await User.create({ fullName: `${role} User`, email, password: 'Passw0rdTest', role });
  const agent = agentFor(app);
  await agent.post('/api/auth/login').set(HEADERS).send({ email, password: 'Passw0rdTest' });
  return { agent, user };
}
export async function makeBook(copies = 1, overrides = {}) {
  const { Book } = await import('../models/Book.js');
  return Book.create({ title: 'Test Book', author: 'Author', category: 'General', totalCopies: copies, availableCopies: copies, ...overrides });
}
