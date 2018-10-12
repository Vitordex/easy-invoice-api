const timeService = require('../services/time.service');
const { HASH: { HEXNUM } } = require('../enums');

class ObjectId {
    /**
     * @param {Number} id use specified id instead of generating one
     * @param {Number} minRandom The min value for the random parameter
     * @param {Number} maxRandom The max value for the random parameter
     */
    constructor(id, minRandom = 30, maxRandom = 450) {
        const randomMax = Math.random() * (maxRandom - minRandom);
        const randomNumber = Math.ceil(randomMax) + minRandom;
        const aggregatedNumber = `${randomNumber}${timeService().valueOf()}`;

        this.id = id || parseInt(aggregatedNumber);
    }

    /**
     * @returns {String} A hex string from this id
     */
    toHex() {
        return this.id.toString(HEXNUM);
    }

    /**
     * Convert to ObjectId from hex string
     * @param {String} hex hex string that contains the id
     * 
     * @returns {ObjectId} A new object id from the hex passed
     */
    static fromHex(hex) {
        return new ObjectId(parseInt(hex, HEXNUM));
    }
}

module.exports = ObjectId;