require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const clientContext = require('./middleware/clientContext');
const clientRoutes = require('./routes/clientRoutes');
const emailRoutes = require('./routes/emailRoutes');
const knowledgeRoutes = require('./routes/knowledgeRoutes');
const configRoutes = require('./routes/configRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const pollingService = require('./services/pollingService');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/email-automation';

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Client routes (no client context needed)
app.use('/api/clients', clientRoutes);

// Apply client context middleware to all other API routes
app.use('/api', clientContext);

// Scoped routes
app.use('/api/emails', emailRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/config', configRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            // Start background polling for all configured clients
            pollingService.startAll();
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    });
