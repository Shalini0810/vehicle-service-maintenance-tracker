const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongo;
let app;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-that-is-long-enough';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = require('../src/app');
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) await collections[key].deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('registers a user and returns a token', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Test User', email: 'test@example.com', password: 'password123'
  });
  expect(res.statusCode).toBe(201);
  expect(res.body.token).toBeTruthy();
  expect(res.body.user.email).toBe('test@example.com');
});

test('rejects a short password', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Test User', email: 'test@example.com', password: '123'
  });
  expect(res.statusCode).toBe(400);
});

test('creates and lists vehicles for an authenticated user', async () => {
  const registerRes = await request(app).post('/api/auth/register').send({
    name: 'Vehicle Test User',
    email: 'vehicle-test@example.com',
    password: 'password123'
  });

  const token = registerRes.body.token;

  const createRes = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      registrationNumber: 'TS09AB1234',
      brand: 'Hyundai',
      model: 'i20',
      year: 2022,
      currentMileage: 28500,
      fuelType: 'Petrol'
    });

  expect(createRes.statusCode).toBe(201);
  expect(createRes.body.registrationNumber).toBe('TS09AB1234');

  const listRes = await request(app)
    .get('/api/vehicles')
    .set('Authorization', `Bearer ${token}`);

  expect(listRes.statusCode).toBe(200);
  expect(listRes.body).toHaveLength(1);
  expect(listRes.body[0].model).toBe('i20');
});

test('rejects vehicle requests without authentication', async () => {
  const res = await request(app).get('/api/vehicles');

  expect(res.statusCode).toBe(401);
});


test('creates and lists service records for an authenticated vehicle owner', async () => {
  const registerRes = await request(app).post('/api/auth/register').send({
    name: 'Service Test User',
    email: 'service-test@example.com',
    password: 'password123'
  });

  const token = registerRes.body.token;

  const vehicleRes = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      registrationNumber: 'TS10CD5678',
      brand: 'Honda',
      model: 'City',
      year: 2023,
      currentMileage: 12000,
      fuelType: 'Petrol'
    });

  expect(vehicleRes.statusCode).toBe(201);
  const vehicleId = vehicleRes.body._id;

  const createRes = await request(app)
    .post(`/api/services/vehicle/${vehicleId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      serviceDate: '2026-10-10',
      mileage: 12000,
      serviceType: 'Oil Change',
      serviceCenter: 'Test Service Center',
      cost: 2500,
      notes: 'Regular maintenance'
    });

  expect(createRes.statusCode).toBe(201);
  expect(createRes.body.serviceType).toBe('Oil Change');

  const listRes = await request(app)
    .get(`/api/services/vehicle/${vehicleId}`)
    .set('Authorization', `Bearer ${token}`);

  expect(listRes.statusCode).toBe(200);
  expect(listRes.body).toHaveLength(1);
  expect(listRes.body[0].cost).toBe(2500);
});

test('creates and lists maintenance reminders for an authenticated vehicle owner', async () => {
  const registerRes = await request(app).post('/api/auth/register').send({
    name: 'Reminder Test User',
    email: 'reminder-test@example.com',
    password: 'password123'
  });

  const token = registerRes.body.token;

  const vehicleRes = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      registrationNumber: 'TS11EF9012',
      brand: 'Maruti Suzuki',
      model: 'Baleno',
      year: 2024,
      currentMileage: 8000,
      fuelType: 'Petrol'
    });

  expect(vehicleRes.statusCode).toBe(201);
  const vehicleId = vehicleRes.body._id;

  const createRes = await request(app)
    .post(`/api/reminders/vehicle/${vehicleId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Oil Change',
      dueMileage: 8500
    });

  expect(createRes.statusCode).toBe(201);
  expect(createRes.body.title).toBe('Oil Change');

  const listRes = await request(app)
    .get(`/api/reminders/vehicle/${vehicleId}`)
    .set('Authorization', `Bearer ${token}`);

  expect(listRes.statusCode).toBe(200);
  expect(listRes.body).toHaveLength(1);
  expect(listRes.body[0].title).toBe('Oil Change');
  expect(listRes.body[0].computedStatus).toBe('Due soon');
});

test('returns dashboard statistics for an authenticated user', async () => {
  const registerRes = await request(app).post('/api/auth/register').send({
    name: 'Dashboard Test User',
    email: 'dashboard-test@example.com',
    password: 'password123'
  });

  const token = registerRes.body.token;

  const vehicleRes = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      registrationNumber: 'TS12GH3456',
      brand: 'Toyota',
      model: 'Glanza',
      year: 2023,
      currentMileage: 15000,
      fuelType: 'Petrol'
    });

  expect(vehicleRes.statusCode).toBe(201);

  const res = await request(app)
    .get('/api/dashboard')
    .set('Authorization', `Bearer ${token}`);

  expect(res.statusCode).toBe(200);
  expect(res.body.vehicleCount).toBe(1);
  expect(res.body.serviceCount).toBe(0);
  expect(res.body.totalSpent).toBe(0);
  expect(res.body.vehicles).toHaveLength(1);
});
