const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

router.get('/summary', auth, async (req, res) => {
  try {
    const teamId = req.user.teamId;
    if (!teamId) return res.status(400).json({ error: 'Not in a team' });

    // ─── Base counts ───
    const projectCount = await Project.countDocuments({ teamId });
    const teamProjects = await Project.find({ teamId }).select('_id name');
    const projectIds = teamProjects.map(p => p._id);
    const taskCount = await Task.countDocuments({ projectId: { $in: projectIds } });
    const memberCount = await User.countDocuments({ teamId });

    // ─── Task status breakdown ───
    const todoTasks = await Task.countDocuments({ projectId: { $in: projectIds }, status: 'todo' });
    const inProgressTasks = await Task.countDocuments({ projectId: { $in: projectIds }, status: 'in-progress' });
    const doneTasks = await Task.countDocuments({ projectId: { $in: projectIds }, status: 'done' });

    const pendingTasks = todoTasks + inProgressTasks;
    const completedTasks = doneTasks;

    // ─── Projects with task counts ───
    const projectsWithCounts = await Promise.all(
      teamProjects.map(async (proj) => {
        const total = await Task.countDocuments({ projectId: proj._id });
        const done = await Task.countDocuments({ projectId: proj._id, status: 'done' });
        return { _id: proj._id, name: proj.name, taskCount: total, doneCount: done };
      })
    );

    // ─── Members with assigned tasks & status breakdown ───
    const allMembers = await User.find({ teamId }).select('_id name email role');
    const membersDetails = await Promise.all(
      allMembers.map(async (member) => {
        const assigned = await Task.find({
          assignedTo: member._id,
          projectId: { $in: projectIds }
        }).select('status');
        const todo = assigned.filter(t => t.status === 'todo').length;
        const inProgress = assigned.filter(t => t.status === 'in-progress').length;
        const done = assigned.filter(t => t.status === 'done').length;
        const total = assigned.length;
        const pending = todo + inProgress;
        return {
          _id: member._id,
          name: member.name,
          email: member.email,
          role: member.role,
          taskCounts: { todo, inProgress, done, total, pending },
        };
      })
    );

    // ─── Recent tasks ───
    const recentTasks = await Task.find({ projectId: { $in: projectIds } })
      .populate('assignedTo', 'name email')
      .sort({ updatedAt: -1 })
      .limit(5);

    res.json({
      projectCount,
      taskCount,
      memberCount,
      projects: projectsWithCounts,
      members: membersDetails,
      taskProgress: {
        todo: todoTasks,
        inProgress: inProgressTasks,
        done: doneTasks,
        pending: pendingTasks,
        completed: completedTasks,
      },
      recentTasks,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;