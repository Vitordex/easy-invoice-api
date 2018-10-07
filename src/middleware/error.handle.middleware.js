const { JS } = require('../enums');
const LogService = require('../log/log.service'); // eslint-disable-line
const ControllerError = require('../log/controller.error.model');// eslint-disable-line

/**
 * Returns a middleware for error handling and logging
 * @param {LogService} logger 
 */
function handleErrors(logger) {
    return async (context, next) => {
        try {
            await next();
        } catch (error) {
            /**@type {ControllerError} */
            let treatError = error;

            if (!error)
                treatError = { message: 'Error', reason: {} };

            logger.error(treatError.message, treatError.toJson());
            context.status = treatError.requestStatus;
        }

        const { status, body } = context;
        const bodyType = typeof body;
        const errorStatus = status > 399;
        const errorThrow = !body && errorStatus;
        const textBody = bodyType === JS.STRING;
        const validationError = bodyType === JS.OBJECT && errorStatus;
        const success = status === 200 && !body;

        if (errorThrow || textBody || validationError || success) {
            context.status = status;
            context.body = '';
        }
    };
}

module.exports = handleErrors;