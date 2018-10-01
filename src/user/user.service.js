/* eslint-disable no-unused-vars */
const { User } = require('../database/common.types').Instances;
const HashService = require('../services/hashing.service');
/* eslint-enable no-unused-vars */

class UserService {
    /**
     * @param {User} userModel 
     * @param {HashService} passwordService The password hashing service
     */
    constructor(userModel, passwordService) {
        this.User = userModel;
        this.passwordService = passwordService;
    }

    findUser(query) {
        return this.User.find(query);
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