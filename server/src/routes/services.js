const router = require('express').Router();
const ServiceRecord = require('../models/ServiceRecord');
const Vehicle = require('../models/Vehicle');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.use(auth);

router.get('/vehicle/:vehicleId', asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.vehicleId, userId: req.userId });
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  res.json(await ServiceRecord.find({ vehicleId: vehicle._id, userId: req.userId }).sort({ serviceDate: -1 }));
}));

router.post('/vehicle/:vehicleId', asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.vehicleId, userId: req.userId });
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  const { serviceDate, mileage, serviceType, serviceCenter = '', cost, notes = '' } = req.body;
  if (!serviceDate || !serviceType || mileage == null || cost == null || Number(mileage) < 0 || Number(cost) < 0 || Number.isNaN(Date.parse(serviceDate))) {
    return res.status(400).json({ message: 'Valid service date, mileage, service type, and cost are required' });
  }
  const record = await ServiceRecord.create({
    userId: req.userId, vehicleId: vehicle._id, serviceDate, mileage: Number(mileage),
    serviceType, serviceCenter, cost: Number(cost), notes
  });
  if (Number(mileage) > vehicle.currentMileage) {
    vehicle.currentMileage = Number(mileage);
    await vehicle.save();
  }
  res.status(201).json(record);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const allowed = ['serviceDate', 'mileage', 'serviceType', 'serviceCenter', 'cost', 'notes'];
  const update = {};
  for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
  const record = await ServiceRecord.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId }, update, { new: true, runValidators: true }
  );
  if (!record) return res.status(404).json({ message: 'Service record not found' });
  res.json(record);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const record = await ServiceRecord.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!record) return res.status(404).json({ message: 'Service record not found' });
  res.json({ message: 'Service record deleted' });
}));

module.exports = router;
