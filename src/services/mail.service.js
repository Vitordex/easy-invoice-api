const LogService = require('../log/log.service'); // eslint-disable-line

const ServiceLog = require('../log/service.log.model');

const nodemailer = require('nodemailer');

class MailService {
    /**
     * @param {Object} transportOptions 
     * @param {LogService} logger 
     */
    constructor(transportOptions, logger) {
        this.transporter = nodemailer.createTransport(transportOptions);

        this.logger = logger.child({ service: 'mail.service' });
    }

    /**
     * Send an email
     * @param {String} from 
     * @param {String} to 
     * @param {String} subject 
     * @param {String} body The email body
     */
    sendMail(from, to, subject, body) {
        const functionName = 'sendMail';
        const params = { from, to, subject, body };

        return this.transporter.sendMail({
            from,
            to,
            subject,
            text: body
        }).then((result) => {
            const log = new ServiceLog(functionName, params, result).toObject();
            this.logger.info(log);

            return result;
        }).catch((err) => {
            const log = new ServiceLog(functionName, params, err).toObject();
            this.logger.error(log);

            return Promise.reject(err);
        });
    }

    async verifyConnection() {
        /*const functionName = 'verifyConnection';
        const params = {};*/

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

        return transporter.verify()/*
            .then((result) => {
                const log = new ServiceLog(functionName, params, result).toObject();
                this.logger.info(log);

                return result;
            }).catch((err) => {
                const log = new ServiceLog(functionName, params, err).toObject();
                this.logger.error(log);

                return Promise.reject(err);
            })*/;
    }
}

module.exports = MailService;