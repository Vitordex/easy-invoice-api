const DatabaseService = require('./database.service'); // eslint-disable-line

const { DATABASE: dbValues } = require('../values');
const { DB } = require('../enums');
const { MODELS } = DB;

class Invoice {
    /**
     * Create Invoice model
     * @param {DatabaseService} service 
     * 
     * @returns {Object} Invoice database model
     */
    constructor(service) {
        const ModelCreator = service.ModelCreator;
        const creator = new ModelCreator();

        const model = {
            customer: { type: creator.types.ObjectId, ref: MODELS.CUSTOMER },
            date_start: { type: Date, default: new Date(Date.now()) },
            date_end: Date,
            description: String,
            labor: [{
                name: String,
                description: String,
                time: String,
                price: Number
            }],
            equipment: [{ type: creator.types.ObjectId, ref: MODELS.EQUIPMENT }],
            material: [{ type: creator.types.ObjectId, ref: MODELS.MATERIAL }],
            addition: String,
            discount: String,
            value: Number,
            type: { type: String, enum: dbValues.PROPS.RES_TYPE.ARRAY },
            deletedAt: Date
        };

        const Invoice = creator.create(
            MODELS.INVOICE, 
            model, 
            {}, 
            Object.keys(model)
        );

        return Invoice;
    }
}

module.exports = Invoice;