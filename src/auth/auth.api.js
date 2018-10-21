const Router = require('koa-router');

/* eslint-disable no-unused-vars */
const UserController = require('./auth.controller'); 
const AuthService = require('./auth.service');
const UserSchema = require('./auth.schema');
const ValidationMiddleware = require('../middleware/validation.middleware');
const MailService = require('../services/mail.service');
/* eslint-enable no-unused-vars */

class UserApi {
    /**
     * @param {Object} params
     * @param {AuthService} params.authService The authentication service for the protexted routes
     * @param {MailService} params.mailingService Mailing service to verify
     * @param {UserController} params.authController The controller with all the methods for user routes
     * @param {UserSchema} params.authSchema The input validation for user routes
     * @param {ValidationMiddleware} params.validationMiddleware The middleware for validating route input
     */
    constructor({
        authService,
        mailingService,
        authController,
        authSchema,
        validationMiddleware
    }) {
        this.router = new Router({
            prefix: '/auth'
        });
        this.authService = authService;
        this.mailingService = mailingService;
        this.validationMiddleware = validationMiddleware;

        this.authController = authController;
        this.authSchema = authSchema;
    }

    buildRoutes() {
        this.router.post(
            '/login',
            this.validationMiddleware.validate(this.authSchema.schemas.login),
            async (context, next) => {
                await this.authController.login(context, next);
            }
        );

        this.router.post(
            '/recover',
            this.validationMiddleware.validate(this.authSchema.schemas.verify),
            async (context, next) => {
                await this.authController.recover(context, next);
            }
        );

        this.router.patch(
            '/change/password',
            this.authService.authenticate(),
            this.validationMiddleware.validate(this.authSchema.schemas.changePassword),
            async (context, next) => {
                await this.authController.changePassword(context, next);
            }
        );

        this.router.post(
            '/register',
            this.validationMiddleware.validate(this.authSchema.schemas.register),
            async (context, next) => {
                await this.authController.register(context, next);
            }
        );

        this.router.get(
            '/confirm',
            this.validationMiddleware.validate(this.authSchema.schemas.confirm),
            async (context, next) => {
                await this.authController.confirm(context, next);
            }
        );
    }
}

module.exports = UserApi;