const bunyan = require('bunyan');

class LogService {
    constructor(loggerName, pathToLogFile, minLogLevel = 'trace') {
        this.logger = bunyan.createLogger({
            level: minLogLevel,
            name: loggerName,
            streams: [{
                path: pathToLogFile
            }]
        });
    }

    log(object, message, level = 'info') {
        let logFunction;

        switch (level) {
        case 'debug':
            logFunction = this.logger.debug;
            break;
        case 'trace':
            logFunction = this.logger.trace;
            break;
        case 'info':
            logFunction = this.logger.info;
            break;
        case 'warn':
            logFunction = this.logger.warn;
            break;
        case 'error':
            logFunction = this.logger.error;
            break;
        case 'fatal':
            logFunction = this.logger.fatal;
            break;
        default:
            throw new Error('Invalid log level');
        }

        logFunction(object, message);
    }

    debug(message, object = {}) {
        this.logger.debug(object, message);
    }

    trace(message, object = {}) {
        this.logger.trace(object, message);
    }

    info(message, object = {}) {
        this.logger.info(object, message);
    }

    warn(message, object = {}) {
        this.logger.warn(object, message);
    }

    error(message, object = {}) {
        this.logger.error(object, message);
    }

    fatal(message, object = {}) {
        this.logger.fatal(object, message);
    }
}

module.exports = LogService;