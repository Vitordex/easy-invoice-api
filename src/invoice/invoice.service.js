/* eslint-disable no-unused-vars */
const {
    Instances: {
        Invoice 
    }, Model 
} = require('../database/common.types');
const HashService = require('../services/hashing.service');
/* eslint-enable no-unused-vars */

const ObjectId = require('../database/object.id');

class InvoiceService {
    /**
     * @param {Model} invoiceModel 
     */
    constructor(invoiceModel) {
        this.Invoice = invoiceModel;
    }

    /**
     * Find a set of users
     * @param {Object} query 
     * 
     * @returns {Invoice}
     */
    findInvoice(query) {
        return this.Invoice.findOne({
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
     * @returns {Invoice}
     */
    async create(body) {
        const newId = new ObjectId().toHex();
        body._id = body._id || newId;
        
        return new this.Invoice(body);
    }
}

module.exports = InvoiceService;