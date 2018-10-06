const Router = require('koa-router');

/* eslint-disable no-unused-vars */
const AuthService = require('../user/auth.service');
const CustomerController = require('./customer.controller');
const CustomerSchema = require('./customer.schema');
const ValidationMiddleware = require('../middleware/validation.middleware');
/* eslint-enable no-unused-vars */

class CustomerApi {
    /**
     * @param {Object} params
     * @param {AuthService} params.authService The authentication service for the protexted routes
     * @param {CustomerController} params.customerController The controller with all the methods for user routes
     * @param {CustomerSchema} params.customerSchema The input validation for user routes
     * @param {ValidationMiddleware} params.validationMiddleware The middleware for validating route input
     */
    constructor({
        authService,
        customerController,
        customerSchema,
        validationMiddleware
    }) {
        this.router = new Router({
            prefix: '/customers'
        });
        this.authService = authService;
        this.validationMiddleware = validationMiddleware;

        this.customerController = customerController;
        this.customerSchema = customerSchema;
    }

    buildRoutes() {
        this.router.get(
            '/:customerId',
            this.authService.authenticate(),
            this.validationMiddleware.validate(this.customerSchema.schemas.getCustomer),
            async (context, next) => {
                await this.customerController.getCustomer(context, next);
            }
        );

        this.router.post(
            '/',
            this.authService.authenticate(),
            this.validationMiddleware.validate(this.customerSchema.schemas.postCustomer),
            async (context, next) => {
                await this.customerController.postCustomer(context, next);
            }
        );

        this.router.put(
            '/:customerId',
            this.authService.authenticate(),
            this.validationMiddleware.validate(this.customerSchema.schemas.putCustomer),
            async (context, next) => {
                await this.customerController.putCustomer(context, next);
            }
        );
    }
}

module.exports = CustomerApi;