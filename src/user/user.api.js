const Router = require('koa-router');

/* eslint-disable no-unused-vars */
const UserController = require('./user.controller'); 
const AuthService = require('./auth.service');
const UserSchema = require('./user.schema');
const ValidationMiddleware = require('../services/validation.middleware');
const MailService = require('../services/mail.service');
/* eslint-enable no-unused-vars */

function runController(method){
    return async(context, next) => {
        await method(context, next);
    };
}

class UserApi {
    /**
     * @param {Object} params
     * @param {AuthService} params.authService The authentication service for the protexted routes
     * @param {MailService} params.mailingService Mailing service to verify
     * @param {UserController} params.userController The controller with all the methods for user routes
     * @param {UserSchema} params.userSchema The input validation for user routes
     * @param {ValidationMiddleware} params.validationMiddleware The middleware for validating route input
     */
    constructor({
        authService,
        mailingService,
        userController,
        userSchema,
        validationMiddleware
    }) {
        this.router = new Router({
            prefix: '/users'
        });
        this.authService = authService;
        this.mailingService = mailingService;
        this.validationMiddleware = validationMiddleware;

        this.userController = userController;
        this.userSchema = userSchema;
    }

    buildRoutes() {
        this.router.post(
            '/login',
            this.validationMiddleware.validate(this.userSchema.schemas.login),
            runController(this.userController.login)
        );

        this.router.post(
            '/verify',
            this.validationMiddleware.validate(this.userSchema.schemas.verify),
            runController(this.userController.verify)
        );

        this.router.patch(
            '/reset/password',
            this.validationMiddleware.validate(this.userSchema.schemas.resetPassword),
            runController(this.userController.resetPassword)
        );
    }
}

module.exports = UserApi;