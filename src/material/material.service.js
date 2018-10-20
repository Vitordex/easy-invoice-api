/* eslint-disable no-unused-vars */
const {
    Instances: {
        Material 
    }, Model 
} = require('../database/common.types');
const HashService = require('../services/hashing.service');
/* eslint-enable no-unused-vars */

const ObjectId = require('../database/object.id');

class MaterialService {
    /**
     * @param {Model} materialModel 
     */
    constructor(materialModel) {
        this.Material = materialModel;
    }

    /**
     * Find an material
     * @param {Object} query 
     * 
     * @returns {Material}
     */
    findMaterial(query) {
        return this.Material.findOne({
            ...query,
            deletedAt: {
                $exists: false
            }
        });
    }

    /**
     * Function to create a single material
     * @param {Object} body The material document body
     * 
     * @returns {Material}
     */
    async create(body) {
        const newId = new ObjectId().toHex();
        body._id = body._id || newId;
        
        return new this.Material(body);
    }

    /**
     * Find a set of materials
     * @param {Object} query 
     * 
     * @returns {[Material]}
     */
    findMaterials(query) {
        return this.Material.find({
            ...query,
            deletedAt: {
                $exists: false
            }
        });
    }
}

module.exports = MaterialService;