const joi = require('joi');

const {
    AUTH,
    DB: {
        PROPS: {
            DATE_HEADER,
            DATE_PROP
        }
    }
} = require('../enums');
const { STATES, ACTIVE } = require('../values').DATABASE.PROPS;

class UserSchema {
    constructor(baseSchema) {
        this.baseSchema = baseSchema;
    }

    generateSchema(keys) {
        if (!keys.headers) keys.headers = joi.object().unknown();

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
            recover: this.generateSchema({
                body: joi.object().keys({
                    email: joi
                        .string()
                        .max(200)
                        .email()
                        .regex(/^.+@.+(\..{3})(\..{2}){0,1}$/gi)
                        .required()
                }).required()
            }),
            changePassword: this.generateSchema({
                body: joi.object().keys({
                    password: joi
                        .string()
                        .min(6)
                        .required()
                }).required(),
                headers: joi.object().keys({
                    [AUTH.TOKEN_HEADER]: joi
                        .string()
                        .required()
                }).required().unknown(true)
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
                    address: joi.object().keys({
                        state: joi.string()
                            .valid(...STATES.ARRAY)
                            .required()
                    }).required()
                }).required().unknown(true)
            }),
            confirm: this.generateSchema({
                query: joi.object().keys({
                    token: joi
                        .string()
                        .required()
                }).required().unknown(true)
            }),
            patchUser: this.generateSchema({
                body: joi.object().keys({
                    email: joi
                        .string()
                        .regex(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/)
                        .min(5)
                        .max(255),
                    password: joi
                        .string()
                        .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@!%_\-*?&])[A-Za-z\d$@!%_\-*?&]{8,40}/)
                        .min(8)
                        .max(100),
                    phone: joi
                        .string()
                        .regex(/(^|(\d{2})|\(\d{2}\))\s(9?\d{4})(\s|-)?(\d{4})($|\n)/)
                        .max(20),
                    active: joi.string()
                        .valid(...ACTIVE.ARRAY),
                    name: joi
                        .string()
                        .max(255),
                    [DATE_PROP]: joi.string().forbidden()
                }).min(1).required().unknown(true),
                headers: joi.object().keys({
                    [AUTH.TOKEN_HEADER]: joi
                        .string()
                        .required(),
                    [DATE_HEADER]: joi.string()
                        .min(13)
                        .regex(/[0-9]+/g)
                        .optional()
                }).required().unknown(true)
            })
        };
    }
}

module.exports = UserSchema;