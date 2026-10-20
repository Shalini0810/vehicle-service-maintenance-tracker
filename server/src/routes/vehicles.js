const router = require('express').Router();
const Vehicle = require('../models/Vehicle');
const ServiceRecord = require('../models/ServiceRecord');
const MaintenanceReminder = require('../models/MaintenanceReminder');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.use(auth);

router.get('/', asyncHandler(async (req, res) => {
  res.json(await Vehicle.find({ userId: req.userId }).sort({ createdAt: -1 }));
}));

router.post('/', asyncHandler(async (req, res) => {
  const { registrationNumber, brand, model, year, currentMileage = 0, fuelType = 'Petrol' } = req.body;
  if (!registrationNumber || !brand || !model || year == null || Number(year) < 1950 || Number(year) > new Date().getFullYear() + 1 || Number(currentMileage) < 0) {
    return res.status(400).json({ message: 'Enter valid registration, brand, model, year, and mileage' });
  }
  const vehicle = await Vehicle.create({
    userId: req.userId, registrationNumber, brand, model,
    year: Number(year), currentMileage: Number(currentMileage), fuelType
  });
  res.status(201).json(vehicle);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.userId });
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  res.json(vehicle);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const allowed = ['registrationNumber', 'brand', 'model', 'year', 'currentMileage', 'fuelType'];
  const update = {};
  for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId }, update, { new: true, runValidators: true }
  );
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  res.json(vehicle);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  await Promise.all([
    ServiceRecord.deleteMany({ vehicleId: vehicle._id, userId: req.userId }),
    MaintenanceReminder.deleteMany({ vehicleId: vehicle._id, userId: req.userId })
  ]);
  res.json({ message: 'Vehicle and its records deleted' });
}));

module.exports = router;
