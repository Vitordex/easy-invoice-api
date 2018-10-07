/* eslint-disable no-unused-vars */
const CustomerService = require('./customer.service');
const UserService = require('../user/user.service');
/* eslint-enable no-unused-vars */

const JwtToken = require('../user/jwt.model.js');

const { AUTH, API: { STATUS } } = require('../enums');

class CustomerController {
    /**
     * 
     * @param {Object} params 
     * @param {UserService} params.userService
     * @param {String} params.authHash
     * @param {Object} params.authConfigs
     * @param {CustomerService} params.customerService
     */
    constructor({
        userService,
        authHash,
        authConfigs,
        customerService
    }) {
        this.userService = userService;

        this.hash = authHash;
        this.tokenExpiration = authConfigs.token.expiration;
        this.tokenOptions = authConfigs.optionals;
        this.customerService = customerService;
    }

    async getCustomer(context, next) {
        const token = context.request.headers[AUTH.TOKEN_HEADER];
        const emailToken = new JwtToken({}, this.hash, this.tokenOptions);

        try {
            await emailToken.verify(token);
        } catch (error) {
            context.throw(STATUS.UNAUTHORIZED, 'Invalid token');
            return next();
        }

        const { customerId } = context.params;

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

        context.body = { customer: customer.toJSON() };
        context.type = 'json';
        return next();
    }

    async postCustomer(context, next) {
        const token = context.request.headers[AUTH.TOKEN_HEADER];
        const emailToken = new JwtToken({}, this.hash, this.tokenOptions);

        let payload;

        try {
            payload = await emailToken.verify(token);
        } catch (error) {
            context.throw(STATUS.UNAUTHORIZED, 'Invalid token');
            return next();
        }

        const { body } = context.request;

        const found = await this.customerService.findCustomer({ name: body.name });
        if (found) {
            context.throw(STATUS.BAD_REQUEST, 'Customer already exists');
            return next();
        }

        const customer = await this.customerService.create(body);

        let user;

        try {
            user = await this.userService.findUser({ _id: payload.id });
        } catch (error) {
            context.throw(STATUS.UNAUTHORIZED, 'Invalid user');
            return next();
        }

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
        const token = context.request.headers[AUTH.TOKEN_HEADER];
        const emailToken = new JwtToken({}, this.hash, this.tokenOptions);

        let payload;

        try {
            payload = await emailToken.verify(token);
        } catch (error) {
            context.throw(STATUS.UNAUTHORIZED, 'Invalid token');
            return next();
        }

        let user;

        try {
            user = await this.userService.findUser({ _id: payload.id });
        } catch (error) {
            context.throw(STATUS.UNAUTHORIZED, 'Invalid user');
            return next();
        }

        const { params } = context;
        const { body } = context.request;

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