const joi = require('joi');

const enums = require('../enums');

class CustomerSchema {
    constructor(baseSchema) {
        this.baseSchema = baseSchema;
    }

    generateSchema(keys) {
        return this.baseSchema.keys(keys);
    }

    get schemas() {
        return {
            getCustomer: this.generateSchema({
                headers: joi.object().keys({
                    [enums.AUTH.TOKEN_HEADER]: joi
                        .string()
                        .required()
                }).required().unknown(true),
                params: joi.object().keys({
                    customerId: joi
                        .string()
                        .required()
                }).required()
            }),
            postCustomer: this.generateSchema({
                headers: joi.object().keys({
                    [enums.AUTH.TOKEN_HEADER]: joi
                        .string()
                        .required()
                }).required().unknown(true),
                body: joi.object().keys({
                    name: joi.string()
                        .required(),
                    address: joi.object().keys({
                        street: joi.string()
                            .required(),
                        number: joi.number()
                            .min(0)
                            .required(),
                        complement: joi.string()
                            .required(),
                        neighborhood: joi.string()
                            .required(),
                        zip_code: joi.string()
                            .required(),
                        city: joi.string()
                            .required(),
                        state: joi.string()
                            .valid(enums.DB.PROPS.STATES)
                            .required()
                    }).required(),
                    document: joi.string()
                        .required()
                }).required()
            }),
            putCustomer: this.generateSchema({
                headers: joi.object().keys({
                    [enums.AUTH.TOKEN_HEADER]: joi
                        .string()
                        .required()
                }).required().unknown(true),
                params: joi.object().keys({
                    customerId: joi.string().required()
                }),
                body: joi.object().keys({
                    name: joi.string(),
                    address: joi.object().keys({
                        street: joi.string(),
                        number: joi.number()
                            .min(0),
                        complement: joi.string(),
                        neighborhood: joi.string(),
                        zip_code: joi.string(),
                        city: joi.string(),
                        state: joi.string()
                            .valid(enums.DB.PROPS.STATES)
                    }),
                    document: joi.string()
                }).min(1).required()
            })
        };
    }
}

module.exports = CustomerSchema;