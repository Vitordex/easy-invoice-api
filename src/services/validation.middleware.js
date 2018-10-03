const joi = require('joi');

const enums = require('../enums');

const baseSchema = joi.object().options({
    abortEarly: false
});

function isValidObject(obj) {
    return typeof (obj) === enums.JS.OBJECT && Object.keys(obj).length > 0;
}

class InputValidationService {
    validate(schema) {
        return async function validationMiddleware(context, next) {
            const input = {};
            if (isValidObject(context.request.body))
                input.body = context.request.body;
            if (isValidObject(context.request.query))
                input.query = context.request.query;
            if (isValidObject(context.request.params))
                input.params = context.request.params;
            if (isValidObject(context.request.headers))
                input.headers = context.request.headers;
                
            try {
                await joi.validate(input, schema);

                await next();
            } catch (error) {
                if (!error.details) throw error;

                context.body = error.details.map(err => {
                    return {
                        key: err.context.key,
                        label: err.context.label,
                        type: err.type
                    };
                });

                context.status = 400;
            }
        };
    }

    get baseSchema() {
        return baseSchema;
    }
}

module.exports = InputValidationService;
