const DatabaseService = require('./database.service'); // eslint-disable-line
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

        const Material = creator.create(creator.names.Material, {
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