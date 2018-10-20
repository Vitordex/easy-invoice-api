/*globals describe, it*/
const assert = require('assert');
const config = require('../../src/services/config.service');

const MailService = require('../../src/services/mail.service');
const mailOptions = config.get('mail.options');

describe('Mail service', () => {
    it('happy path', async () => {
        const mailService = new MailService(mailOptions);

        await mailService.verifyConnection();
    });

    it('should throw an error on invalid configurations', async () => {
        const invalidOptions = {
            service: 'gmail',
            auth: {
                user: 't35t3t@gmail.com',
                pass: 'teste'
            }
        };
        const mailService = new MailService(invalidOptions);

        try {
            await mailService.sendMail('teste', 'alo', 'Teste', 'corpo de teste');   
        } catch (error) {
            return;
        }

        assert(false);
    });
});