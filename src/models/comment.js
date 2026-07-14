const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  attachments: [
    {
      url: String,
      filename: String,
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Comment', commentSchema);