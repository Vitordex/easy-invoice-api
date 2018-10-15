const jwt = require('jsonwebtoken');

class JwtService {
    /**
     * @param {String} param.hash 
     * @param {String} param.tokenExpiration 
     * @param {String} param.subject 
     */
    constructor({
        hash,
        tokenExpiration,
        subject
    }) {
        this.hash = hash;
        this.expiration = tokenExpiration;

        this.ignoreExpiration = !tokenExpiration;

        this.subject = subject;
    }

    /**
     * @param {String} token 
     */
    verify(token) {
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

        return new Promise(promiseAction);
    }

    /**
     * 
     * @param {Object} param.payload The payload of the token
     * 
     * @returns {Promise<String>}
     */
    generate(payload = {}) {
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

        return new Promise(promiseAction);
    }
}

module.exports = JwtService;