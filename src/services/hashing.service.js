const crypto = require('crypto');

class HashingService {
    constructor(key, algorithm = 'sha1', encoding = 'utf-8') {
        this.key = key;
        this.algorithm = algorithm;
        this.encoding = encoding;
    }

    createHash(text) {
        return crypto
            .createHmac(this.algorithm, this.key)
            .update(text)
            .digest(this.encoding);
    }

    compare(text, hash) {
        return crypto
            .createHmac(this.algorithm, this.key)
            .update(text)
            .digest(this.encoding) === hash;
    }
}

module.exports = HashingService;