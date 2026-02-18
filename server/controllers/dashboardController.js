const Email = require('../models/Email');
const Action = require('../models/Action');

exports.getStats = async (req, res) => {
    try {
        const clientId = req.clientId;

        const [total, pending, drafted, sent, escalated, recentActions] = await Promise.all([
            Email.countDocuments({ clientId }),
            Email.countDocuments({ clientId, status: 'pending' }),
            Email.countDocuments({ clientId, status: 'drafted' }),
            Email.countDocuments({ clientId, status: 'sent' }),
            Email.countDocuments({ clientId, status: 'escalated' }),
            Action.find({ clientId })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('emailId', 'subject from')
        ]);

        // Calculate average accuracy from processed emails
        const processedEmails = await Email.find({
            clientId,
            accuracy: { $gt: 0 }
        }).select('accuracy');

        const avgAccuracy = processedEmails.length > 0
            ? Math.round(processedEmails.reduce((sum, e) => sum + e.accuracy, 0) / processedEmails.length)
            : 0;

        res.json({
            total,
            pending,
            drafted,
            sent,
            escalated,
            avgAccuracy,
            recentActions
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getActions = async (req, res) => {
    try {
        const actions = await Action.find({ clientId: req.clientId })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('emailId', 'subject from');
        res.json(actions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
