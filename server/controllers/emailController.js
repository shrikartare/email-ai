const Email = require('../models/Email');
const Action = require('../models/Action');
const Config = require('../models/Config');
const emailService = require('../services/emailService');
const llmService = require('../services/llmService');
const smtpService = require('../services/smtpService');

exports.getEmails = async (req, res) => {
    try {
        const { status, isRead, search, page = 1, limit = 20 } = req.query;
        const filter = { clientId: req.clientId };

        if (status) filter.status = status;
        if (isRead !== undefined) filter.isRead = isRead === 'true';
        if (search) {
            filter.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { from: { $regex: search, $options: 'i' } },
                { body: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Email.countDocuments(filter);
        const emails = await Email.find(filter)
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({ emails, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.fetchEmails = async (req, res) => {
    try {
        const emailsData = await emailService.fetchEmails(req.clientId);
        const saved = await emailService.saveEmails(req.clientId, emailsData);
        res.json({ message: `Fetched ${saved.length} new emails.`, count: saved.length });
    } catch (err) {
        res.status(500).json({ error: `Failed to fetch emails: ${err.message}` });
    }
};

exports.getEmail = async (req, res) => {
    try {
        const email = await Email.findOne({ _id: req.params.id, clientId: req.clientId });
        if (!email) return res.status(404).json({ error: 'Email not found.' });
        res.json(email);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.processEmail = async (req, res) => {
    try {
        const email = await Email.findOne({ _id: req.params.id, clientId: req.clientId });
        if (!email) return res.status(404).json({ error: 'Email not found.' });

        email.status = 'processing';
        await email.save();

        const result = await llmService.processEmail(req.clientId, email.body, email.subject);

        const config = await Config.findOne({ clientId: req.clientId });
        const threshold = config?.accuracyThreshold || 75;

        // Determine action based on accuracy and config
        let finalStatus = 'drafted';
        if (result.accuracy < threshold && config?.autoEscalateBelowThreshold) {
            finalStatus = 'escalated';
        }

        email.draftResponse = result.response;
        email.accuracy = result.accuracy;
        email.status = finalStatus;
        email.processedAt = new Date();
        if (finalStatus === 'escalated') {
            email.escalationReason = result.reasoning;
        }
        await email.save();

        // Log action
        await Action.create({
            clientId: req.clientId,
            emailId: email._id,
            type: 'process',
            response: result.response,
            accuracy: result.accuracy,
            performedBy: 'ai',
            notes: result.reasoning
        });

        res.json({
            email,
            llmResult: result,
            action: finalStatus,
            threshold
        });
    } catch (err) {
        // Reset status on failure
        await Email.findByIdAndUpdate(req.params.id, { status: 'pending' });
        res.status(500).json({ error: `Processing failed: ${err.message}` });
    }
};

exports.sendEmail = async (req, res) => {
    try {
        const email = await Email.findOne({ _id: req.params.id, clientId: req.clientId });
        if (!email) return res.status(404).json({ error: 'Email not found.' });

        const responseBody = req.body.response || email.draftResponse;
        if (!responseBody) return res.status(400).json({ error: 'No response to send.' });

        await smtpService.sendEmail(req.clientId, email.from, email.subject, responseBody);

        email.status = 'sent';
        email.draftResponse = responseBody;
        await email.save();

        await Action.create({
            clientId: req.clientId,
            emailId: email._id,
            type: 'send',
            response: responseBody,
            accuracy: email.accuracy,
            performedBy: 'human'
        });

        res.json({ message: 'Email sent successfully.', email });
    } catch (err) {
        res.status(500).json({ error: `Failed to send email: ${err.message}` });
    }
};

exports.escalateEmail = async (req, res) => {
    try {
        const email = await Email.findOne({ _id: req.params.id, clientId: req.clientId });
        if (!email) return res.status(404).json({ error: 'Email not found.' });

        email.status = 'escalated';
        email.escalationReason = req.body.reason || 'Manually escalated by user';
        await email.save();

        await Action.create({
            clientId: req.clientId,
            emailId: email._id,
            type: 'escalate',
            response: email.draftResponse,
            accuracy: email.accuracy,
            performedBy: 'human',
            notes: email.escalationReason
        });

        res.json({ message: 'Email escalated.', email });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
