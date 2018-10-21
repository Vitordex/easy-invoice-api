const Router = require('koa-router');

/* eslint-disable no-unused-vars */
const AuthService = require('../auth/auth.service');
const InvoiceController = require('./invoice.controller');
const InvoiceSchema = require('./invoice.schema');
const ValidationMiddleware = require('../middleware/validation.middleware');
/* eslint-enable no-unused-vars */

class InvoiceApi {
    /**
     * @param {Object} params
     * @param {AuthService} params.authService The authentication service for the protexted routes
     * @param {InvoiceController} params.invoiceController The controller with all the methods for user routes
     * @param {InvoiceSchema} params.invoiceSchema The input validation for user routes
     * @param {ValidationMiddleware} params.validationMiddleware The middleware for validating route input
     */
    constructor({
        authService,
        invoiceController,
        invoiceSchema,
        validationMiddleware
    }) {
        this.router = new Router({
            prefix: '/invoices'
        });
        this.authService = authService;
        this.validationMiddleware = validationMiddleware;

        this.invoiceController = invoiceController;
        this.invoiceSchema = invoiceSchema;
    }

    buildRoutes() {
        this.router.get(
            '/:invoiceId',
            this.validationMiddleware.validate(this.invoiceSchema.schemas.getInvoice),
            this.authService.authenticate(),
            async (context, next) => {
                await this.invoiceController.getInvoice(context, next);
            }
        );

        this.router.post(
            '/',
            this.validationMiddleware.validate(this.invoiceSchema.schemas.postInvoice),
            this.authService.authenticate(),
            async (context, next) => {
                await this.invoiceController.postInvoice(context, next);
            }
        );

        this.router.patch(
            '/:invoiceId',
            this.validationMiddleware.validate(this.invoiceSchema.schemas.patchInvoice),
            this.authService.authenticate(),
            async (context, next) => {
                await this.invoiceController.patchInvoice(context, next);
            }
        );

        this.router.delete(
            '/:invoiceId',
            this.validationMiddleware.validate(this.invoiceSchema.schemas.deleteInvoice),
            this.authService.authenticate(),
            async (context, next) => {
                await this.invoiceController.deleteInvoice(context, next);
            }
        );

        this.router.get(
            '/',
            this.validationMiddleware.validate(this.invoiceSchema.schemas.listInvoices),
            this.authService.authenticate(),
            async (context, next) => {
                await this.invoiceController.listInvoices(context, next);
            }
        );

        this.router.get(
            '/generate/pdf',
            this.validationMiddleware.validate(this.invoiceSchema.schemas.postGeneratePdf),
            this.authService.authenticate(),
            async (context, next) => {
                await this.invoiceController.postGeneratePdf(context, next);
            }
        );
    }
}

module.exports = InvoiceApi;