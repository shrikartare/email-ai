const Client = require('../models/Client');

const clientContext = async (req, res, next) => {
    // Skip client context for client management routes
    if (req.path.startsWith('/api/clients')) {
        return next();
    }

    const clientId = req.headers['x-client-id'];

    if (!clientId) {
        return res.status(400).json({
            error: 'Missing x-client-id header. Please select a client.'
        });
    }

    try {
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ error: 'Client not found.' });
        }
        if (!client.isActive) {
            return res.status(403).json({ error: 'Client is inactive.' });
        }
        req.clientId = client._id;
        req.client = client;
        next();
    } catch (err) {
        return res.status(400).json({ error: 'Invalid client ID format.' });
    }
};

module.exports = clientContext;
