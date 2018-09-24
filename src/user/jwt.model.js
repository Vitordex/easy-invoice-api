const jsonwebtoken = require('jsonwebtoken');

class AuthToken{
    constructor(payload, secret, tokenOptions) {
        this.payload = payload;
        this.secret = secret;
        this.options = tokenOptions;
    }

    hash() {
        return new Promise((resolve, reject) => {
            jsonwebtoken.sign(
                this.payload,
                this.secret,
                this.options,
                (err, hash) => {
                    if(err) return reject(err);

                    resolve(hash);
                }
            );
        });
    }

    verify(token) {
        return new Promise((resolve, reject) => {
            jsonwebtoken.verify(token, this.secret, (err, decoded) => {
                if (err) return reject(err);

                resolve(decoded);
            });
        });
    }
}

module.exports = AuthToken;