const { JS } = require('../enums');
const LogService = require('../services/log.service'); // eslint-disable-line

/**
 * Returns a middleware for error handling and logging
 * @param {LogService} logger 
 */
function handleErrors(logger) {
    return async (context, next) => {
        try {
            await next();
        } catch (error) {
            let treatError = error;

            if (!error)
                treatError = { message: 'Error', reason: {} };

            logger.error(treatError.message, treatError.reason);
        }

        const { status, body } = context;
        const bodyType = typeof body;
        const errorStatus = status > 399;

        if ((!body && errorStatus) ||
            bodyType === JS.STRING ||
            (bodyType === JS.OBJECT && errorStatus)
        ) {
            context.status = status;
            context.body = '';
        }
    };
}

module.exports = handleErrors;