const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
  serviceDate: { type: Date, required: true },
  mileage: { type: Number, required: true, min: 0 },
  serviceType: { type: String, required: true, trim: true, maxlength: 100 },
  serviceCenter: { type: String, trim: true, maxlength: 120, default: '' },
  cost: { type: Number, required: true, min: 0 },
  notes: { type: String, trim: true, maxlength: 1000, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('ServiceRecord', serviceSchema);
