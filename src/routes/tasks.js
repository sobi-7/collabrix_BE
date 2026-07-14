const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Team = require('../models/Team');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Helper: Check if user is member of project's team
const checkTeamMembership = async (req, projectId) => {
  try {
    const project = await Project.findById(projectId);
    if (!project) return false;

    const team = await Team.findById(project.team_id);
    if (!team) return false;

    return team.members.some(
      (member) => member.user_id.toString() === req.user._id.toString()
    );
  } catch (error) {
    return false;
  }
};

// Create task
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { project_id, title, description, assigned_to, due_date } = req.body;

    if (!project_id || !title) {
      return res.status(400).json({ message: 'Project ID and title required' });
    }

    // Verify user is member of project's team
    const isMember = await checkTeamMembership(req, project_id);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const task = new Task({
      project_id,
      title,
      description: description || '',
      status: 'todo',
      assigned_to: assigned_to || null,
      due_date: due_date || null,
    });

    await task.save();

    console.log('✅ Task created:', title);

    res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    console.error('❌ Create task error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Get all tasks for a project
router.get('/project/:project_id', authMiddleware, async (req, res) => {
  try {
    const { project_id } = req.params;

    // Verify user is member of project's team
    const isMember = await checkTeamMembership(req, project_id);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tasks = await Task.find({ project_id })
      .populate('assigned_to', 'name email')
      .sort({ created_at: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('❌ Get tasks error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Get single task
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assigned_to', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify user is member of project's team
    const isMember = await checkTeamMembership(req, task.project_id);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(task);
  } catch (error) {
    console.error('❌ Get task error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Update task
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, status, assigned_to, due_date } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify user is member of project's team
    const isMember = await checkTeamMembership(req, task.project_id);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update fields if provided
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status; // 'todo', 'in_progress', 'done'
    if (assigned_to !== undefined) task.assigned_to = assigned_to;
    if (due_date !== undefined) task.due_date = due_date;

    task.updated_at = new Date();
    await task.save();

    console.log('✅ Task updated:', task.title);

    res.json(task);
  } catch (error) {
    console.error('❌ Update task error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify user is member of project's team
    const isMember = await checkTeamMembership(req, task.project_id);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Task.findByIdAndDelete(req.params.id);

    console.log('✅ Task deleted');

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('❌ Delete task error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;