const DatabaseService = require('./database.service'); // eslint-disable-line
/**
 * Create Invoice model
 * @param {DatabaseService} service 
 * 
 * @returns {Object} Invoice database model
 */

class Invoice {
    constructor(service) {
        const ModelCreator = service.ModelCreator;
        const creator = new ModelCreator();

        const Invoice = creator.create(creator.names.Invoice, {
            client: creator.types.ObjectId,
            date: Date,
            description: String,
            labor: [{
                name: String,
                description: String,
                time: String,
                price: Number
            }],
            equipment: [{ type: creator.types.ObjectId, ref: creator.names.Equipment }],
            material: [{ type: creator.types.ObjectId, ref: creator.names.Material }],
            addition: String,
            discount: String,
            value: Number,
            type: { type: String, enum: ['Apartamento', 'Casa', 'Comercial'] }
        });

        return Invoice;
    }
}

module.exports = Invoice;