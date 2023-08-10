const crypto = require('crypto');

const enums = require('../enums');

class HashingService {
    /**
     * @param {String} key The secret key to hash strings
     * @param {String} algorithm The algorithm to hash strings
     * @param {String} encoding The encoding of the input string
     */
    constructor(key, algorithm = enums.HASH.SHA1, encoding = enums.HASH.ENCODING) {
        this.key = key;
        this.algorithm = algorithm;
        this.encoding = encoding;
    }

    /**
     * Hash a string in configured algorithm
     * @param {String} text The string to hash
     */
    createHash(text) {
        return crypto
            .createHmac(this.algorithm, this.key)
            .update(text)
            .digest(this.encoding);
    }

    /**
     * Compare an input string with a hash
     * @param {String} text The input text
     * @param {String} hash The hash to compare
     */
    compare(text, hash) {
        return crypto
            .createHmac(this.algorithm, this.key)
            .update(text)
            .digest(this.encoding) === hash;
    }
}

module.exports = HashingService;