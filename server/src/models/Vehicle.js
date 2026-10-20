const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  registrationNumber: { type: String, required: true, trim: true, uppercase: true },
  brand: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  year: { type: Number, required: true, min: 1950, max: 2100 },
  currentMileage: { type: Number, required: true, min: 0, default: 0 },
  fuelType: { type: String, enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'Other'], default: 'Petrol' }
}, { timestamps: true });

vehicleSchema.index({ userId: 1, registrationNumber: 1 }, { unique: true });
module.exports = mongoose.model('Vehicle', vehicleSchema);
