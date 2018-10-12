/* eslint-disable no-unused-vars */
const CommonTypes = require('../database/common.types');
const { Customer } = CommonTypes.Instances;
const { Model } = CommonTypes;
const HashService = require('../services/hashing.service');
/* eslint-enable no-unused-vars */

const ObjectId = require('../database/object.id');

class CustomerService {
    /**
     * @param {Model} customerModel 
     */
    constructor(customerModel) {
        this.Customer = customerModel;
    }

    /**
     * Find a set of users
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
     * Function to create a single user
     * @param {Object} body The user document body
     * 
     * @returns {User}
     */
    async create(body) {
        const newId = new ObjectId().toHex();
        body._id = body._id || newId;

        return new this.Customer(body);
    }
}

module.exports = CustomerService;