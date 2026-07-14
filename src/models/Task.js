const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'done'],
    default: 'todo',
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  due_date: {
    type: Date,
    default: null,
  },
  attachments: [
    {
      url: String,
      filename: String,
      uploaded_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Task', taskSchema);