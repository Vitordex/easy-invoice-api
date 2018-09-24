const DatabaseService = require('./database.service'); // eslint-disable-line
/**
 * Create Equipment model
 * @param {DatabaseService} service 
 * 
 * @returns {Object} Equipment database model
 */

class Equipment {
    constructor(service) {
        const ModelCreator = service.ModelCreator;
        const creator = new ModelCreator();

        const Equipment = creator.create(creator.names.Equipment, {
            name: String,
            description: String,
            price: Number,
            count: Number
        });

        return Equipment;
    }
}

module.exports = Equipment;