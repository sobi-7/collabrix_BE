const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  creator_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
members: [
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // 🔥 ADD THIS
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
  },
],

  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Team', teamSchema);