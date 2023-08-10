const LogService = require('../log/log.service'); // eslint-disable-line

const ServiceLog = require('../log/service.log.model');

const jwt = require('jsonwebtoken');

class JwtService {
    /**
     * @param {String} param.hash 
     * @param {String} param.tokenExpiration 
     * @param {String} param.subject 
     * @param {LogService} param.logger
     */
    constructor({
        hash,
        tokenExpiration,
        subject,
        logger
    }) {
        this.hash = hash;
        this.expiration = tokenExpiration;

        this.ignoreExpiration = !tokenExpiration;

        this.subject = subject;

        this.logger = logger.child({ service: 'jwt.service' });
    }

    /**
     * @param {String} token 
     */
    verify(token) {
        const functionName = 'verify';
        const params = { token };

        const verifyOptions = {
            subject: this.subject,
            ignoreExpiration: this.ignoreExpiration
        };

        const promiseAction = (resolve, reject) => {
            const verifyAction = (err, decoded) => {
                if (err) return reject(err);

                resolve(decoded);
            };

            jwt.verify(token, this.hash, verifyOptions, verifyAction);
        };

        return new Promise(promiseAction)
            .then((result) => {
                const log = new ServiceLog(functionName, params, result).toObject();
                this.logger.info(log);

                return result;
            }).catch((err) => {
                const log = new ServiceLog(functionName, params, err).toObject();
                this.logger.error(log);

                return Promise.reject(err);
            });
    }

    /**
     * 
     * @param {Object} param.payload The payload of the token
     * 
     * @returns {Promise<String>}
     */
    generate(payload = {}) {
        const functionName = 'generate';
        const params = { payload };

        const promiseAction = (resolve, reject) => {
            const signOptions = {
                subject: this.subject,
                expiresIn: this.expiration
            };

            const signAction = (err, hash) => {
                if (err) return reject(err);

                resolve(hash);
            };

            jwt.sign(payload, this.hash, signOptions, signAction);
        };

        return new Promise(promiseAction)
            .then((result) => {
                const log = new ServiceLog(functionName, params, result).toObject();
                this.logger.info(log);

                return result;
            }).catch((err) => {
                const log = new ServiceLog(functionName, params, err).toObject();
                this.logger.error(log);

                return Promise.reject(err);
            });
    }
}

module.exports = JwtService;