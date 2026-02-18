const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, unique: true },
    // Email filter
    emailFilter: { type: String, enum: ['read', 'unread', 'all'], default: 'unread' },
    // IMAP settings
    imapHost: { type: String, default: '' },
    imapPort: { type: Number, default: 993 },
    imapUser: { type: String, default: '' },
    imapPassword: { type: String, default: '' },
    imapTls: { type: Boolean, default: true },
    // SMTP settings
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: '' },
    smtpPassword: { type: String, default: '' },
    // LLM settings
    accuracyThreshold: { type: Number, default: 75, min: 0, max: 100 },
    llmModel: { type: String, default: 'gpt-4o-mini' },
    openaiApiKey: { type: String, default: '' },
    // Auto-action settings
    autoSendAboveThreshold: { type: Boolean, default: false },
    autoEscalateBelowThreshold: { type: Boolean, default: true },
    // Polling settings
    pollingEnabled: { type: Boolean, default: false },
    pollingIntervalMinutes: { type: Number, default: 5, min: 1, max: 60 },
    autoProcessEnabled: { type: Boolean, default: true },
    // Timestamp for incremental fetch — set on first activation, only fetch emails after this
    lastFetchedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Config', configSchema);
