/* eslint-disable no-unused-vars */
const CommonTypes = require('../database/common.types');
const { User } = CommonTypes.Instances;
const { Model } = CommonTypes;
const HashService = require('../services/hashing.service');
/* eslint-enable no-unused-vars */

class UserService {
    /**
     * @param {Model} userModel 
     * @param {HashService} passwordService The password hashing service
     */
    constructor(userModel, passwordService) {
        this.User = userModel;
        this.passwordService = passwordService;
    }

    /**
     * Find a set of users
     * @param {Object} query 
     * 
     * @returns {User}
     */
    findUser(query) {
        return this.User.findOne({
            ...query,
            deletedAt: {
                $exists: false
            }
        });
    }

    hashPassword(password) {
        return this.passwordService.createHash(password);
    }

    matchPassword(password, hash) {
        return this.passwordService.compare(password, hash);
    }

    toJSON(userObject) {
        return userObject.toJSON();
    }

    /**
     * Function to create a single user
     * @param {Object} body The user document body
     * 
     * @returns {User}
     */
    async create(body) {
        const password = await this.passwordService.createHash(body.password);
        body.password = password;

        return new this.User(body);
    }
}

module.exports = UserService;