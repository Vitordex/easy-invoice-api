const joi = require('joi');

const ControllerError = require('../log/controller.error.model'); // eslint-disable-line

const enums = require('../enums');

const baseSchema = joi.object().options({
    abortEarly: false
});

function isValidObject(obj) {
    return typeof (obj) === enums.JS.OBJECT && Object.keys(obj).length > 0;
}

class InputValidationService {
    /**
     * @param {ControllerError} apiError 
     */
    constructor(apiError) {
        this.ControllerError = apiError;
    }

    validate(schema) {
        return async function validationMiddleware(context, next) {
            const input = {};
            if (isValidObject(context.request.body))
                input.body = context.request.body;
            if (isValidObject(context.request.query))
                input.query = context.request.query;
            if (isValidObject(context.params))
                input.params = context.params;
            if (isValidObject(context.request.headers))
                input.headers = context.request.headers;

            try {
                await joi.validate(input, schema);

                context.input = input;
                await next();
            } catch (error) {
                if (!error.details) throw error;

                const status = 400;
                
                const mapError = err => {
                    return {
                        key: err.context.key,
                        label: err.context.label,
                        type: err.type
                    };
                };
                const inputError = new ControllerError(
                    status,
                    'Input error',
                    'validation',
                    'validate',
                    input,
                    error.details.map(mapError)
                );

                context.throw(status, inputError);
            }
        };
    }

    get baseSchema() {
        return baseSchema;
    }
}

module.exports = InputValidationService;
