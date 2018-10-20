const nodemailer = require('nodemailer');

class MailService {
    constructor(transportOptions) {
        this.transporter = nodemailer.createTransport(transportOptions);
    }

    sendMail(from, to, subject, body) {
        return this.transporter.sendMail({
            from,
            to,
            subject,
            text: body
        });
    }

    async verifyConnection() {
        const account = await nodemailer.createTestAccount();

        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: account.user,
                pass: account.pass
            }
        });

        return transporter.verify();
    }
}

module.exports = MailService;