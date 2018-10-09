const joi = require('joi');

const { AUTH } = require('../enums');
const { DATABASE } = require('../values');

class InvoiceSchema {
    constructor(baseSchema) {
        this.baseSchema = baseSchema;
    }

    generateSchema(keys) {
        return this.baseSchema.keys(keys);
    }

    get schemas() {
        return {
            getInvoice: this.generateSchema({
                headers: joi.object().keys({
                    [AUTH.TOKEN_HEADER]: joi
                        .string()
                        .required()
                }).required().unknown(true),
                params: joi.object().keys({
                    invoiceId: joi
                        .string()
                        .required()
                }).required()
            }),
            postInvoice: this.generateSchema({
                headers: joi.object().keys({
                    [AUTH.TOKEN_HEADER]: joi
                        .string()
                        .required()
                }).required().unknown(true),
                body: joi.object().keys({
                    customer: joi.string()
                        .length(24)
                        .required(),
                    description: joi.string()
                        .required(),
                    addition: joi.string()
                        .required(),
                    discount: joi.string()
                        .required(),
                    value: joi.number()
                        .required(),
                    type: joi.string()
                        .valid(DATABASE.PROPS.RES_TYPE.ARRAY)
                        .required()
                }).required()
            }),
            patchInvoice: this.generateSchema({
                headers: joi.object().keys({
                    [AUTH.TOKEN_HEADER]: joi
                        .string()
                        .required()
                }).required().unknown(true),
                params: joi.object().keys({
                    invoiceId: joi.string().required()
                }),
                body: joi.object().keys({
                    customer: joi.string()
                        .forbidden(),
                    description: joi.string()
                        .optional(),
                    addition: joi.string()
                        .optional(),
                    discount: joi.string()
                        .optional(),
                    value: joi.number()
                        .optional(),
                    type: joi.string()
                        .valid(DATABASE.PROPS.RES_TYPE.ARRAY)
                        .optional()
                }).min(1).required()
            })
        };
    }
}

module.exports = InvoiceSchema;