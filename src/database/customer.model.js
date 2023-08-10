const DatabaseService = require('./database.service'); // eslint-disable-line
const { DATABASE: dbValues } = require('../values');
const { DB } = require('../enums');

/**
 * Create Customer model
 * @param {DatabaseService} service 
 * 
 * @returns {Object} Customer database model
 */
class Customer {
    constructor(service) {
        const ModelCreator = service.ModelCreator;
        const creator = new ModelCreator();

        const model = {
            name: { type: String, required: true, max: 255 },
            address: {
                street: String,
                number: Number,
                complement: String,
                neighborhood: String,
                zip_code: String,
                city: String,
                state: {
                    type: String,
                    enum: dbValues.PROPS.STATES.ARRAY,
                    required: true
                }
            },
            document: String,
            userId: String,
            deletedAt: Date
        };

        const Customer = creator.create(
            DB.MODELS.CUSTOMER, 
            model, 
            {}, 
            Object.keys(model)
        );

        return Customer;
    }
}

module.exports = Customer;