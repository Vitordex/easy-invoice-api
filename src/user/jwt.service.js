const jwt = require('jsonwebtoken');

class JwtService {
    constructor({
        hash,
        tokenExpiration
    }) {
        this.hash = hash;
        this.expiration = tokenExpiration;

        this.ignoreExpiration = !tokenExpiration;
    }

    verify(token, { subject }) {
        const verifyOptions = {
            subject,
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

    generate({ payload, subject }) {
        const promiseAction = (resolve, reject) => {
            const signOptions = {
                subject,
                expiresIn: this.expiration
            };

            const signAction = (err, hash) => {
                if (err) return reject(err);

                resolve(hash);
            };
            
            jwt.sign(payload, this.secret, signOptions, signAction);
        };

        return new Promise(promiseAction);
    }
}

module.exports = JwtService;