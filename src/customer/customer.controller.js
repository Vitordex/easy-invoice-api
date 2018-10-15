/* eslint-disable no-unused-vars */
const CustomerService = require('./customer.service');
const UserService = require('../user/user.service');
/* eslint-enable no-unused-vars */

const { API: { STATUS } } = require('../enums');

class CustomerController {
    /**
     * @param {UserService} params.userService
     * @param {CustomerService} params.customerService
     */
    constructor({
        userService,
        customerService
    }) {
        this.userService = userService;
        this.customerService = customerService;
    }

    async getCustomer(context, next) {
        const { customerId } = context.input.params;

        let customer;

        try {
            customer = await this.customerService.findCustomer({ _id: customerId });
        } catch (error) {
            context.throw(STATUS.NOT_FOUND, 'Invalid customer id');
            return next();
        }

        if (!customer) {
            context.throw(STATUS.NOT_FOUND, 'Invalid customer id');
            return next();
        }

        context.body = customer.toJSON();
        context.type = 'json';
        return next();
    }

    async postCustomer(context, next) {
        const { body } = context.input;

        const found = await this.customerService.findCustomer({ name: body.name });
        if (found) {
            context.throw(STATUS.BAD_REQUEST, 'Customer already exists');
            return next();
        }

        const customer = await this.customerService.create(body);

        const { user } = context.state;

        user.customers.push(customer._id);

        try {
            await Promise.all([
                user.save(),
                customer.save()
            ]);
        } catch (error) {
            context.throw(STATUS.INTERNAL_ERROR, 'Error saving the customer');
            return next();
        }

        context.status = STATUS.OK;
        context.body = { customerId: customer._id };
        return next();
    }

    async putCustomer(context, next) {
        const { 
            params, 
            body 
        } = context.input;

        const { user } = context.state;
        if (!user.customers.find((id) => id.toString() === params.customerId)) {
            context.throw(STATUS.FORBIDDEN, 'User does not have rights');
            return next();
        }

        let customer;

        try {
            customer = await this.customerService.findCustomer({ _id: params.customerId });
        } catch (error) {
            context.throw(STATUS.NOT_FOUND, 'Invalid customer id');
            return next();
        }

        if (!customer) {
            context.throw(STATUS.NOT_FOUND, 'Invalid customer id');
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
            context.throw(STATUS.INTERNAL_ERROR, 'Error saving the customer');
            return next();
        }

        context.status = STATUS.OK;
        return next();
    }
}

module.exports = CustomerController;