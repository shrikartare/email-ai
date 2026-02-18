const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    messageId: { type: String, default: '' },
    subject: { type: String, default: '(No Subject)' },
    from: { type: String, required: true },
    to: { type: String, default: '' },
    body: { type: String, default: '' },
    htmlBody: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['pending', 'processing', 'drafted', 'sent', 'escalated'],
        default: 'pending'
    },
    draftResponse: { type: String, default: '' },
    accuracy: { type: Number, default: 0, min: 0, max: 100 },
    processedAt: { type: Date },
    escalationReason: { type: String, default: '' }
}, { timestamps: true });

emailSchema.index({ clientId: 1, status: 1 });
emailSchema.index({ clientId: 1, date: -1 });

module.exports = mongoose.model('Email', emailSchema);
