/* eslint-disable no-unused-vars */
const UserService = require('./user.service');
const MailService = require('../services/mail.service');
/* eslint-enable no-unused-vars */

const JwtToken = require('./jwt.model.js');

const enums = require('../enums');
const { ACTIVE: activeProp } = require('../values').DATABASE.PROPS;

class UserController {
    /**
     * 
     * @param {Object} params 
     * @param {UserService} params.userService
     * @param {String} params.authHash
     * @param {Object} params.authConfigs
     * @param {MailService} params.mailService
     */
    constructor({
        userService,
        authHash,
        authConfigs,
        mailService
    }) {
        this.mailService = mailService;
        this.userService = userService;

        this.hash = authHash;
        this.tokenExpiration = authConfigs.token.expiration;
        this.tokenOptions = authConfigs.optionals;
    }

    async login(context, next) {
        const requestBody = context.request.body;
        const email = requestBody.email;
        const user = await this.userService.findUser({ email });

        if (!user) {
            context.throw(404, {
                message: 'Invalid email or password',
                reason: {
                    source: 'user.controller',
                    method: 'login',
                    input: requestBody,
                    output: 'User not found'
                }
            });
            return next();
        }

        const password = requestBody.password;
        const match = this.userService.matchPassword(password, user.password);

        if (!match) {
            context.throw(404, {
                message: 'Invalid email or password',
                reason: {
                    source: 'user.controller',
                    method: 'login',
                    input: requestBody,
                    output: 'Wrong password'
                }
            });
            return next();
        }

        if (user.active === activeProp.INACTIVE || user.active === activeProp.DISABLED) {
            context.throw(401, {
                message: 'Account not activated',
                reason: {
                    source: 'user.controller',
                    method: 'login',
                    input: requestBody,
                    output: 'User not able to login due to inactive'
                }
            });
            return next();
        }

        const sentUser = user.toJSON();

        user.active = activeProp.ACTIVE;

        try {
            await user.save();
        } catch (error) {
            context.throw(500, {
                message: 'Error saving the user',
                reason: {
                    source: 'user.controller',
                    method: 'login',
                    input: requestBody,
                    output: error
                }
            });
            return next();
        }

        const token = new JwtToken({ id: user.id }, this.hash, this.tokenOptions);

        context.set(enums.AUTH.TOKEN_HEADER, await token.hash());
        context.body = sentUser;
        context.type = 'json';
        return next();
    }

    async recover(context, next) {
        const email = context.request.body.email;

        const user = await this.userService.findUser({ email });
        if (!user) {
            context.throw(404, 'User not found');
            return next();
        }

        const token = new JwtToken(
            { id: user.id, email: user.email, shouldFind: false },
            this.hash,
            this.tokenOptions
        );

        try {
            await this.mailService.sendMail(
                'Teste Verificação',
                email,
                'Troca de senha - Empresa',
                `Houve uma solicitação de troca de senha 
para este email. Se você deseja realizar a troca 
favor clique no link ${context.request.origin}/users/reset/password?token=${await token.hash()}
Se não ignore este email`
            );
        } catch (error) {
            context.throw(400, 'Invalid email');
            return next();
        }

        context.status = 200;
        return next();
    }

    async changePassword(context, next) {
        const token = context.request.headers[enums.AUTH.TOKEN_HEADER];
        const emailToken = new JwtToken({}, this.hash, this.tokenOptions);

        let payload;

        try {
            payload = await emailToken.verify(token);
        } catch (error) {
            context.throw(401, 'Invalid token');
            return next();
        }

        const newPassword = context.request.body.password;
        const hashedPass = this.userService.hashPassword(newPassword);

        const user = await this.userService.findUser({ email: payload.email });
        user.password = hashedPass;

        try {
            await user.save();
        } catch (error) {
            context.throw(500, 'Error saving new password');
            return next();
        }

        context.status = 200;
        return next();
    }

    async register(context, next) {
        const { body } = context.request;

        const found = await this.userService.findUser({ email: body.email });
        if (found) {
            context.throw(400, 'User already exists');
            return next();
        }

        const user = await this.userService.create(body);

        try {
            await user.save();
        } catch (error) {
            context.throw(500, 'Error saving the user');
            return next();
        }

        const token = new JwtToken(
            { id: user.id },
            this.hash,
            this.tokenOptions
        );

        try {
            await this.mailService.sendMail(
                'Suporte <suporte@orcamentofacil.com>',
                user.email,
                'Verificação de Email',
                `${context.request.origin}/users/confirm?token=${await token.hash()}`
            );
        } catch (error) {
            context.throw(500, 'Error sending the confirmation email');
            return next();
        }

        context.status = 200;
        return next();
    }

    async confirm(context, next) {
        const token = context.request.query.token;
        const emailToken = new JwtToken({}, this.hash, this.tokenOptions);

        let payload;

        try {
            payload = await emailToken.verify(token);
        } catch (error) {
            context.throw(401, 'Invalid token');
            return next();
        }

        const user = await this.userService.findUser({ _id: payload.id });

        if (!user) {
            context.throw(404, 'Invalid User');
            return next();
        }

        user.active = activeProp.STATIC;

        try {
            await user.save();
        } catch (error) {
            context.throw(500, 'Error saving the user');
            return next();
        }

        context.status = 200;
        return next();
    }
}

module.exports = UserController;