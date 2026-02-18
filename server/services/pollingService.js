/**
 * Polling Service
 * 
 * Background service that periodically checks for new emails per client.
 * 
 * Flow:
 * 1. On first activation (lastFetchedAt is null) — just records the current
 *    timestamp. No emails are fetched. This avoids pulling 1000+ old emails.
 * 2. On subsequent polls — fetches only emails arriving AFTER lastFetchedAt,
 *    saves them, and auto-processes each through the LLM if autoProcessEnabled.
 */

const Client = require('../models/Client');
const Config = require('../models/Config');
const Email = require('../models/Email');
const Action = require('../models/Action');
const emailService = require('./emailService');
const llmService = require('./llmService');

class PollingService {
    constructor() {
        // Map<clientId, intervalId> — tracks active polling timers
        this.pollingTimers = new Map();
    }

    /**
     * Start polling for all active clients that have polling enabled.
     * Called once at server startup.
     */
    async startAll() {
        try {
            const clients = await Client.find({ isActive: true });
            for (const client of clients) {
                const config = await Config.findOne({ clientId: client._id });
                if (config?.pollingEnabled) {
                    this.startPollingForClient(client._id.toString(), config);
                }
            }
            console.log(`📩 Polling started for ${this.pollingTimers.size} client(s)`);
        } catch (err) {
            console.error('Failed to start polling:', err.message);
        }
    }

    /**
     * Start or restart polling for a specific client.
     */
    startPollingForClient(clientId, config) {
        // Stop existing timer if any
        this.stopPollingForClient(clientId);

        if (!config.pollingEnabled) return;

        const intervalMs = (config.pollingIntervalMinutes || 5) * 60 * 1000;

        console.log(`📩 Polling enabled for client ${clientId} — every ${config.pollingIntervalMinutes || 5} min`);

        // Run immediately, then on interval
        this._pollClient(clientId);

        const timer = setInterval(() => {
            this._pollClient(clientId);
        }, intervalMs);

        this.pollingTimers.set(clientId, timer);
    }

    /**
     * Stop polling for a specific client.
     */
    stopPollingForClient(clientId) {
        const timer = this.pollingTimers.get(clientId);
        if (timer) {
            clearInterval(timer);
            this.pollingTimers.delete(clientId);
        }
    }

    /**
     * Core polling logic for one client.
     */
    async _pollClient(clientId) {
        try {
            const config = await Config.findOne({ clientId });
            if (!config) return;

            // FIRST TIME: just record the timestamp, don't fetch any emails
            if (!config.lastFetchedAt) {
                config.lastFetchedAt = new Date();
                await config.save();
                console.log(`📌 Client ${clientId}: first activation — timestamp recorded (${config.lastFetchedAt.toISOString()}). No emails fetched.`);
                return;
            }

            // SUBSEQUENT POLLS: fetch only emails since last fetch
            const sinceDate = config.lastFetchedAt;
            const emailsData = await emailService.fetchEmails(clientId, sinceDate);

            if (emailsData.length === 0) {
                return; // Nothing new
            }

            const saved = await emailService.saveEmails(clientId, emailsData);
            console.log(`📬 Client ${clientId}: fetched ${saved.length} new email(s)`);

            // Update lastFetchedAt
            config.lastFetchedAt = new Date();
            await config.save();

            // Auto-process if enabled
            if (config.autoProcessEnabled && saved.length > 0) {
                await this._autoProcessEmails(clientId, saved, config);
            }
        } catch (err) {
            console.error(`Polling error for client ${clientId}:`, err.message);
        }
    }

    /**
     * Auto-process an array of newly fetched emails through the LLM.
     * Processes sequentially with a small delay to avoid API rate limits.
     */
    async _autoProcessEmails(clientId, emails, config) {
        const threshold = config.accuracyThreshold || 75;

        for (const email of emails) {
            try {
                // Skip if already processed
                if (email.status !== 'pending') continue;

                email.status = 'processing';
                await email.save();

                const result = await llmService.processEmail(clientId, email.body, email.subject);

                let finalStatus = 'drafted';
                if (result.accuracy < threshold && config.autoEscalateBelowThreshold) {
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
                    clientId,
                    emailId: email._id,
                    type: 'process',
                    response: result.response,
                    accuracy: result.accuracy,
                    performedBy: 'ai',
                    notes: `Auto-processed: ${result.reasoning}`
                });

                console.log(`  🤖 Auto-processed "${email.subject}" → ${finalStatus} (${result.accuracy}%)`);

                // Small delay between LLM calls to avoid rate limits
                await new Promise(r => setTimeout(r, 500));
            } catch (err) {
                console.error(`  ❌ Failed to process email ${email._id}:`, err.message);
                email.status = 'pending';
                await email.save();
            }
        }
    }

    /**
     * Get polling status for all clients (used by dashboard/API).
     */
    getStatus() {
        const status = {};
        for (const [clientId] of this.pollingTimers) {
            status[clientId] = { active: true };
        }
        return status;
    }
}

// Singleton
module.exports = new PollingService();
