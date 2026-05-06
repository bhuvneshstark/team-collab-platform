require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const messageRoutes = require('./routes/messages');
const teamRoutes = require('./routes/teams');
const activityRoutes = require('./routes/activity');
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: ['https://team-collab-platform-le7y.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use('/api/teams', teamRoutes);

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['https://team-collab-platform-le7y.vercel.app', 'http://localhost:5173'],
    methods: ['GET', 'POST']
  }
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    
    const admin = require('./config/firebase');
    const decoded = await admin.auth().verifyIdToken(token);
    socket.user = decoded;   // { uid, email, name }
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Make io accessible in routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join a team room (client emits 'join-team' with teamId)
  socket.on('join-team', (teamId) => {
    socket.join(teamId);
    console.log(`Socket ${socket.id} joined team ${teamId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/activity', activityRoutes);


const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);


// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Team Collaboration API is running!' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);


const assistantRoutes = require('./routes/assistant');
app.use('/api/assistant', assistantRoutes);


const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', dashboardRoutes);