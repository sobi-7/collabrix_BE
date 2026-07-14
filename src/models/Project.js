const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  team_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Project', projectSchema);