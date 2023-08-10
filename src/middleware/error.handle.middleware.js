const { JS } = require('../enums');
const LogService = require('../log/log.service'); // eslint-disable-line
const ControllerError = require('../log/controller.error.model');// eslint-disable-line
const ServiceError = require('../log/service.error.model');// eslint-disable-line

/**
 * Returns a middleware for error handling and logging
 * @param {LogService} logger 
 */
function handleErrors(logger) {
    return async (context, next) => {
        let output;
        try {
            await next();

            output = context.body;
        } catch (error) {
            /**@type {ControllerError|ServiceError} */
            let treatError = error;

            const instanceOfController = error instanceof ControllerError;
            const instanceOfService = error instanceof ServiceError;
            const handledError = instanceOfController || instanceOfService;
            if (!error || !handledError)
                treatError = {
                    message: 'Error',
                    reason: error,
                    toJson: () => ({
                        message:
                            'Error',
                        reason: error
                    })
                };

            logger.error(treatError.message, treatError.toJson());
            context.status = treatError.requestStatus || context.status;

            output = treatError.output;
        }

        const { status, body } = context;
        const bodyType = typeof body;
        const errorStatus = status > 399;
        const errorThrow = !body && errorStatus;
        const textBody = bodyType === JS.STRING;
        const validationError = bodyType === JS.OBJECT && errorStatus;
        const success = status === 200 && !body;

        logger.info('route-logger', {
            input: context.input,
            output,
            method: context.request.url
        });

        if (errorThrow || textBody || validationError || success) {
            context.status = status;
            context.body = '';
        }
    };
}

module.exports = handleErrors;