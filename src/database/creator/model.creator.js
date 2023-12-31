const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Model = mongoose.Model; // eslint-disable-line
const baseMethods = require('./base.functions');

const enums = require('../../enums');

const DB_MODELS = enums.DB.MODELS; // eslint-disable-line

class ModelCreator {
    /**
     * A function that creates a model according with the database connection module
     * @param {String} name The name of the model
     * @param {Object} structure The property structure of the model
     * @param {Object} optionals Optional settings for Schema
     * @param {[String]} allowedProperties Properties to return in a toJSON function
     * 
     * @returns {Model} A model created with the specified parameters
     */
    create(name, structure, optionals = {}, allowedProperties) {
        const updated_local = {};
        Object.keys(structure).forEach((key) => {
            updated_local[key] = { // eslint-disable-line
                type: Date,
                default: new Date(Date.now())
            };
        });

        structure.updated_local = updated_local;
        structure._id = {
            type: String
        };
        allowedProperties.splice(0, 0, '_id');

        const schemaOptionals = {
            usePushEach: true,
            timestamps: true,
            ...optionals
        };

        const schema = new Schema(structure, schemaOptionals);

        if (allowedProperties.length)
            schema.method(enums.DB.FUNCTIONS.TO_JSON, this.toJson(allowedProperties));

        schema.method(enums.DB.FUNCTIONS.UPDATE_ONE_DATE, baseMethods.updateWithDates);
        schema.static(enums.DB.FUNCTIONS.UPDATE_MANY_DATE, baseMethods.updateManyWithDates);

        return mongoose.model(name, schema);
    }

    toJson(allowedProperties) {
        return function () {
            return allowedProperties.reduce((json, property) => {
                json[property] = this[property]; // eslint-disable-line

                return json;
            }, {});
        };
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
     * @returns {DB_MODELS} An object with all the type names
     */
    get names() {
        return enums.DB.MODELS;
    }
}

module.exports = ModelCreator;