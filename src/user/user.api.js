const Router = require('koa-router');

/* eslint-disable no-unused-vars */
const UserController = require('./user.controller'); 
const AuthService = require('../auth/auth.service');
const UserSchema = require('./user.schema');
const ValidationMiddleware = require('../middleware/validation.middleware');
/* eslint-enable no-unused-vars */

class UserApi {
    /**
     * @param {Object} params
     * @param {AuthService} params.authService The authentication service for the protexted routes
     * @param {UserController} params.userController The controller with all the methods for user routes
     * @param {UserSchema} params.userSchema The input validation for user routes
     * @param {ValidationMiddleware} params.validationMiddleware The middleware for validating route input
     */
    constructor({
        authService,
        userController,
        userSchema,
        validationMiddleware
    }) {
        this.router = new Router({
            prefix: '/users'
        });
        this.authService = authService;
        this.validationMiddleware = validationMiddleware;

        this.userController = userController;
        this.userSchema = userSchema;
    }

    buildRoutes() {
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