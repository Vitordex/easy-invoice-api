/* eslint-disable no-unused-vars */
const UserService = require('./user.service');
const InvoiceService = require('../invoice/invoice.service');
const CustomerService = require('../customer/customer.service');
const ControllerError = require('../log/controller.error.model');
/* eslint-enable no-unused-vars */

const {
    DB: {
        PROPS: {
            DATE_HEADER
        }
    },
    API: {
        STATUS
    }
} = require('../enums');

const controllerName = 'user';

class UserController {
    /**
     * @param {Object} params 
     * @param {UserService} params.userService
     * @param {InvoiceService} params.invoiceService
     * @param {CustomerService} params.customerService
     * @param {ControllerError} params.apiErrorModel
     */
    constructor({
        userService,
        invoiceService,
        customerService,
        apiErrorModel
    }) {
        this.userService = userService;
        this.invoiceService = invoiceService;
        this.customerService = customerService;

        this.ControllerError = apiErrorModel;
    }

    async patchUser(context, next) {
        const functionName = 'patchUser';
        const { body } = context.input;
        const { headers } = context.input;
        const { password } = body;

        if (password)
            body.password = await this.userService.hashPassword(password);

        const { user } = context.state;
        try {
            await user.updateWithDates(body, headers[DATE_HEADER]); // eslint-disable-line
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Error saving the user',
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

    async deleteUser(context, next) {
        const functionName = 'deleteUser';
        const { headers } = context.input;
        const { user } = context.state;

        try {
            const deleteInvoicesQuery = {
                '_id': {
                    $in: user.invoices
                }
            };
            const deleteCustomersQuery = {
                '_id': {
                    $in: user.customers
                }
            };
            const dateLocal = headers[DATE_HEADER];// eslint-disable-line
            await Promise.all([
                this.userService.deleteUser(user),
                this.invoiceService.deleteInvoices(
                    deleteInvoicesQuery,
                    dateLocal
                ),
                this.customerService.deleteCustomers(
                    deleteCustomersQuery,
                    dateLocal
                )
            ]);
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Error deleting the user',
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
}

module.exports = UserController;