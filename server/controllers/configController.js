const Config = require('../models/Config');
const pollingService = require('../services/pollingService');

exports.getConfig = async (req, res) => {
    try {
        let config = await Config.findOne({ clientId: req.clientId });
        if (!config) {
            config = await Config.create({ clientId: req.clientId });
        }
        // Mask sensitive fields
        const masked = config.toObject();
        if (masked.imapPassword) masked.imapPassword = '••••••••';
        if (masked.smtpPassword) masked.smtpPassword = '••••••••';
        if (masked.openaiApiKey) masked.openaiApiKey = masked.openaiApiKey.slice(0, 7) + '••••••••';
        res.json(masked);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateConfig = async (req, res) => {
    try {
        const updates = { ...req.body };

        // Don't overwrite passwords with masked values
        if (updates.imapPassword === '••••••••') delete updates.imapPassword;
        if (updates.smtpPassword === '••••••••') delete updates.smtpPassword;
        if (updates.openaiApiKey && updates.openaiApiKey.includes('••••••••')) delete updates.openaiApiKey;

        const config = await Config.findOneAndUpdate(
            { clientId: req.clientId },
            updates,
            { new: true, upsert: true }
        );

        // Restart or stop polling based on updated config
        if (config.pollingEnabled) {
            pollingService.startPollingForClient(req.clientId, config);
        } else {
            pollingService.stopPollingForClient(req.clientId);
        }

        res.json(config);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
