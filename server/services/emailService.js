const Imap = require('imap');
const { simpleParser } = require('mailparser');
const Config = require('../models/Config');
const Email = require('../models/Email');

class EmailService {
    async fetchEmails(clientId) {
        const config = await Config.findOne({ clientId });
        if (!config || !config.imapHost || !config.imapUser) {
            // Return mock data if no IMAP config
            return this._getMockEmails(clientId);
        }

        return new Promise((resolve, reject) => {
            const imap = new Imap({
                user: config.imapUser,
                password: config.imapPassword,
                host: config.imapHost,
                port: config.imapPort,
                tls: config.imapTls
            });

            const emails = [];

            imap.once('ready', () => {
                imap.openBox('INBOX', true, (err, box) => {
                    if (err) {
                        imap.end();
                        return reject(err);
                    }

                    // Build search criteria based on config
                    let searchCriteria = [];
                    if (config.emailFilter === 'unread') {
                        searchCriteria = ['UNSEEN'];
                    } else if (config.emailFilter === 'read') {
                        searchCriteria = ['SEEN'];
                    } else {
                        searchCriteria = ['ALL'];
                    }

                    imap.search(searchCriteria, (err, results) => {
                        if (err) {
                            imap.end();
                            return reject(err);
                        }

                        if (!results || results.length === 0) {
                            imap.end();
                            return resolve([]);
                        }

                        // Get last 50 emails
                        const latestResults = results.slice(-50);
                        const fetch = imap.fetch(latestResults, { bodies: '' });

                        fetch.on('message', (msg) => {
                            msg.on('body', (stream) => {
                                simpleParser(stream, (err, parsed) => {
                                    if (err) return;
                                    emails.push({
                                        messageId: parsed.messageId || '',
                                        subject: parsed.subject || '(No Subject)',
                                        from: parsed.from?.text || 'Unknown',
                                        to: parsed.to?.text || '',
                                        body: parsed.text || '',
                                        htmlBody: parsed.html || '',
                                        date: parsed.date || new Date(),
                                        isRead: config.emailFilter === 'read'
                                    });
                                });
                            });
                        });

                        fetch.once('end', () => {
                            imap.end();
                            resolve(emails);
                        });
                    });
                });
            });

            imap.once('error', (err) => {
                reject(err);
            });

            imap.connect();
        });
    }

    async saveEmails(clientId, emailsData) {
        const saved = [];
        for (const emailData of emailsData) {
            // Check if email already exists by messageId
            const exists = await Email.findOne({
                clientId,
                messageId: emailData.messageId
            });
            if (!exists && emailData.messageId) {
                const email = new Email({ ...emailData, clientId });
                await email.save();
                saved.push(email);
            } else if (!emailData.messageId) {
                const email = new Email({ ...emailData, clientId });
                await email.save();
                saved.push(email);
            }
        }
        return saved;
    }

    _getMockEmails(clientId) {
        return [
            {
                messageId: `mock-${Date.now()}-1`,
                subject: 'Product Inquiry - Enterprise Plan',
                from: 'john.doe@example.com',
                to: 'support@company.com',
                body: 'Hi, I would like to know more about your Enterprise plan. What are the features included and the pricing? We are a team of 50 people and looking for a solution that can scale. Please provide details about integration options as well. Thanks, John',
                htmlBody: '',
                date: new Date(),
                isRead: false
            },
            {
                messageId: `mock-${Date.now()}-2`,
                subject: 'Technical Support - API Integration Issue',
                from: 'jane.smith@techcorp.com',
                to: 'support@company.com',
                body: 'Hello Support Team, We are experiencing issues with the REST API integration. The authentication endpoint returns a 401 error even with valid credentials. Our API key is correctly configured. Can you help troubleshoot this? Environment: Production, API Version: v2.1. Regards, Jane Smith',
                htmlBody: '',
                date: new Date(Date.now() - 3600000),
                isRead: false
            },
            {
                messageId: `mock-${Date.now()}-3`,
                subject: 'Billing Question - Invoice #12345',
                from: 'accounts@bigclient.org',
                to: 'billing@company.com',
                body: 'Dear Billing Team, We received invoice #12345 dated last month. There seems to be a discrepancy in the charges. The professional plan should be $99/month but we were charged $149. Could you please review and issue a corrected invoice? Thank you, Accounts Department',
                htmlBody: '',
                date: new Date(Date.now() - 7200000),
                isRead: true
            }
        ];
    }
}

module.exports = new EmailService();
