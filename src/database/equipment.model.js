const DatabaseService = require('./database.service'); // eslint-disable-line
const { DB } = require('../enums');
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

        const model = {
            name: String,
            description: String,
            price: Number,
            count: Number
        };

        const Equipment = creator.create(
            DB.MODELS.EQUIPMENT, 
            model,
            {},
            Object.keys(model)
        );

        return Equipment;
    }
}

module.exports = Equipment;