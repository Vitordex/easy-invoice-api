const crypto = require('crypto');

const enums = require('../enums');

class HashingService {
    constructor(key, algorithm = enums.HASH.SHA1, encoding = enums.HASH.ENCODING) {
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