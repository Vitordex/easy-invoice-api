const joi = require('joi');

class UserSchema {
    constructor(baseSchema) {
        this.baseSchema = baseSchema;
    }

    generateSchema(keys) {
        return this.baseSchema.keys(keys);
    }

    get schemas() {
        return {
            login: this.generateSchema({
                body: joi.object().keys({
                    email: joi
                        .string()
                        .email()
                        .max(200)
                        .regex(/^.+@.+(\..{3})(\..{2}){0,1}$/gi)
                        .required(),
                    password: joi
                        .string()
                        .min(6)
                        .required()
                }).required()
            }),
            verify: this.generateSchema({
                body: joi.object().keys({
                    email: joi
                        .string()
                        .max(200)
                        .email()
                        .regex(/^.+@.+(\..{3})(\..{2}){0,1}$/gi)
                        .required()
                }).required()
            }),
            resetPassword: this.generateSchema({
                body: joi.object().keys({
                    password: joi
                        .string()
                        .min(6)
                        .required()
                }).required(),
                query: joi.object().keys({
                    token: joi
                        .string()
                        .required()
                }).required()
            })
        };
    }
}

module.exports = UserSchema;