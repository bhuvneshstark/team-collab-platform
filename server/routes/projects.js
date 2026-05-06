const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Validation schemas
const createSchema = Joi.object({
  name: Joi.string().required().trim().min(1).max(200),
  description: Joi.string().optional().allow('').max(1000)
});

const updateSchema = Joi.object({
  name: Joi.string().optional().trim().min(1).max(200),
  description: Joi.string().optional().allow('').max(1000)
});

// GET all projects for the user's team
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ teamId: req.user.teamId }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE a project (Admin/Manager only)
router.post('/', auth, checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const project = await Project.create({
      ...value,
      teamId: req.user.teamId
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a project (Admin/Manager only)
router.put('/:id', auth, checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, teamId: req.user.teamId },
      value,
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a project (Admin only)
router.delete('/:id', auth, checkRole('ADMIN'), async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      teamId: req.user.teamId
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;