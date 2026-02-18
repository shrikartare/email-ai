const mongoose = require('mongoose');

const knowledgeDocSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    filename: { type: String, default: '' },
    fileType: { type: String, default: 'text' },
    isActive: { type: Boolean, default: true },
    uploadedAt: { type: Date, default: Date.now }
});

knowledgeDocSchema.index({ clientId: 1, isActive: 1 });

module.exports = mongoose.model('KnowledgeDoc', knowledgeDocSchema);
