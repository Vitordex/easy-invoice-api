/* eslint-disable no-unused-vars */
const {
    Instances: {
        Invoice
    }, Model
} = require('../database/common.types');
const HashService = require('../services/hashing.service');
const LogService = require('../log/log.service');
/* eslint-enable no-unused-vars */

const ServiceLog = require('../log/service.log.model');

const timeService = require('../services/time.service');
const ObjectId = require('../database/object.id');

class InvoiceService {
    /**
     * @param {Model} invoiceModel 
     * @param {LogService} logger
     */
    constructor(invoiceModel, logger) {
        this.Invoice = invoiceModel;

        this.logger = logger.child({ service: 'invoice.service' });
    }

    /**
     * Find an invoice
     * @param {Object} query 
     * 
     * @returns {Invoice}
     */
    findInvoice(query) {
        const functionName = 'findInvoice';
        const params = { query };

        return this.Invoice.findOne({
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
        const functionName = 'findInvoices';
        const params = { query };

        return this.Invoice.find({
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
     * Update a set of invoices
     * @param {Object} query 
     * @param {Object} newValues
     * @param {Number} dateLocal
     * 
     * @returns {[Invoice]}
     */
    updateInvoices(query, newValues, dateLocal) {
        const functionName = 'updateInvoices';
        const params = { query, newValues, dateLocal };

        const softQuery = {
            ...query,
            deletedAt: {
                $exists: false
            }
        };
        return this.Invoice.updateManyWithDates(softQuery, newValues, dateLocal)
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
     * Delete a invoice
     * @param {Invoice} invoice Invoice to delete
     */
    deleteInvoice(invoice) {
        const functionName = 'deleteInvoice';
        const params = { invoice };

        invoice.deletedAt = timeService().toISOString();

        return invoice.save()
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
     * Delete a set of invoices
     * @param {Object} query 
     * @param {Object} newValues
     * @param {Number} dateLocal
     * 
     * @returns {[Invoice]}
     */
    deleteInvoices(query) {
        const functionName = 'deleteInvoices';
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
        return this.Invoice.updateMany(softQuery, updatedValues)
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

module.exports = InvoiceService;