require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const teamRoutes = require('./routes/teams');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const passwordRoutes = require('./routes/password');

// Connect to DB
connectDB();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

// WebSocket setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

// Store active users
const activeUsers = {};

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

   // User joins project room
  socket.on('join_project', (projectId) => {
    socket.join(`project:${projectId}`);
    activeUsers[socket.id] = { projectId };
    console.log(`📍 User joined project: ${projectId}`);
  });

  // User leaves project room
  socket.on('leave_project', (projectId) => {
    socket.leave(`project:${projectId}`);
    delete activeUsers[socket.id];
    console.log(`📍 User left project: ${projectId}`);
  });

  // Task created - broadcast to all in project
  socket.on('task:create', (data) => {
    console.log('📨 Broadcasting task:created:', data.title);
    io.to(`project:${data.project_id}`).emit('task:created', data);
  });

  // Task updated - broadcast to all in project
  socket.on('task:update', (data) => {
    console.log('📨 Broadcasting task:updated:', data.title);
    io.to(`project:${data.project_id}`).emit('task:updated', data);
  });

  // Task deleted - broadcast to all in project
  socket.on('task:delete', (data) => {
    console.log('📨 Broadcasting task:deleted:', data.taskId);
    io.to(`project:${data.project_id}`).emit('task:deleted', data);
  });

  // Status changed - broadcast to all in project
  socket.on('task:status_changed', (data) => {
    console.log('📨 Broadcasting task:status_changed:', data.status);
    io.to(`project:${data.project_id}`).emit('task:status_changed', data);
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });

  // Task events
  socket.on('task:update', (data) => {
    io.to(`project:${data.project_id}`).emit('task:updated', data);
  });

  socket.on('join_project', (projectId) => {
    socket.join(`project:${projectId}`);
    console.log(`📍 User joined project: ${projectId}`);
  });

  socket.on('leave_project', (projectId) => {
    socket.leave(`project:${projectId}`);
    console.log(`📍 User left project: ${projectId}`);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});
app.use('/api/password', passwordRoutes);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});