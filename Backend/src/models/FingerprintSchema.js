const mongoose = require('mongoose');

const FingerprintSchema = new mongoose.Schema({
  companyId: { type: String, required: true, unique: true },
  watermarkSeed: { type: String, required: true },
  patternApplied: [{ type: String }], // e.g., ['user.email', 'user.pan']
  fingerprintCode: { type: String, required: true }, // binary or hex string
  binaryWatermark: { type: String }, // NEW: stores the binary watermark string
}, { timestamps: true });

module.exports = mongoose.model('Fingerprint', FingerprintSchema);
