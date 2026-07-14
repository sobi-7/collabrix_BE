const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  team_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  invited_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
   // NEW: Member password (hashed)
  member_password: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted'],
    default: 'pending',
  },
  created_at: {
    type: Date,
    default: Date.now,
    expires: 604800, // Auto delete after 7 days (in seconds)
  },
});

module.exports = mongoose.model('Invitation', invitationSchema);