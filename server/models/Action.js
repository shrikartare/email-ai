const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    emailId: { type: mongoose.Schema.Types.ObjectId, ref: 'Email', required: true },
    type: {
        type: String,
        enum: ['draft', 'send', 'escalate', 'process'],
        required: true
    },
    response: { type: String, default: '' },
    accuracy: { type: Number, default: 0 },
    performedBy: { type: String, enum: ['ai', 'human'], default: 'ai' },
    notes: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

actionSchema.index({ clientId: 1, createdAt: -1 });

module.exports = mongoose.model('Action', actionSchema);
