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
            patchUser: this.generateSchema({
                body: joi.object().keys({
                    _id: joi.string()
                        .forbidden(),
                    email: joi.string()
                        .regex(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/)
                        .min(5)
                        .max(255),
                    password: joi.string()
                        .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@!%_\-*?&])[A-Za-z\d$@!%_\-*?&]{8,40}/)
                        .min(8)
                        .max(100),
                    phone: joi.string()
                        .regex(/(^|(\d{2})|\(\d{2}\))\s(9?\d{4})(\s|-)?(\d{4})($|\n)/)
                        .max(20),
                    active: joi.string()
                        .valid(...ACTIVE.ARRAY)
                        .optional(),
                    name: joi.string()
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