/*globals describe, it*/
const assert = require('assert');

const {
    services: {
        MailService,
        ConfigService: config
    }
} = require('../../src/');

const mailOptions = config.get('mail.options');

describe('Mail service', () => {
    const log = {
        info: () => {},
        error: () => {}
    };
    const logger = {
        child: () => log
    };

    it('happy path', async () => {
        const mailService = new MailService(mailOptions, logger);

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
        const mailService = new MailService(invalidOptions, logger);

        try {
            await mailService.sendMail('teste', 'alo', 'Teste', 'corpo de teste');
        } catch (error) {
            return;
        }

        assert(false);
    });
});