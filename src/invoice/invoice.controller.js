/* eslint-disable no-unused-vars */
const InvoiceService = require('./invoice.service');
const ControllerError = require('../log/controller.error.model');
const PdfService = require('../pdf/pdf.service');
/* eslint-enable no-unused-vars */

const format = require('string-template');

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

const controllerName = 'invoice';

class InvoiceController {
    /**
     * @param {InvoiceService} params.invoiceService
     * @param {ControllerError} params.apiErrorModel
     * @param {PdfService} params.pdfService
     * @param {String} params.pdfTemplate
     */
    constructor({
        invoiceService,
        apiErrorModel,
        pdfService,
        pdfTemplate
    }) {
        this.invoiceService = invoiceService;
        this.pdfService = pdfService;

        this.ControllerError = apiErrorModel;
        this.pdfTemplate = pdfTemplate;
    }

    async getInvoice(context, next) {
        const functionName = 'getInvoice';

        const { invoiceId } = context.input.params;

        let invoice;

        try {
            invoice = await this.invoiceService.findInvoice({ _id: invoiceId });
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Invalid invoice id',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR, controllerError);

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
            context.throw(STATUS.INTERNAL_ERROR, controllerError);

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
                STATUS.INTERNAL_ERROR,
                'Invalid invoice id',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR, controllerError);

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

        const updateLocal = headers[DATE_HEADER]; // eslint-disable-line

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
            context.throw(STATUS.INTERNAL_ERROR, controllerError);

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
                STATUS.INTERNAL_ERROR,
                'Invalid invoice id',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR, controllerError);

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

        user.invoices = user.invoices.reduce((invoices, item) => {
            if (item.toString() === invoice.id.toString()) return invoices;

            return invoices.concat([item]);
        }, []);

        try {
            await Promise.all([
                user.save(),
                this.invoiceService.deleteInvoice(invoice)
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
            context.throw(STATUS.INTERNAL_ERROR, controllerError);

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
            context.throw(STATUS.INTERNAL_ERROR, controllerError);

            return next();
        }

        context.body = invoices.map((invoice) => invoice.toJSON());
        context.status = 200;

        return next();
    }

    async postGeneratePdf(context, next) {
        const functionName = 'postGeneratePdf';

        const { invoiceId } = context.input.body;
        const { user } = context.state;

        if (!user.invoices.find((id) => id.toString() === invoiceId)) {
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
            const query = {
                '_id': invoiceId
            };
            invoice = await this.invoiceService.findInvoice(query);
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Invalid invoice id',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR, controllerError);

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

        const pdfBasePath = `pdfs/${user._id}/${invoice._id}.pdf`;
        try {
            const input = format(this.pdfTemplate, invoice.toJSON());

            await this.pdfService.generateFile(
                input, 
                `./public/${pdfBasePath}`
            );
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Error generating pdf',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR, controllerError);

            return next();
        }

        context.body = {url: `${context.request.origin}/${pdfBasePath}`};
        context.status = STATUS.OK;

        return next();
    }
}

module.exports = InvoiceController;