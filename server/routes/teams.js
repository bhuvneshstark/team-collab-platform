const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Team = require('../models/Team');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Validation for team creation & update
const createTeamSchema = Joi.object({
  name: Joi.string().required().trim().min(1).max(100),
  description: Joi.string().optional().allow('').max(500)
});

const updateTeamSchema = Joi.object({
  name: Joi.string().optional().trim().min(1).max(100),
  description: Joi.string().optional().allow('').max(500)
});

// CREATE a new team (any authenticated user without a team)
router.post('/create', auth, async (req, res) => {
  try {
    if (req.user.teamId) {
      return res.status(400).json({ error: 'You are already in a team' });
    }

    const { error, value } = createTeamSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const team = await Team.create({
      name: value.name,
      description: value.description || '',
      adminId: req.user._id
    });

    await User.findByIdAndUpdate(req.user._id, {
      teamId: team._id,
      role: 'ADMIN'
    });

    const populatedTeam = await Team.findById(team._id).populate('adminId', 'name email');
    res.status(201).json({ team: populatedTeam, message: 'Team created successfully! You are now the admin.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET the current user's team details
router.get('/my-team', auth, async (req, res) => {
  try {
    if (!req.user.teamId) {
      return res.status(404).json({ error: 'You are not in a team' });
    }
    const team = await Team.findById(req.user.teamId).populate('adminId', 'name email');
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE team (Admin only)
router.put('/my-team', auth, checkRole('ADMIN'), async (req, res) => {
  try {
    const { error, value } = updateTeamSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const team = await Team.findByIdAndUpdate(
      req.user.teamId,
      value,
      { new: true, runValidators: true }
    ).populate('adminId', 'name email');

    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE team (Admin only)
router.delete('/my-team', auth, checkRole('ADMIN'), async (req, res) => {
  try {
    const teamId = req.user.teamId;

    // Remove all project IDs belonging to this team
    const projects = await Project.find({ teamId }).select('_id');
    const projectIds = projects.map(p => p._id);

    // Delete tasks and messages associated with these projects / team
    await Task.deleteMany({ projectId: { $in: projectIds } });
    await Message.deleteMany({ teamId });

    // Delete projects
    await Project.deleteMany({ teamId });

    // Remove team reference from all users
    await User.updateMany({ teamId }, { $unset: { teamId: '' } });

    // Finally delete the team itself
    await Team.findByIdAndDelete(teamId);

    res.json({ message: 'Team and all associated data deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;