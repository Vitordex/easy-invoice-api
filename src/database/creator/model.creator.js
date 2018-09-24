const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Model = mongoose.Model; // eslint-disable-line
const baseMethods = require('./base.functions');

class ModelCreator {
    /**
     * A function that creates a model according with the database connection module
     * @param {String} name The name of the model
     * @param {Object} structure The property structure of the model
     * @param {Object} optionals Optional settings for Schema
     * 
     * @returns {Model} A model created with the specified parameters
     */
    create(name, structure, optionals = {}) {
        const updated_local = {};
        Object.keys(structure).forEach((key) => {
            updated_local[key] = {
                type: Date,
                default: new Date(Date.now())
            };
        });

        structure.updated_local = updated_local;

        const schemaOptionals = {
            usePushEach: true,
            timestamps: true,
            ...optionals
        };

        const schema = new Schema(structure, schemaOptionals);

        schema.method('updateOneWithDates', baseMethods.updateOneWithDates);
        schema.static('updateManyWithDates', baseMethods.updateManyWithDates);

        return mongoose.model(name, schema);
    }

    /**
     * Getter to return schema property types and removing db reference from outside models
     * @returns {mongoose.Schema.Types} An object with all the types
     */
    get types() {
        return mongoose.Schema.Types;
    }

    /**
     * Getter to return all schema names for this project
     * @returns {Object} An object with all the type names
     */
    get names() {
        return {
            User: 'User',
            Customer: 'Customer',
            Invoice: 'Invoice',
            Material: 'Material',
            Equipment: 'Equipment'
        };
    }
}

module.exports = ModelCreator;