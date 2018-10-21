/* eslint-disable no-unused-vars */
const {
    Instances: {
        Invoice
    }, Model
} = require('../database/common.types');
const HashService = require('../services/hashing.service');
/* eslint-enable no-unused-vars */

const timeService = require('../services/time.service');
const ObjectId = require('../database/object.id');

class InvoiceService {
    /**
     * @param {Model} invoiceModel 
     */
    constructor(invoiceModel) {
        this.Invoice = invoiceModel;
    }

    /**
     * Find an invoice
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
     * Function to create a single invoice
     * @param {Object} body The invoice document body
     * 
     * @returns {Invoice}
     */
    async create(body) {
        const newId = new ObjectId().toHex();
        body._id = body._id || newId;

        return new this.Invoice(body);
    }

    /**
     * Find a set of invoices
     * @param {Object} query 
     * 
     * @returns {[Invoice]}
     */
    findInvoices(query) {
        return this.Invoice.find({
            ...query,
            deletedAt: {
                $exists: false
            }
        });
    }

    /**
     * Update a set of invoices
     * @param {Object} query 
     * @param {Object} newValues
     * @param {Number} dateLocal
     * 
     * @returns {[Invoice]}
     */
    updateInvoices(query, newValues, dateLocal) {
        const softQuery = {
            ...query,
            deletedAt: {
                $exists: false
            }
        };
        return this.Invoice.updateManyWithDates(softQuery, newValues, dateLocal);
    }

    /**
     * Delete a invoice
     * @param {Invoice} invoice Invoice to delete
     */
    deleteInvoice(invoice){
        invoice.deletedAt = timeService().toISOString();

        return invoice.save();
    }

    /**
     * Delete a set of invoices
     * @param {Object} query 
     * @param {Object} newValues
     * @param {Number} dateLocal
     * 
     * @returns {[Invoice]}
     */
    deleteInvoices(query, dateLocal) {
        const softQuery = {
            ...query,
            deletedAt: {
                $exists: false
            }
        };
        const updatedValues = {
            deletedAt: timeService().toISOString()
        };
        return this.Invoice.updateManyWithDates(softQuery, updatedValues, dateLocal);
    }
}

module.exports = InvoiceService;