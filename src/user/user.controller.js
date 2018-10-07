/* eslint-disable no-unused-vars */
const UserService = require('./user.service');
const MailService = require('../services/mail.service');
const ControllerError = require('../log/controller.error.model');
/* eslint-enable no-unused-vars */

const JwtToken = require('./jwt.model.js');

const {
    DB: {
        PROPS: {
            DATE_HEADER
        }
    },
    AUTH,
    API: {
        STATUS
    }
} = require('../enums');
const { ACTIVE: activeProp } = require('../values').DATABASE.PROPS;

class UserController {
    /**
     * 
     * @param {Object} params 
     * @param {UserService} params.userService
     * @param {String} params.authHash
     * @param {Object} params.authConfigs
     * @param {MailService} params.mailService
     * @param {ControllerError} params.apiErrorModel
     */
    constructor({
        userService,
        authHash,
        authConfigs,
        mailService,
        apiErrorModel
    }) {
        this.mailService = mailService;
        this.userService = userService;

        this.hash = authHash;
        this.tokenExpiration = authConfigs.token.expiration;
        this.tokenOptions = authConfigs.optionals;

        this.ControllerError = apiErrorModel;
    }

    async login(context, next) {
        const requestBody = context.request.body;
        const email = requestBody.email;
        const user = await this.userService.findUser({ email });

        if (!user) {
            const error = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid email or password',
                'user',
                'login',
                requestBody,
                'User not found'
            );
            context.throw(STATUS.NOT_FOUND, error);

            return next();
        }

        const password = requestBody.password;
        const match = this.userService.matchPassword(password, user.password);

        if (!match) {
            const status = STATUS.NOT_FOUND;
            const error = new ControllerError(
                status,
                'Invalid email or password',
                'user',
                'login',
                requestBody,
                'Incorrect Password'
            );
            context.throw(status, error);

            return next();
        }

        if (user.active === activeProp.INACTIVE || user.active === activeProp.DISABLED) {
            const status = STATUS.UNAUTHORIZED;
            const error = new ControllerError(
                status,
                'Account not activated',
                'user',
                'login',
                requestBody,
                'User not able to login due to inactive'
            );
            context.throw(status, error);

            return next();
        }

        const sentUser = user.toJSON();

        user.active = activeProp.ACTIVE;

        try {
            await user.save();
        } catch (error) {
            const status = STATUS.INTERNAL_ERROR;
            const saveError = new ControllerError(
                status,
                'Error saving the user',
                'user',
                'login',
                requestBody,
                error
            );
            context.throw(status, saveError);

            return next();
        }

        const token = new JwtToken({ id: user.id }, this.hash, this.tokenOptions);

        context.set(AUTH.TOKEN_HEADER, await token.hash());
        context.body = sentUser;
        context.type = 'json';
        return next();
    }

    async recover(context, next) {
        const email = context.request.body.email;

        const user = await this.userService.findUser({ email });
        if (!user) {
            context.throw(STATUS.NOT_FOUND, 'User not found');
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
            context.throw(STATUS.BAD_REQUEST, 'Invalid email');
            return next();
        }

        context.status = STATUS.OK;
        return next();
    }

    async changePassword(context, next) {
        const token = context.request.headers[AUTH.TOKEN_HEADER];
        const emailToken = new JwtToken({}, this.hash, this.tokenOptions);

        let payload;

        try {
            payload = await emailToken.verify(token);
        } catch (error) {
            context.throw(STATUS.UNAUTHORIZED, 'Invalid token');
            return next();
        }

        const newPassword = context.request.body.password;
        const hashedPass = this.userService.hashPassword(newPassword);

        const user = await this.userService.findUser({ email: payload.email });
        user.password = hashedPass;

        try {
            await user.save();
        } catch (error) {
            context.throw(STATUS.INTERNAL_ERROR, 'Error saving new password');
            return next();
        }

        context.status = STATUS.OK;
        return next();
    }

    async register(context, next) {
        const { body } = context.request;

        const found = await this.userService.findUser({ email: body.email });
        if (found) {
            context.throw(STATUS.BAD_REQUEST, 'User already exists');
            return next();
        }

        const user = await this.userService.create(body);

        try {
            await user.save();
        } catch (error) {
            context.throw(STATUS.INTERNAL_ERROR, 'Error saving the user');
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
            context.throw(STATUS.INTERNAL_ERROR, 'Error sending the confirmation email');
            return next();
        }

        context.status = STATUS.OK;
        return next();
    }

    async confirm(context, next) {
        const token = context.request.query.token;
        const emailToken = new JwtToken({}, this.hash, this.tokenOptions);

        let payload;

        try {
            payload = await emailToken.verify(token);
        } catch (error) {
            context.throw(STATUS.UNAUTHORIZED, 'Invalid token');
            return next();
        }

        const user = await this.userService.findUser({ _id: payload.id });

        if (!user) {
            context.throw(STATUS.NOT_FOUND, 'Invalid User');
            return next();
        }

        user.active = activeProp.STATIC;

        try {
            await user.save();
        } catch (error) {
            context.throw(STATUS.INTERNAL_ERROR, 'Error saving the user');
            return next();
        }

        context.status = STATUS.OK;
        return next();
    }

    async patchUser(context, next) {
        const token = context.input.headers[AUTH.TOKEN_HEADER];
        const tokenValidator = new JwtToken({}, this.hash, this.tokenOptions);

        let payload;

        try {
            payload = await tokenValidator.verify(token);
        } catch (error) {
            const status = STATUS.UNAUTHORIZED;
            const tokenError = new ControllerError(
                status,
                'Invalid token',
                'user',
                'patchUser',
                context.input,
                error
            );
            context.throw(status, tokenError);

            return next();
        }

        const user = await this.userService.findUser({ _id: payload.id });

        if (!user) {
            const error = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid email or password',
                'user',
                'patchUser',
                context.input,
                'User not found'
            );
            context.throw(STATUS.NOT_FOUND, error);

            return next();
        }

        const { body } = context.input;
        const { headers } = context.input;
        const { password } = body;

        if (password)
            body.password = await this.userService.hashPassword(password);

        try {
            await user.updateWithDates(body, headers[DATE_HEADER]);
        } catch (error) {
            const status = STATUS.INTERNAL_ERROR;
            const saveError = new ControllerError(
                status,
                'Error saving the user',
                'user',
                'login',
                context.input,
                error
            );
            context.throw(status, saveError);

            return next();
        }

        context.status = STATUS.OK;
        return next();
    }
}

module.exports = UserController;