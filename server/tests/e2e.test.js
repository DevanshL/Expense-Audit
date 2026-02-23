/**
 * End-to-End Integration Test Suite
 * Tests the full flow: Register → Login → Run Audit → Token Refresh → Logout
 *
 * Run: cd server && npx jest tests/e2e.test.js --forceExit --verbose
 * Requires: MongoDB on localhost:27017 (or MONGODB_URI in .env)
 */

const request = require('supertest');
require('dotenv').config();

// Import app — server.js is guarded by `require.main === module`
// so it does NOT start listening. It DOES connect to MongoDB internally.
const app = require('../server');

// Shared state for sequential token-passing tests
const state = { accessToken: '', refreshToken: '' };
const testEmail = `e2e_${Date.now()}@test.com`;
const PASSWORD   = 'TestPassword123!';

const sampleDataset = {
  name: 'E2E Dataset',
  data: [
    { amount: 1234.56, vendor: 'ACME Corp',  description: 'Office supplies' },
    { amount:  234.00, vendor: 'TechHub',    description: 'Software' },
    { amount:  567.89, vendor: 'ACME Corp',  description: 'Equipment' },
    { amount:  123.45, vendor: 'Supply Co',  description: 'Stationery' },
    { amount:  890.00, vendor: 'TechHub',    description: 'Servers' },
    { amount:  345.67, vendor: 'Supply Co',  description: 'Paper' },
    { amount:  100.00, vendor: 'ACME Corp',  description: 'Misc' },
    { amount: 2500.00, vendor: 'BigVendor',  description: 'Consulting' },
    { amount:  750.00, vendor: 'BigVendor',  description: 'Training' },
    { amount:  380.00, vendor: 'Supply Co',  description: 'Ink' },
  ],
};

const auth = () => ({ Authorization: `Bearer ${state.accessToken}` });

// ---------------------------------------------------------------------------
// We need to wait for the app's internal mongoose.connect() to resolve before
// any tests run. The app calls connectDB() inside startServer(), but because
// require.main !== module in Jest, startServer() is NOT called.
//
// Fix: re-export the connectDB call and await it here, OR simply call the
// app's /api/health endpoint in beforeAll — it will succeed once DB is ready.
// ---------------------------------------------------------------------------

const { connectDatabase } = require('../config/database');

beforeAll(async () => {
  await connectDatabase(); // uses the same MONGODB_URI as the app
  // Delete any leftover test user from a previous run
  const mongoose = require('mongoose');
  await mongoose.connection.db.collection('users').deleteOne({ email: testEmail });
}, 15000);


afterAll(async () => {
  const mongoose = require('mongoose');
  // clean up test user
  await mongoose.connection.db.collection('users').deleteOne({ email: testEmail });
  // close the connection so Jest exits cleanly
  await mongoose.connection.close();
});

// ── 1. Health ────────────────────────────────────────────────────────────────

test('1a: GET /api/health → healthy', async () => {
  const res = await request(app).get('/api/health');
  expect(res.status).toBe(200);
  expect(res.body.data.status).toBe('healthy');
});

test('1b: GET /api/health/liveness → alive', async () => {
  const res = await request(app).get('/api/health/liveness');
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('alive');
});

test('1c: GET /api/health/readiness → ready', async () => {
  const res = await request(app).get('/api/health/readiness');
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('ready');
});

// ── 2. Auth: Register ────────────────────────────────────────────────────────

test('2a: POST /api/auth/register → creates user + tokens', async () => {
  const res = await request(app).post('/api/auth/register').send({
    email: testEmail, password: PASSWORD, name: 'Integration User', organization: 'TestOrg',
  });
  expect(res.status).toBe(201);
  expect(res.body.success).toBe(true);
  expect(res.body.data.tokens.accessToken).toBeDefined();
  state.accessToken  = res.body.data.tokens.accessToken;
  state.refreshToken = res.body.data.tokens.refreshToken;
});

test('2b: POST /api/auth/register → rejects duplicate (409)', async () => {
  const res = await request(app).post('/api/auth/register').send({
    email: testEmail, password: PASSWORD, name: 'Dupe',
  });
  expect(res.status).toBe(409);
});

// ── 3. Auth: Login ───────────────────────────────────────────────────────────

test('3a: POST /api/auth/login → returns tokens', async () => {
  const res = await request(app).post('/api/auth/login').send({
    email: testEmail, password: PASSWORD,
  });
  expect(res.status).toBe(200);
  state.accessToken  = res.body.data.tokens.accessToken;
  state.refreshToken = res.body.data.tokens.refreshToken;
});

test('3b: POST /api/auth/login → rejects wrong password (401)', async () => {
  const res = await request(app).post('/api/auth/login').send({
    email: testEmail, password: 'WrongPass!',
  });
  expect(res.status).toBe(401);
});

// ── 4. JWT /me ───────────────────────────────────────────────────────────────

test('4a: GET /api/auth/me → returns user', async () => {
  const res = await request(app).get('/api/auth/me').set(auth());
  expect(res.status).toBe(200);
  expect(res.body.data.user.email).toBe(testEmail);
});

test('4b: GET /api/auth/me → rejects bad token (401)', async () => {
  const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer bad.token');
  expect(res.status).toBe(401);
});

// ── 5. Benford Audit ─────────────────────────────────────────────────────────

test('5a: POST /api/ai/perform-audit → returns analysis', async () => {
  const res = await request(app)
    .post('/api/ai/perform-audit')
    .set(auth())
    .send({ dataset: sampleDataset });
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.data).toBeDefined();
});

test('5b: POST /api/ai/perform-audit → rejects unauthenticated (401)', async () => {
  const res = await request(app).post('/api/ai/perform-audit').send({ dataset: sampleDataset });
  expect(res.status).toBe(401);
});

// ── 6. Token Refresh ─────────────────────────────────────────────────────────

test('6a: POST /api/auth/refresh → new access token', async () => {
  const res = await request(app).post('/api/auth/refresh').send({
    refreshToken: state.refreshToken,
  });
  expect(res.status).toBe(200);
  expect(res.body.data.accessToken).toBeDefined();
  state.accessToken = res.body.data.accessToken;
});

// ── 7. Logout ────────────────────────────────────────────────────────────────

test('7a: POST /api/auth/logout → invalidates session', async () => {
  const res = await request(app)
    .post('/api/auth/logout')
    .set(auth())
    .send({ refreshToken: state.refreshToken });
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
});
