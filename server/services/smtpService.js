const nodemailer = require('nodemailer');
const Config = require('../models/Config');

class SmtpService {
    async sendEmail(clientId, to, subject, body) {
        const config = await Config.findOne({ clientId });

        if (!config || !config.smtpHost || !config.smtpUser) {
            // Mock send for demo
            console.log(`[MOCK SMTP] Sending email to ${to}: ${subject}`);
            return { messageId: `mock-sent-${Date.now()}`, mock: true };
        }

        const transporter = nodemailer.createTransport({
            host: config.smtpHost,
            port: config.smtpPort,
            secure: config.smtpPort === 465,
            auth: {
                user: config.smtpUser,
                pass: config.smtpPassword
            }
        });

        const info = await transporter.sendMail({
            from: config.smtpUser,
            to,
            subject: `Re: ${subject}`,
            text: body
        });

        return info;
    }
}

module.exports = new SmtpService();
