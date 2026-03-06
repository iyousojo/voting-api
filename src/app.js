require('dotenv').config();
const express = require('express');
const cors = require('cors'); // 1. Import CORS
const connectDB = require('./config/db');
const adminRoutes = require('./routes/admin.routes'); 
const userRoutes = require('./routes/user.routes');

const app = express();

// Middleware
app.use(cors()); // 2. Enable CORS for all origins (Required for frontend integration)
app.use(express.json());

// Database
connectDB();

// --- ROUTE REGISTRATION ---
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});