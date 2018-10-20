/* eslint-disable no-unused-vars */
const CustomerService = require('./customer.service');
const UserService = require('../user/user.service');
const ControllerError = require('../log/controller.error.model');
/* eslint-enable no-unused-vars */

const controllerName = 'customer';
const timeService = require('../services/time.service');

const { API: { STATUS } } = require('../enums');

class CustomerController {
    /**
     * @param {UserService} params.userService
     * @param {CustomerService} params.customerService
     * @param {ControllerError} params.apiErrorModel
     */
    constructor({
        userService,
        customerService,
        apiErrorModel
    }) {
        this.userService = userService;
        this.customerService = customerService;

        this.ControllerError = apiErrorModel;
    }

    async getCustomer(context, next) {
        const functionName = 'getCustomer';
        const { customerId } = context.input.params;

        let customer;

        try {
            customer = await this.customerService.findCustomer({ _id: customerId });
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid customer id',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.NOT_FOUND, controllerError);

            return next();
        }

        if (!customer) {
            const controllerError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid customer id',
                controllerName,
                functionName,
                context.input,
                'Customer not found'
            );
            context.throw(STATUS.NOT_FOUND, controllerError);

            return next();
        }

        context.body = customer.toJSON();
        context.type = 'json';
        return next();
    }

    async postCustomer(context, next) {
        const functionName = 'postCustomer';
        const { body } = context.input;
        body.userId = context.state.user._id;
        
        const customer = await this.customerService.create(body);

        const { user } = context.state;

        user.customers.push(customer._id);

        try {
            await Promise.all([
                user.save(),
                customer.save()
            ]);
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Error saving the customer',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR, controllerError);

            return next();
        }

        context.status = STATUS.OK;
        context.body = { customerId: customer._id };
        return next();
    }

    async putCustomer(context, next) {
        const functionName = 'putCustomer';
        const { 
            params, 
            body 
        } = context.input;

        const { user } = context.state;
        if (!user.customers.find((id) => id.toString() === params.customerId)) {
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

        let customer;

        try {
            customer = await this.customerService.findCustomer({ _id: params.customerId });
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid customer id',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.NOT_FOUND, controllerError);

            return next();
        }

        if (!customer) {
            const controllerError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid customer id',
                controllerName,
                functionName,
                context.input,
                'Customer not found'
            );
            context.throw(STATUS.NOT_FOUND, controllerError);

            return next();
        }

        const updateLocal = new Date(body.updated_local);

        if (!updateLocal) {
            customer.address = body.address;
            customer.document = body.document;
            customer.name = body.name;
        }

        try {
            if (updateLocal)
                await customer.updateWithDates(body);
            else
                await customer.save();
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Error saving the customer',
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

    async deleteCustomer(context, next) {
        const functionName = 'deleteCustomer';
        const {
            input: {
                params
            }
        } = context;

        const { user } = context.state;

        if (!user.customers.find((id) => id.toString() === params.customerId)) {
            const error = new this.ControllerError(
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

        let customer;

        try {
            customer = await this.customerService.findCustomer({ _id: params.customerId });
        } catch (error) {
            const findError = new this.ControllerError(
                STATUS.NOT_FOUND,
                'Invalid customer id',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.NOT_FOUND, findError);

            return next();
        }

        if (!customer) {
            const error = new this.ControllerError(
                STATUS.NOT_FOUND,
                'Invalid customer id',
                controllerName,
                functionName,
                context.input,
                'Invalid customer id'
            );
            context.throw(STATUS.NOT_FOUND, error);

            return next();
        }

        customer.deletedAt = timeService().toISOString();
        user.customers = user.customers.reduce((customers, item) => {
            if (item.toString() === customer.id.toString()) return customers;

            return customers.concat([item]);
        }, []);

        try {
            await Promise.all([
                user.save(),
                customer.save()
            ]);
        } catch (error) {
            const saveError = new this.ControllerError(
                STATUS.INTERNAL_ERROR,
                'Error saving the customer',
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

    async listCustomers(context, next) {
        const functionName = 'listCustomers';

        const { user } = context.state;
        let customers = user.customers;

        try {
            if (customers.length > 0) {
                const query = {
                    '_id': {
                        $in: user.customers
                    }
                };
                customers = await this.customerService.findCustomers(query);
            }
        } catch (error) {
            const findError = new this.ControllerError(
                STATUS.INTERNAL_ERROR,
                'Invalid user',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR, findError);

            return next();
        }

        context.body = customers.map((customer) => customer.toJSON());
        context.status = 200;

        return next();
    }
}

module.exports = CustomerController;