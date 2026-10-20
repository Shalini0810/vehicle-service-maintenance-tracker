const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  dueDate: { type: Date, default: null },
  dueMileage: { type: Number, min: 0, default: null },
  status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceReminder', reminderSchema);
