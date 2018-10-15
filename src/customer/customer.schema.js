const joi = require('joi');

const { AUTH } = require('../enums');
const { DATABASE } = require('../values');

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
                    [AUTH.TOKEN_HEADER]: joi
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
                    [AUTH.TOKEN_HEADER]: joi
                        .string()
                        .required()
                }).required().unknown(true),
                body: joi.object().keys({
                    _id: joi.string()
                        .length(13)
                        .optional(),
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
                            .valid(DATABASE.PROPS.STATES.ARRAY)
                            .required()
                    }).required(),
                    document: joi.string()
                        .required()
                }).required()
            }),
            putCustomer: this.generateSchema({
                headers: joi.object().keys({
                    [AUTH.TOKEN_HEADER]: joi
                        .string()
                        .required()
                }).required().unknown(true),
                params: joi.object().keys({
                    customerId: joi.string().required()
                }),
                body: joi.object().keys({
                    _id: joi.string()
                        .forbidden(),
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
                            .valid(DATABASE.PROPS.STATES.ARRAY)
                    }),
                    document: joi.string()
                }).min(1).required()
            }),
            deleteCustomer: this.generateSchema({
                headers: joi.object().keys({
                    [AUTH.TOKEN_HEADER]: joi
                        .string()
                        .required()
                }).required().unknown(true),
                params: joi.object().keys({
                    customerId: joi.string()
                        .min(13)
                        .required()
                })
            }),
            listCustomers: this.generateSchema({
                headers: joi.object().keys({
                    [AUTH.TOKEN_HEADER]: joi
                        .string()
                        .required()
                }).required().unknown(true)
            })
        };
    }
}

module.exports = CustomerSchema;