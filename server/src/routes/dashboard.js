const router = require('express').Router();
const Vehicle = require('../models/Vehicle');
const ServiceRecord = require('../models/ServiceRecord');
const MaintenanceReminder = require('../models/MaintenanceReminder');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

router.get('/', auth, asyncHandler(async (req, res) => {
  const [vehicles, services, reminders] = await Promise.all([
    Vehicle.find({ userId: req.userId }),
    ServiceRecord.find({ userId: req.userId }),
    MaintenanceReminder.find({ userId: req.userId, status: 'Pending' })
  ]);
  const totalSpent = services.reduce((sum, s) => sum + s.cost, 0);
  const now = new Date();
  const upcoming = reminders.filter(r =>
    (r.dueDate && new Date(r.dueDate) <= new Date(now.getTime() + 30 * 86400000)) ||
    (r.dueMileage != null && vehicles.some(v => v._id.equals(r.vehicleId) && r.dueMileage - v.currentMileage <= 500))
  );
  res.json({
    vehicleCount: vehicles.length,
    serviceCount: services.length,
    totalSpent,
    upcomingReminderCount: upcoming.length,
    vehicles
  });
}));

module.exports = router;
