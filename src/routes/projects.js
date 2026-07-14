const express = require('express');
const Project = require('../models/Project');
const Team = require('../models/Team');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Create a project
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { team_id, name, description } = req.body;

    if (!team_id || !name) {
      return res.status(400).json({ message: 'Team ID and project name required' });
    }

    // Verify user is member of team
    const team = await Team.findById(team_id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const isMember = team.members.some(
      (member) => member.user_id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }

    const project = new Project({
      team_id,
      name,
      description: description || '',
    });

    await project.save();

    console.log('✅ Project created:', name);

    res.status(201).json({
      message: 'Project created successfully',
      project,
    });
  } catch (error) {
    console.error('❌ Create project error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Get all projects for a team
router.get('/team/:team_id', authMiddleware, async (req, res) => {
  try {
    const { team_id } = req.params;

    // Verify user is member of team
    const team = await Team.findById(team_id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const isMember = team.members.some(
      (member) => member.user_id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }

    const projects = await Project.find({ team_id });

    res.json(projects);
  } catch (error) {
    console.error('❌ Get projects error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Get single project
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify user is member of team
    const team = await Team.findById(project.team_id);
    const isMember = team.members.some(
      (member) => member.user_id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    console.error('❌ Get project error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Update project
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (name) project.name = name;
    if (description) project.description = description;

    await project.save();

    console.log('✅ Project updated:', name);

    res.json(project);
  } catch (error) {
    console.error('❌ Update project error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Delete project
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log('✅ Project deleted');

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('❌ Delete project error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;