const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

function makeToken(user) {
  return jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 8) {
    return res.status(400).json({ message: 'Name, valid email, and password of at least 8 characters are required' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  if (await User.findOne({ email: normalizedEmail })) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name: String(name).trim(), email: normalizedEmail, passwordHash });
  res.status(201).json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email } });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email } });
}));

router.get('/me', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).select('name email');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: { id: user._id, name: user.name, email: user.email } });
}));

module.exports = router;
