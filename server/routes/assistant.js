const express = require('express');
const router = express.Router();
const Joi = require('joi');
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// Validation
const commandSchema = Joi.object({
  command: Joi.string().required().trim().min(1).max(1000),
});

// Helper: find project by name within team
async function findProjectByName(name, teamId) {
  return await Project.findOne({ name: new RegExp(`^${name}$`, 'i'), teamId });
}

// Helper: find task by title (case-insensitive) within a project
async function findTaskByTitle(title, projectId) {
  return await Task.findOne({ title: new RegExp(`^${title}$`, 'i'), projectId });
}

// Helper: find user by name or email within team
async function findUserByNameOrEmail(query, teamId) {
  return await User.findOne({
    teamId,
    $or: [
      { name: new RegExp(`^${query}$`, 'i') },
      { email: new RegExp(`^${query}$`, 'i') },
    ],
  });
}

router.post('/', auth, async (req, res) => {
  try {
    const { error, value } = commandSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { command } = value;
    const teamId = req.user.teamId;
    if (!teamId) return res.status(400).json({ reply: 'You are not in a team.' });

    let reply = '';

    // ─── PATTERNS ──────────────────────────────────
    // 1. Create task "title" (in project "name")
    const createPattern = /create\s+task\s+"([^"]+)"(?:\s+in\s+project\s+"([^"]+)")?/i;
    // 2. Assign "task title" to "user name"
    const assignPattern = /assign\s+"([^"]+)"\s+to\s+"([^"]+)"/i;
    // 3. Move "task title" to "status"
    const movePattern = /move\s+"([^"]+)"\s+to\s+(todo|in-progress|done)/i;
    // 4. Delete task "title"
    const deletePattern = /delete\s+task\s+"([^"]+)"/i;
    // 5. List tasks in project "name"
    const listPattern = /list\s+tasks\s+(?:in\s+project\s+"([^"]+)")?/i;

    // ─── MATCH AND EXECUTE ────────────────────────

    // CREATE TASK
    let match = command.match(createPattern);
    if (match) {
      const taskTitle = match[1];
      let projectName = match[2];
      if (!projectName) {
        // If no project specified, pick the first project of the team
        const firstProject = await Project.findOne({ teamId }).sort({ createdAt: 1 });
        if (!firstProject) {
          return res.json({ reply: `No projects found. Please create a project first.` });
        }
        projectName = firstProject.name;
      }
      const project = await findProjectByName(projectName, teamId);
      if (!project) return res.json({ reply: `Project "${projectName}" not found.` });

      await Task.create({ title: taskTitle, projectId: project._id });
      return res.json({ reply: `✅ Task "${taskTitle}" created in project "${projectName}".` });
    }

    // ASSIGN TASK
    match = command.match(assignPattern);
    if (match) {
      const taskTitle = match[1];
      const userName = match[2];

      const user = await findUserByNameOrEmail(userName, teamId);
      if (!user) return res.json({ reply: `User "${userName}" not found in your team.` });

      // Find the task in any project of the team (simplification: search all tasks of team)
      const tasks = await Task.find({}).populate({
        path: 'projectId',
        match: { teamId },
      });
      // Filter out tasks whose projectId is null after populate
      const teamTasks = tasks.filter((t) => t.projectId);
      const task = teamTasks.find((t) => t.title.toLowerCase() === taskTitle.toLowerCase());
      if (!task) return res.json({ reply: `Task "${taskTitle}" not found.` });

      // Role check: only Admin/Manager can assign
      if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER') {
        return res.json({ reply: 'You do not have permission to assign tasks.' });
      }

      task.assignedTo = user._id;
      await task.save();
      return res.json({ reply: `✅ Task "${task.title}" assigned to ${user.name}.` });
    }

    // MOVE TASK
    match = command.match(movePattern);
    if (match) {
      const taskTitle = match[1];
      const newStatus = match[2];

      const tasks = await Task.find({}).populate({
        path: 'projectId',
        match: { teamId },
      });
      const teamTasks = tasks.filter((t) => t.projectId);
      const task = teamTasks.find((t) => t.title.toLowerCase() === taskTitle.toLowerCase());
      if (!task) return res.json({ reply: `Task "${taskTitle}" not found.` });

      task.status = newStatus;
      await task.save();
      return res.json({ reply: `✅ Task "${task.title}" moved to ${newStatus}.` });
    }

    // DELETE TASK
    match = command.match(deletePattern);
    if (match) {
      const taskTitle = match[1];
      const tasks = await Task.find({}).populate({
        path: 'projectId',
        match: { teamId },
      });
      const teamTasks = tasks.filter((t) => t.projectId);
      const task = teamTasks.find((t) => t.title.toLowerCase() === taskTitle.toLowerCase());
      if (!task) return res.json({ reply: `Task "${taskTitle}" not found.` });

      if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER') {
        return res.json({ reply: 'You do not have permission to delete tasks.' });
      }

      await Task.findByIdAndDelete(task._id);
      return res.json({ reply: `🗑️ Task "${taskTitle}" deleted.` });
    }

    // LIST TASKS
    match = command.match(listPattern);
    if (match) {
      let projectName = match[1];
      let project = null;
      if (projectName) {
        project = await findProjectByName(projectName, teamId);
        if (!project) return res.json({ reply: `Project "${projectName}" not found.` });
      }

      let tasks;
      if (project) {
        tasks = await Task.find({ projectId: project._id }).populate('assignedTo', 'name');
      } else {
        // List all tasks in all team projects
        const teamProjects = await Project.find({ teamId }).select('_id');
        const projectIds = teamProjects.map((p) => p._id);
        tasks = await Task.find({ projectId: { $in: projectIds } }).populate('assignedTo', 'name');
      }

      if (tasks.length === 0) return res.json({ reply: 'No tasks found.' });

      const taskList = tasks.map((t) => {
        const assignee = t.assignedTo ? t.assignedTo.name : 'Unassigned';
        return `- [${t.status}] ${t.title} (${assignee})`;
      }).join('\n');

      return res.json({ reply: `📋 Tasks:\n${taskList}` });
    }

    // Fallback
    return res.json({ reply: 'Sorry, I didn\'t understand that command. Try:\n- create task "title" in project "name"\n- assign "task" to "user"\n- move "task" to todo|in-progress|done\n- delete task "title"\n- list tasks in project "name"' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;