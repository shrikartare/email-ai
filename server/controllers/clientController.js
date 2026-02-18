const Client = require('../models/Client');
const Config = require('../models/Config');
const Email = require('../models/Email');
const KnowledgeDoc = require('../models/KnowledgeDoc');
const Action = require('../models/Action');

exports.getClients = async (req, res) => {
    try {
        const clients = await Client.find().sort({ createdAt: -1 });
        res.json(clients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createClient = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: 'Client name is required.' });

        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const client = new Client({ name, slug, description });
        await client.save();

        // Create default config for this client
        await Config.create({ clientId: client._id });

        res.status(201).json(client);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'A client with this name already exists.' });
        }
        res.status(500).json({ error: err.message });
    }
};

exports.updateClient = async (req, res) => {
    try {
        const { name, description, isActive } = req.body;
        const client = await Client.findByIdAndUpdate(
            req.params.id,
            { name, description, isActive },
            { new: true }
        );
        if (!client) return res.status(404).json({ error: 'Client not found.' });
        res.json(client);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteClient = async (req, res) => {
    try {
        const clientId = req.params.id;
        await Promise.all([
            Client.findByIdAndDelete(clientId),
            Config.deleteMany({ clientId }),
            Email.deleteMany({ clientId }),
            KnowledgeDoc.deleteMany({ clientId }),
            Action.deleteMany({ clientId })
        ]);
        res.json({ message: 'Client and all associated data deleted.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
