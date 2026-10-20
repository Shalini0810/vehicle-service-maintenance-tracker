const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const client = require('prom-client');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : true }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

const register = new client.Registry();
client.collectDefaultMetrics({ register });
const httpRequests = new client.Counter({
  name: 'vehicle_tracker_http_requests_total',
  help: 'Total HTTP requests handled',
  labelNames: ['method', 'route', 'status']
});
register.registerMetric(httpRequests);
app.use((req, res, next) => {
  res.on('finish', () => httpRequests.inc({
    method: req.method,
    route: req.route?.path || req.path,
    status: String(res.statusCode)
  }));
  next();
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/services', require('./routes/services'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  if (err && err.code === 11000) return res.status(409).json({ message: 'A record with that unique value already exists' });
  if (err && err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err && err.name === 'CastError') return res.status(400).json({ message: 'Invalid identifier or value' });
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
