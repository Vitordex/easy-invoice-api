const DatabaseService = require('./database.service'); // eslint-disable-line
const { DB } = require('../enums');
/**
 * Create Material model
 * @param {DatabaseService} service 
 * 
 * @returns {Object} Material database model
 */
class Material {
    constructor(service) {
        const ModelCreator = service.ModelCreator;
        const creator = new ModelCreator();

        const Material = creator.create(DB.MODELS.MATERIAL, {
            name: String,
            description: String,
            icon: String,
            modifier: [String],
            price: Number,
            count: Number
        });

        return Material;
    }
}

module.exports = Material;