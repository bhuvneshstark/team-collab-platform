const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Validation schemas
const createSchema = Joi.object({
  title: Joi.string().required().trim().min(1).max(300),
  description: Joi.string().optional().allow('').max(2000),
  status: Joi.string().valid('todo', 'in-progress', 'done').default('todo'),
  projectId: Joi.string().required().length(24).hex(), // ObjectId format
  assignedTo: Joi.string().optional().length(24).hex().allow(null).default(null)
});

const updateSchema = Joi.object({
  title: Joi.string().optional().trim().min(1).max(300),
  description: Joi.string().optional().allow('').max(2000),
  status: Joi.string().optional().valid('todo', 'in-progress', 'done'),
  assignedTo: Joi.string().optional().length(24).hex().allow(null)
});

// GET all tasks for a specific project (query param: ?projectId=...)
router.get('/', auth, async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId query parameter is required' });
    }
    const tasks = await Task.find({ projectId }).populate('assignedTo', 'name email');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE a task (any authenticated user can create)
router.post('/', auth, async (req, res) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // If assignedTo is provided, only Admin/Manager can assign to someone else
    if (value.assignedTo && req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER') {
      // But allow assigning to themselves
      if (value.assignedTo !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Only Admin/Manager can assign tasks to other users' });
      }
    }

    const task = await Task.create(value);
    const populated = await task.populate('assignedTo', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a task (status or assignee)
router.put('/:id', auth, async (req, res) => {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // If trying to change assignee, only Admin/Manager
    if (value.assignedTo !== undefined) {
      if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER') {
        return res.status(403).json({ error: 'Only Admin/Manager can change assignment' });
      }
    }

    // Update fields
    Object.assign(task, value);
    await task.save();
    const populated = await task.populate('assignedTo', 'name email');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a task (Admin/Manager only)
router.delete('/:id', auth, checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;