require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const adminRoutes = require('./routes/admin.routes'); 
const userRoutes = require('./routes/user.routes');// Import the routes

const app = express();

// Middleware
app.use(express.json());

// Database
connectDB();

// --- ROUTE REGISTRATION ---
// All routes in admin.routes.js will now be prefixed with /api/admin
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});