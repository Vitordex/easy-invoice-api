const nodemailer = require('nodemailer');

class MailService{
    constructor(transportOptions){
        this.transporter = nodemailer.createTransport(transportOptions);
    }

    sendMail(from, to, subject, body){
        return this.transporter.sendMail({
            from,
            to,
            subject,
            text: body
        });
    }
}

module.exports = MailService;