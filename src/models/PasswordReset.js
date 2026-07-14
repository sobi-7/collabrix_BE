const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['pending', 'used'],
    default: 'pending',
  },
  created_at: {
    type: Date,
    default: Date.now,
    expires: 3600, // Auto delete after 1 hour
  },
});

module.exports = mongoose.model('PasswordReset', passwordResetSchema);