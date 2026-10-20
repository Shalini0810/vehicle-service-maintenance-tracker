const router = require('express').Router();
const MaintenanceReminder = require('../models/MaintenanceReminder');
const Vehicle = require('../models/Vehicle');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.use(auth);

function classify(reminder, mileage) {
  if (reminder.status === 'Completed') return 'Completed';
  const now = new Date();
  if (reminder.dueDate && new Date(reminder.dueDate) < now) return 'Overdue';
  if (reminder.dueMileage != null && reminder.dueMileage <= mileage) return 'Overdue';
  if (reminder.dueDate && new Date(reminder.dueDate) <= new Date(now.getTime() + 30 * 86400000)) return 'Due soon';
  if (reminder.dueMileage != null && reminder.dueMileage - mileage <= 500) return 'Due soon';
  return 'Upcoming';
}

router.get('/vehicle/:vehicleId', asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.vehicleId, userId: req.userId });
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  const reminders = await MaintenanceReminder.find({ vehicleId: vehicle._id, userId: req.userId }).sort({ dueDate: 1 });
  res.json(reminders.map(r => ({ ...r.toObject(), computedStatus: classify(r, vehicle.currentMileage) })));
}));

router.post('/vehicle/:vehicleId', asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.vehicleId, userId: req.userId });
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  const { title, dueDate = null, dueMileage = null } = req.body;
  if (!title || (!dueDate && dueMileage == null)) {
    return res.status(400).json({ message: 'A title and at least one due date or due mileage are required' });
  }
  if (dueDate && Number.isNaN(Date.parse(dueDate))) return res.status(400).json({ message: 'Invalid due date' });
  if (dueMileage != null && Number(dueMileage) < 0) return res.status(400).json({ message: 'Due mileage cannot be negative' });
  const reminder = await MaintenanceReminder.create({
    userId: req.userId, vehicleId: vehicle._id, title, dueDate,
    dueMileage: dueMileage == null ? null : Number(dueMileage)
  });
  res.status(201).json({ ...reminder.toObject(), computedStatus: classify(reminder, vehicle.currentMileage) });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const allowed = ['title', 'dueDate', 'dueMileage', 'status'];
  const update = {};
  for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
  const reminder = await MaintenanceReminder.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId }, update, { new: true, runValidators: true }
  );
  if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
  const vehicle = await Vehicle.findOne({ _id: reminder.vehicleId, userId: req.userId });
  res.json({ ...reminder.toObject(), computedStatus: vehicle ? classify(reminder, vehicle.currentMileage) : reminder.status });
}));

module.exports = router;
