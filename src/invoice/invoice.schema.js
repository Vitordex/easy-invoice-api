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
                    invoiceId: joi.string()
                        .min(13)
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
                    _id: joi.string()
                        .length(13)
                        .optional(),
                    customer: joi.string()
                        .length(13)
                        .required(),
                    description: joi.string()
                        .required(),
                    addition: joi.number()
                        .required(),
                    discount: joi.number()
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
                    invoiceId: joi.string()
                        .min(13)
                        .required()
                }),
                body: joi.object().keys({
                    _id: joi.string()
                        .forbidden(),
                    customer: joi.string()
                        .forbidden(),
                    description: joi.string()
                        .optional(),
                    addition: joi.number()
                        .optional(),
                    discount: joi.number()
                        .optional(),
                    value: joi.number()
                        .optional(),
                    type: joi.string()
                        .valid(DATABASE.PROPS.RES_TYPE.ARRAY)
                        .optional()
                }).min(1).required()
            }),
            deleteInvoice: this.generateSchema({
                headers: joi.object().keys({
                    [AUTH.TOKEN_HEADER]: joi
                        .string()
                        .required()
                }).required().unknown(true),
                params: joi.object().keys({
                    invoiceId: joi.string()
                        .min(13)
                        .required()
                })
            }),
            listInvoices: this.generateSchema({
                headers: joi.object().keys({
                    [AUTH.TOKEN_HEADER]: joi
                        .string()
                        .required()
                }).required().unknown(true)
            }),
            postGeneratePdf: this.generateSchema({
                headers: joi.object().keys({
                    [AUTH.TOKEN_HEADER]: joi
                        .string()
                        .required()
                }).required().unknown(true),
                body: joi.object().keys({
                    invoiceId: joi.string()
                        .min(13)
                        .required()
                })
            })
        };
    }
}

module.exports = InvoiceSchema;