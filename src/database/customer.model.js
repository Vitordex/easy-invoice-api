const DatabaseService = require('./database.service'); // eslint-disable-line
/**
 * Create Customer model
 * @param {DatabaseService} service 
 * 
 * @returns {Object} Customer database model
 */
class Customer {
    constructor(service){
        const ModelCreator = service.ModelCreator;
        const creator = new ModelCreator();
    
        const Customer = creator.create(creator.names.Customer, {
            name: { type: String, required: true, max: 255 },
            address: String,
            document: String
        });
    
        return Customer;
    }
}

module.exports = Customer;