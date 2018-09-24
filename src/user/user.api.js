const Router = require('koa-router');

class UserApi {
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
            '/verify',
            this.validationMiddleware.validate(this.userSchema.schemas.verify),
            async (context, next) => {
                await this.userController.verify(context, next);
            }
        );

        this.router.patch(
            '/reset/password',
            this.validationMiddleware.validate(this.userSchema.schemas.resetPassword),
            async (context, next) => {
                await this.userController.resetPassword(context, next);
            }
        );
    }
}

module.exports = UserApi;