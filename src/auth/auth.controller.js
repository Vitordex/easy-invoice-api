/* eslint-disable no-unused-vars */
const UserService = require('../user/user.service');
const MailService = require('../services/mail.service');
const ControllerError = require('../log/controller.error.model');
const JwtService = require('./jwt.service');
/* eslint-enable no-unused-vars */

const format = require('string-template');

const {
    AUTH,
    API: {
        STATUS,
        RESPONSE_TYPES
    }
} = require('../enums');
const { ACTIVE: activeProp } = require('../values').DATABASE.PROPS;

const controllerName = 'auth';

class UserController {
    /**
     * 
     * @param {Object} params 
     * @param {UserService} params.userService
     * @param {String} params.authHash
     * @param {Object} params.authConfigs
     * @param {MailService} params.mailService
     * @param {ControllerError} params.apiErrorModel
     * @param {JwtService} params.authJwtService
     * @param {JwtService} params.confirmJwtService
     * @param {JwtService} params.resetJwtService
     * @param {Object} params.emailTemplates
     */
    constructor({
        userService,
        mailService,
        apiErrorModel,
        authJwtService,
        confirmJwtService,
        resetJwtService,
        emailTemplates
    }) {
        this.mailService = mailService;
        this.userService = userService;

        this.authJwtService = authJwtService;
        this.confirmJwtService = confirmJwtService;
        this.resetJwtService = resetJwtService;

        this.ControllerError = apiErrorModel;

        this.emailTemplates = emailTemplates;
    }

    async login(context, next) {
        const functionName = 'login';
        const requestBody = context.input.body;
        const email = requestBody.email;
        const user = await this.userService.findUser({ email });

        if (!user) {
            const controllerError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid email or password',
                controllerName,
                functionName,
                requestBody,
                'User not found'
            );
            context.throw(STATUS.NOT_FOUND, controllerError);

            return next();
        }

        const password = requestBody.password;
        const match = this.userService.matchPassword(password, user.password);

        if (!match) {
            const controllerError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid email or password',
                controllerName,
                functionName,
                requestBody,
                'User not found'
            );
            context.throw(STATUS.NOT_FOUND, controllerError);

            return next();
        }

        if (user.active === activeProp.INACTIVE || user.active === activeProp.DISABLED) {
            const status = STATUS.UNAUTHORIZED;
            const controllerError = new ControllerError(
                status,
                'Account not activated',
                controllerName,
                functionName,
                requestBody,
                'User not able to login due to inactive'
            );
            context.throw(status, controllerError);

            return next();
        }

        const sentUser = user.toJSON();

        if (user.active === 'STATIC') {
            user.active = activeProp.ACTIVE;

            try {
                await user.save();
            } catch (error) {
                const controllerError = new ControllerError(
                    STATUS.INTERNAL_ERROR,
                    'Error saving the user',
                    controllerName,
                    functionName,
                    context.input,
                    error
                );
                context.throw(STATUS.INTERNAL_ERROR, controllerError);

                return next();
            }
        }

        const tokenPayload = {
            id: user._id
        };
        const token = await this.authJwtService.generate(tokenPayload);

        context.set(AUTH.TOKEN_HEADER, token);
        context.body = sentUser;
        context.type = RESPONSE_TYPES.JSON;
        return next();
    }

    async recover(context, next) {
        const functionName = 'recover';
        const { email } = context.input.body;

        const user = await this.userService.findUser({ email });
        if (!user) {
            const controllerError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid email or password',
                controllerName,
                functionName,
                context.input,
                'User not found'
            );
            context.throw(STATUS.NOT_FOUND, controllerError);

            return next();
        }

        const generateOptions = {
            id: user._id,
            email: user.email
        };
        const token = await this.resetJwtService.generate(generateOptions);

        try {
            const recoverTemplate = this.emailTemplates.recover;
            const fillOptions = {
                origin: context.request.origin,
                token
            };
            await this.mailService.sendMail(
                recoverTemplate.from,
                email,
                recoverTemplate.subject,
                format(recoverTemplate.body, fillOptions)
            );
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.BAD_REQUEST,
                'Invalid email',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.BAD_REQUEST, controllerError);

            return next();
        }

        context.status = STATUS.OK;
        return next();
    }

    async changePassword(context, next) {
        const functionName = 'changePassword';
        const token = context.input.headers[AUTH.TOKEN_HEADER];

        let payload;

        try {
            payload = await this.resetJwtService.verify(token);
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.UNAUTHORIZED,
                'Invalid token',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.UNAUTHORIZED, controllerError);

            return next();
        }

        const newPassword = context.input.body.password;
        const hashedPass = this.userService.hashPassword(newPassword);

        const user = await this.userService.findUser({ email: payload.email });
        user.password = hashedPass;

        try {
            await user.save();
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Error saving the user',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR, controllerError);

            return next();
        }

        context.status = STATUS.OK;
        return next();
    }

    async register(context, next) {
        const functionName = 'register';
        const { body } = context.input;

        const found = await this.userService.findUser({ email: body.email });
        if (found) {
            const controllerError = new ControllerError(
                STATUS.BAD_REQUEST,
                'User already exists',
                controllerName,
                functionName,
                context.input,
                'User already exists'
            );
            context.throw(STATUS.BAD_REQUEST, controllerError);

            return next();
        }

        const user = await this.userService.create(body);
        user.address.state = body.state;

        try {
            await user.save();
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Error saving the user',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR, controllerError);

            return next();
        }

        try {
            const tokenPayload = {
                id: user._id
            };
            const token = await this.confirmJwtService.generate(tokenPayload);
            
            const confirmTemplate = this.emailTemplates.confirm;
            const fillOptions = {
                origin: context.request.origin,
                token
            };
            await this.mailService.sendMail(
                confirmTemplate.from,
                user.email,
                confirmTemplate.subject,
                format(confirmTemplate.body, fillOptions)
            );
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Invalid email',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR, controllerError);

            return next();
        }

        context.status = STATUS.OK;
        return next();
    }

    async confirm(context, next) {
        const functionName = 'confirm';
        const { token } = context.input.query;

        let payload;

        try {
            payload = await this.confirmJwtService.verify(token);
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.UNAUTHORIZED,
                'Invalid token',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.UNAUTHORIZED, controllerError);

            return next();
        }

        const user = await this.userService.findUser({ _id: payload.id });

        if (!user) {
            const controllerError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid User',
                controllerName,
                functionName,
                context.input,
                'User not found'
            );
            context.throw(STATUS.NOT_FOUND, controllerError);

            return next();
        }

        user.active = activeProp.STATIC;

        try {
            await user.save();
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Error saving the user',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR, controllerError);

            return next();
        }

        context.status = STATUS.OK;
        return next();
    }
}

module.exports = UserController;