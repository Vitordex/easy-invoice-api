const joi = require('joi');

const enums = require('../enums');

const { STATES } = require('../enums').DB.PROPS;

class UserSchema {
    constructor(baseSchema) {
        this.baseSchema = baseSchema;
    }

    generateSchema(keys) {
        if(!keys.headers) keys.headers = joi.object().unknown();
        
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
                }).required(),
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
            recover: this.generateSchema({
                body: joi.object().keys({
                    password: joi
                        .string()
                        .min(6)
                        .required()
                }).required()
            }),
            register: this.generateSchema({
                body: joi.object().keys({
                    email: joi
                        .string()
                        .regex(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/)
                        .required()
                        .min(5)
                        .max(255),
                    password: joi
                        .string()
                        .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@!%_\-*?&])[A-Za-z\d$@!%_\-*?&]{8,40}/)
                        .min(8)
                        .max(100)
                        .required(),
                    phone: joi
                        .string()
                        .regex(/(^|(\d{2})|\(\d{2}\))\s(9?\d{4})(\s|-)?(\d{4})($|\n)/)
                        .max(20)
                        .required(),
                    active: joi
                        .boolean()
                        .optional(),
                    name: joi
                        .string()
                        .max(255)
                        .required(),
                    state: joi.string()
                        .valid(...STATES)
                        .optional()
                }).required().unknown(true)
            }),
            confirm: this.generateSchema({
                headers: joi.object().keys({
                    [enums.AUTH.TOKEN_HEADER]: joi
                        .string()
                        .required()
                }).required().unknown(true)
            })
        };
    }
}

module.exports = UserSchema;