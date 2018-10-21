/* eslint-disable no-unused-vars */
const CommonTypes = require('../database/common.types');
const { Customer } = CommonTypes.Instances;
const { Model } = CommonTypes;
/* eslint-enable no-unused-vars */

const timeService = require('../services/time.service');
const ObjectId = require('../database/object.id');

class CustomerService {
    /**
     * @param {Model} customerModel 
     */
    constructor(customerModel) {
        this.Customer = customerModel;
    }

    /**
     * Find a set of customers
     * @param {Object} query 
     * 
     * @returns {Customer}
     */
    findCustomer(query) {
        return this.Customer.findOne({
            ...query,
            deletedAt: {
                $exists: false
            }
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
        return this.Customer.find({
            ...query,
            deletedAt: {
                $exists: false
            }
        });
    }

    /**
     * Delete a customer
     * @param {Customer} customer Customer to delete
     */
    deleteCustomer(customer){
        customer.deletedAt = timeService().toISOString();

        return customer.save();
    }

    /**
     * Delete a set of customers
     * @param {Object} query 
     * @param {Object} newValues
     * @param {Number} dateLocal
     * 
     * @returns {[Customer]}
     */
    deleteCustomers(query, dateLocal) {
        const softQuery = {
            ...query,
            deletedAt: {
                $exists: false
            }
        };
        const updatedValues = {
            deletedAt: timeService().toISOString()
        };
        return this.Customer.updateManyWithDates(softQuery, updatedValues, dateLocal);
    }
}

module.exports = CustomerService;