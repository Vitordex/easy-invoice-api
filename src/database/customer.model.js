const DatabaseService = require('./database.service'); // eslint-disable-line
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

        const Customer = creator.create(DB.MODELS.CUSTOMER, {
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
                    enum: DB.PROPS.STATES,
                    required: true
                }
            },
            document: String
        });

        return Customer;
    }
}

module.exports = Customer;