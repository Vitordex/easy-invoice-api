/* eslint-disable no-unused-vars */
const InvoiceService = require('./invoice.service');
const UserService = require('../user/user.service');
const ControllerError = require('../log/controller.error.model');
/* eslint-enable no-unused-vars */

const controllerName = 'invoice';

const JwtToken = require('../user/jwt.model.js');

const {
    AUTH,
    API: {
        STATUS
    },
    DB: {
        PROPS: {
            DATE_HEADER
        }
    }
} = require('../enums');

class InvoiceController {
    /**
     * 
     * @param {Object} params 
     * @param {UserService} params.userService
     * @param {String} params.authHash
     * @param {Object} params.authConfigs
     * @param {InvoiceService} params.invoiceService
     * @param {ControllerError} params.apiErrorModel
     */
    constructor({
        userService,
        authHash,
        authConfigs,
        invoiceService,
        apiErrorModel
    }) {
        this.userService = userService;
        this.invoiceService = invoiceService;

        this.hash = authHash;
        this.tokenExpiration = authConfigs.token.expiration;
        this.tokenOptions = authConfigs.optionals;

        this.ControllerError = apiErrorModel;
    }

    async getInvoice(context, next) {
        const functionName = 'getInvoice';
        const token = context.request.headers[AUTH.TOKEN_HEADER];
        const tokenValidator = new JwtToken({}, this.hash, this.tokenOptions);

        try {
            await tokenValidator.verify(token);
        } catch (error) {
            const jwtError = new ControllerError(
                STATUS.UNAUTHORIZED,
                'Invalid token',
                controllerName,
                functionName,
                context.input,
                'User not found'
            );
            context.throw(STATUS.UNAUTHORIZED, jwtError);

            return next();
        }

        const { invoiceId } = context.params;

        let invoice;

        try {
            invoice = await this.invoiceService.findInvoice({ _id: invoiceId });
        } catch (error) {
            const findError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid invoice id',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.NOT_FOUND, findError);

            return next();
        }

        if (!invoice) {
            const error = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid invoice id',
                controllerName,
                functionName,
                context.input,
                'Invalid invoice id'
            );
            context.throw(STATUS.NOT_FOUND, error);

            return next();
        }

        context.body = invoice.toJSON();
        context.type = 'json';
        return next();
    }

    async postInvoice(context, next) {
        const functionName = 'postInvoice';
        const token = context.request.headers[AUTH.TOKEN_HEADER];
        const tokenValidator = new JwtToken({}, this.hash, this.tokenOptions);

        let payload;

        try {
            payload = await tokenValidator.verify(token);
        } catch (error) {
            const jwtError = new ControllerError(
                STATUS.UNAUTHORIZED,
                'Invalid token',
                controllerName,
                functionName,
                context.input,
                'Invalid token'
            );
            context.throw(STATUS.UNAUTHORIZED, jwtError);

            return next();
        }

        const { body } = context.request;

        const invoice = await this.invoiceService.create(body);

        let user;

        try {
            user = await this.userService.findUser({ _id: payload.id });
        } catch (error) {
            const findError = new ControllerError(
                STATUS.UNAUTHORIZED,
                'Invalid user',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.UNAUTHORIZED, findError);

            return next();
        }

        user.invoices.push(invoice._id);

        try {
            await Promise.all([
                user.save(),
                invoice.save()
            ]);
        } catch (error) {
            const saveError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Error saving the invoice',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR, saveError);

            return next();
        }

        context.status = STATUS.OK;
        context.body = { invoiceId: invoice._id };
        return next();
    }

    async patchInvoice(context, next) {
        const functionName = 'patchInvoice';
        const {
            input: {
                body,
                headers,
                params
            }
        } = context;

        const token = headers[AUTH.TOKEN_HEADER];
        const emailToken = new JwtToken({}, this.hash, this.tokenOptions);

        let payload;

        try {
            payload = await emailToken.verify(token);
        } catch (error) {
            const jwtError = new ControllerError(
                STATUS.UNAUTHORIZED,
                'Invalid token',
                controllerName,
                functionName,
                context.input,
                'Invalid token'
            );
            context.throw(STATUS.UNAUTHORIZED, jwtError);

            return next();
        }

        let user;

        try {
            user = await this.userService.findUser({ _id: payload.id });
        } catch (error) {
            const findError = new ControllerError(
                STATUS.UNAUTHORIZED,
                'Invalid user',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.UNAUTHORIZED, findError);

            return next();
        }

        if (!user.invoices.find((id) => id.toString() === params.invoiceId)) {
            const error = new ControllerError(
                STATUS.FORBIDDEN,
                'User does not have rights',
                controllerName,
                functionName,
                context.input,
                'User does not have rights'
            );
            context.throw(STATUS.FORBIDDEN, error);

            return next();
        }

        let invoice;

        try {
            invoice = await this.invoiceService.findInvoice({ _id: params.invoiceId });
        } catch (error) {
            const findError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid invoice id',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.NOT_FOUND, findError);

            return next();
        }

        if (!invoice) {
            const error = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid invoice id',
                controllerName,
                functionName,
                context.input,
                'Invalid invoice id'
            );
            context.throw(STATUS.NOT_FOUND, error);

            return next();
        }

        const updateLocal = headers[DATE_HEADER];

        try {
            await invoice.updateWithDates(body, updateLocal);
        } catch (error) {
            const saveError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Error saving the invoice',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR, saveError);

            return next();
        }

        context.status = STATUS.OK;
        return next();
    }

    async deleteInvoice(context, next) {

    }
}

module.exports = InvoiceController;