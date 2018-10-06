const Router = require('koa-router');

/* eslint-disable no-unused-vars */
const UserController = require('./user.controller'); 
const AuthService = require('./auth.service');
const UserSchema = require('./user.schema');
const ValidationMiddleware = require('../middleware/validation.middleware');
const MailService = require('../services/mail.service');
/* eslint-enable no-unused-vars */

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
            async (context, next) => {
                await this.userController.login(context, next);
            }
        );

        this.router.post(
            '/recover',
            this.validationMiddleware.validate(this.userSchema.schemas.verify),
            async (context, next) => {
                await this.userController.recover(context, next);
            }
        );

        this.router.patch(
            '/change/password',
            this.authService.authenticate(),
            this.validationMiddleware.validate(this.userSchema.schemas.changePassword),
            async (context, next) => {
                await this.userController.changePassword(context, next);
            }
        );

        this.router.post(
            '/register',
            this.validationMiddleware.validate(this.userSchema.schemas.register),
            async (context, next) => {
                await this.userController.register(context, next);
            }
        );

        this.router.get(
            '/confirm',
            this.validationMiddleware.validate(this.userSchema.schemas.confirm),
            async (context, next) => {
                await this.userController.confirm(context, next);
            }
        );

        this.router.patch(
            '/',
            this.authService.authenticate(),
            this.validationMiddleware.validate(this.userSchema.schemas.patchUser),
            async (context, next) => {
                await this.userController.patchUser(context, next);
            }
        );
    }
}

module.exports = UserApi;