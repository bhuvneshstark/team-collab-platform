const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Message = require('../models/Message');
const Project = require('../models/Project');

router.get('/', auth, async (req, res) => {
  try {
    if (!req.user.teamId) return res.status(400).json({ error: 'Not in a team' });

    const teamId = req.user.teamId;

    // Get all project IDs for the team
    const projects = await Project.find({ teamId }).select('_id');
    const projectIds = projects.map(p => p._id);

    // Recent tasks (created/updated)
    const recentTasks = await Task.find({ projectId: { $in: projectIds } })
      .populate('assignedTo', 'name')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    // Recent messages
    const recentMessages = await Message.find({ teamId })
      .populate('senderId', 'name')
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    // Combine and format
    const activities = [];

    recentTasks.forEach(task => {
      if (task.assignedTo) {
        activities.push({
          type: 'assignment',
          text: `Task "${task.title}" assigned to ${task.assignedTo.name}`,
          timestamp: task.updatedAt,
        });
      }
      if (task.status === 'done') {
        activities.push({
          type: 'status_change',
          text: `Task "${task.title}" moved to done`,
          timestamp: task.updatedAt,
        });
      }
      activities.push({
        type: 'task_created',
        text: `Task "${task.title}" created`,
        timestamp: task.createdAt,
      });
    });

    recentMessages.forEach(msg => {
      activities.push({
        type: 'message',
        text: `Message from ${msg.senderId.name}: "${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}"`,
        timestamp: msg.timestamp,
      });
    });

    // Sort by timestamp descending, limit to 20
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limited = activities.slice(0, 20);

    res.json(limited);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;