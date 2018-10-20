const joi = require('joi');

const { AUTH } = require('../enums');

class MaterialSchema {
    constructor(baseSchema) {
        this.baseSchema = baseSchema;
    }

    generateSchema(keys) {
        return this.baseSchema.keys(keys);
    }

    get schemas() {
        return {
            getMaterial: this.generateSchema({
                headers: joi.object().keys({
                    [AUTH.TOKEN_HEADER]: joi
                        .string()
                        .required()
                }).required().unknown(true),
                params: joi.object().keys({
                    materialId: joi.string()
                        .min(13)
                        .required()
                }).required()
            }),
            postMaterial: this.generateSchema({
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
                    description: joi.string()
                        .required(),
                    icon: joi.string()
                        .required(),
                    modifier: joi.array()
                        .required(),
                    price: joi.number()
                        .required(),
                    count: joi.number()
                        .min(0)
                        .required()
                }).required()
            }),
            patchMaterial: this.generateSchema({
                headers: joi.object().keys({
                    [AUTH.TOKEN_HEADER]: joi
                        .string()
                        .required()
                }).required().unknown(true),
                params: joi.object().keys({
                    materialId: joi.string()
                        .min(13)
                        .required()
                }),
                body: joi.object().keys({
                    _id: joi.string()
                        .forbidden(),
                    name: joi.string()
                        .optional(),
                    description: joi.string()
                        .optional(),
                    icon: joi.string()
                        .optional(),
                    modifier: joi.array()
                        .optional(),
                    price: joi.number()
                        .optional(),
                    count: joi.number()
                        .min(0)
                        .optional()
                }).min(1).required()
            }),
            deleteMaterial: this.generateSchema({
                headers: joi.object().keys({
                    [AUTH.TOKEN_HEADER]: joi
                        .string()
                        .required()
                }).required().unknown(true),
                params: joi.object().keys({
                    materialId: joi.string()
                        .min(13)
                        .required()
                })
            }),
            listMaterials: this.generateSchema({
                headers: joi.object().keys({
                    [AUTH.TOKEN_HEADER]: joi
                        .string()
                        .required()
                }).required().unknown(true)
            })
        };
    }
}

module.exports = MaterialSchema;