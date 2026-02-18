const KnowledgeDoc = require('../models/KnowledgeDoc');
const fs = require('fs');
const path = require('path');

exports.getDocs = async (req, res) => {
    try {
        const docs = await KnowledgeDoc.find({ clientId: req.clientId }).sort({ uploadedAt: -1 });
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.uploadDoc = async (req, res) => {
    try {
        let title = req.body.title;
        let content = req.body.content || '';
        let filename = '';
        let fileType = 'text';

        // Handle file upload via multer
        if (req.file) {
            filename = req.file.originalname;
            fileType = path.extname(filename).slice(1) || 'text';
            content = fs.readFileSync(req.file.path, 'utf-8');
            // Clean up uploaded temp file
            fs.unlinkSync(req.file.path);
        }

        if (!title) {
            title = filename || 'Untitled Document';
        }

        if (!content) {
            return res.status(400).json({ error: 'Document content is required.' });
        }

        const doc = new KnowledgeDoc({
            clientId: req.clientId,
            title,
            content,
            filename,
            fileType
        });
        await doc.save();
        res.status(201).json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteDoc = async (req, res) => {
    try {
        const doc = await KnowledgeDoc.findOneAndDelete({
            _id: req.params.id,
            clientId: req.clientId
        });
        if (!doc) return res.status(404).json({ error: 'Document not found.' });
        res.json({ message: 'Document deleted.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.toggleDoc = async (req, res) => {
    try {
        const doc = await KnowledgeDoc.findOne({ _id: req.params.id, clientId: req.clientId });
        if (!doc) return res.status(404).json({ error: 'Document not found.' });

        doc.isActive = !doc.isActive;
        await doc.save();
        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
