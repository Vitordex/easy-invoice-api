/* eslint-disable no-unused-vars */
const CommonTypes = require('../database/common.types');
const { User } = CommonTypes.Instances;
const { Model } = CommonTypes;
const HashService = require('../services/hashing.service');
/* eslint-enable no-unused-vars */

const ObjectId = require('../database/object.id');
const timeService = require('../services/time.service');

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

        const newId = new ObjectId().toHex();
        body._id = body._id || newId;

        return new this.User(body);
    }

    /**
     * Delete a user
     * @param {User} user User to delete
     */
    deleteUser(user){
        user.deletedAt = timeService().toISOString();

        return user.save();
    }
}

module.exports = UserService;