/* eslint-disable no-unused-vars */
const InvoiceService = require('./invoice.service');
const UserService = require('../user/user.service');
const ControllerError = require('../log/controller.error.model');
/* eslint-enable no-unused-vars */

const controllerName = 'invoice';
const timeService = require('../services/time.service');

const {
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
     * @param {UserService} params.userService
     * @param {InvoiceService} params.invoiceService
     * @param {ControllerError} params.apiErrorModel
     */
    constructor({
        userService,
        invoiceService,
        apiErrorModel
    }) {
        this.userService = userService;
        this.invoiceService = invoiceService;

        this.ControllerError = apiErrorModel;
    }

    async getInvoice(context, next) {
        const functionName = 'getInvoice';

        const { invoiceId } = context.input.params;

        let invoice;

        try {
            invoice = await this.invoiceService.findInvoice({ _id: invoiceId });
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid invoice id',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.NOT_FOUND,  controllerError);

            return next();
        }

        if (!invoice) {
            const controllerError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid invoice id',
                controllerName,
                functionName,
                context.input,
                'Invalid invoice id'
            );
            context.throw(STATUS.NOT_FOUND,  controllerError);

            return next();
        }

        context.body = invoice.toJSON();
        context.type = 'json';
        return next();
    }

    async postInvoice(context, next) {
        const functionName = 'postInvoice';
        const { body } = context.input;
        body.userId = context.state.user._id;

        const invoice = await this.invoiceService.create(body);

        const { user } = context.state;

        user.invoices.push(invoice._id);

        try {
            await Promise.all([
                user.save(),
                invoice.save()
            ]);
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Error saving the invoice',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR,  controllerError);

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

        const { user } = context.state;

        if (!user.invoices.find((id) => id.toString() === params.invoiceId)) {
            const controllerError = new ControllerError(
                STATUS.FORBIDDEN,
                'User does not have rights',
                controllerName,
                functionName,
                context.input,
                'User does not have rights'
            );
            context.throw(STATUS.FORBIDDEN, controllerError);

            return next();
        }

        let invoice;

        try {
            invoice = await this.invoiceService.findInvoice({ _id: params.invoiceId });
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid invoice id',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.NOT_FOUND,  controllerError);

            return next();
        }

        if (!invoice) {
            const controllerError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid invoice id',
                controllerName,
                functionName,
                context.input,
                'Invalid invoice id'
            );
            context.throw(STATUS.NOT_FOUND, controllerError);

            return next();
        }

        const updateLocal = headers[DATE_HEADER];

        try {
            await invoice.updateWithDates(body, updateLocal);
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Error saving the invoice',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR,  controllerError);

            return next();
        }

        context.status = STATUS.OK;
        return next();
    }

    async deleteInvoice(context, next) {
        const functionName = 'deleteInvoice';
        const {
            input: {
                params
            }
        } = context;

        const { user } = context.state;

        if (!user.invoices.find((id) => id.toString() === params.invoiceId)) {
            const controllerError = new ControllerError(
                STATUS.FORBIDDEN,
                'User does not have rights',
                controllerName,
                functionName,
                context.input,
                'User does not have rights'
            );
            context.throw(STATUS.FORBIDDEN, controllerError);

            return next();
        }

        let invoice;

        try {
            invoice = await this.invoiceService.findInvoice({ _id: params.invoiceId });
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid invoice id',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.NOT_FOUND,  controllerError);

            return next();
        }

        if (!invoice) {
            const controllerError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid invoice id',
                controllerName,
                functionName,
                context.input,
                'Invalid invoice id'
            );
            context.throw(STATUS.NOT_FOUND, controllerError);

            return next();
        }

        invoice.deletedAt = timeService().toISOString();
        user.invoices = user.invoices.reduce((invoices, item) => {
            if (item.toString() === invoice.id.toString()) return invoices;

            return invoices.concat([item]);
        }, []);

        try {
            await Promise.all([
                user.save(),
                invoice.save()
            ]);
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Error saving the invoice',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR,  controllerError);

            return next();
        }

        context.status = STATUS.OK;
        return next();
    }

    async listInvoices(context, next) {
        const functionName = 'listInvoices';

        const { user } = context.state;
        let invoices = user.invoices;

        try {
            if (invoices.length > 0) {
                const query = {
                    '_id': {
                        $in: user.invoices
                    }
                };
                invoices = await this.invoiceService.findInvoices(query);
            }
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Invalid user',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR,  controllerError);

            return next();
        }

        context.body = invoices.map((invoice) => invoice.toJSON());
        context.status = 200;

        return next();
    }
}

module.exports = InvoiceController;