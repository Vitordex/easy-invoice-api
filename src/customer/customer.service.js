/* eslint-disable no-unused-vars */
const CommonTypes = require('../database/common.types');
const { Customer } = CommonTypes.Instances;
const { Model } = CommonTypes;
const LogService = require('../log/log.service');
/* eslint-enable no-unused-vars */

const ServiceLog = require('../log/service.log.model');

const timeService = require('../services/time.service');
const ObjectId = require('../database/object.id');

class CustomerService {
    /**
     * @param {Model} customerModel 
     * @param {LogService} logger
     */
    constructor(customerModel, logger) {
        this.Customer = customerModel;

        this.logger = logger.child({ service: 'customer.service' });
    }

    /**
     * Find a set of customers
     * @param {Object} query 
     * 
     * @returns {Customer}
     */
    findCustomer(query) {
        const functionName = 'findCustomer';
        const params = { query };

        return this.Customer.findOne({
            ...query,
            deletedAt: {
                $exists: false
            }
        }).then((result) => {
            const log = new ServiceLog(functionName, params, result).toObject();
            this.logger.info(log);

            return result;
        }).catch((err) => {
            const log = new ServiceLog(functionName, params, err).toObject();
            this.logger.error(log);

            return Promise.reject(err);
        });
    }

    /**
     * Function to create a single customer
     * @param {Object} body The customer document body
     * 
     * @returns {Customer}
     */
    async create(body) {
        const newId = new ObjectId().toHex();
        body._id = body._id || newId;

        return new this.Customer(body);
    }

    /**
     * Find a set of invoices
     * @param {Object} query 
     * 
     * @returns {[Customer]}
     */
    findCustomers(query) {
        const functionName = 'findCustomers';
        const params = { query };

        return this.Customer.find({
            ...query,
            deletedAt: {
                $exists: false
            }
        }).then((result) => {
            const log = new ServiceLog(functionName, params, result).toObject();
            this.logger.info(log);

            return result;
        }).catch((err) => {
            const log = new ServiceLog(functionName, params, err).toObject();
            this.logger.error(log);

            return Promise.reject(err);
        });
    }

    /**
     * Delete a customer
     * @param {Customer} customer Customer to delete
     */
    deleteCustomer(customer) {
        const functionName = 'deleteCustomer';
        const params = { customer };

        customer.deletedAt = timeService().toISOString();

        return customer.save()
            .then((result) => {
                const log = new ServiceLog(functionName, params, result).toObject();
                this.logger.info(log);

                return result;
            }).catch((err) => {
                const log = new ServiceLog(functionName, params, err).toObject();
                this.logger.error(log);

                return Promise.reject(err);
            });
    }

    /**
     * Delete a set of customers
     * @param {Object} query 
     * @param {Object} newValues
     * @param {Number} dateLocal
     * 
     * @returns {[Customer]}
     */
    deleteCustomers(query) {
        const functionName = 'deleteCustomers';
        const params = { query };

        const softQuery = {
            ...query,
            deletedAt: {
                $exists: false
            }
        };
        const updatedValues = {
            deletedAt: timeService().toISOString()
        };
        return this.Customer.updateMany(softQuery, updatedValues)
            .then((result) => {
                const log = new ServiceLog(functionName, params, result).toObject();
                this.logger.info(log);

                return result;
            }).catch((err) => {
                const log = new ServiceLog(functionName, params, err).toObject();
                this.logger.error(log);

                return Promise.reject(err);
            });
    }
}

module.exports = CustomerService;