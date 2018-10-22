/* eslint-disable no-unused-vars */
const CommonTypes = require('../database/common.types');
const { User } = CommonTypes.Instances;
const { Model } = CommonTypes;
const HashService = require('../services/hashing.service');
const LogService = require('../log/log.service');
/* eslint-enable no-unused-vars */

const ServiceLog = require('../log/service.log.model');

const ObjectId = require('../database/object.id');
const timeService = require('../services/time.service');

class UserService {
    /**
     * @param {Model} userModel 
     * @param {HashService} passwordService The password hashing service
     * @param {LogService} logger
     */
    constructor(userModel, passwordService, logger) {
        this.User = userModel;
        this.passwordService = passwordService;

        this.logger = logger.child({ service: 'user.service' });
    }

    /**
     * Find a set of users
     * @param {Object} query 
     * 
     * @returns {User}
     */
    findUser(query) {
        const functionName = 'findUser';
        const params = { query };

        return this.User.findOne({
            ...query,
            deletedAt: {
                $exists: false
            }
        }).then((result) => {
            const log = new ServiceLog(functionName, params, result).toObject();
            this.logger.info(log);

            return result;
        }).catch((err) => {
            const log = new ServiceLog(functionName, params, err).toObject();
            this.logger.error(log);

            return Promise.reject(err);
        });
    }

    /**
     * Hash the provided password
     * @param {String} password 
     * 
     * @return {String} The result of the hashing
     */
    hashPassword(password) {
        return this.passwordService.createHash(password);
    }

    /**
     * Compare the input password with the user password
     * @param {String} password The input password
     * @param {String} hash The original hash of the user's password
     */
    matchPassword(password, hash) {
        return this.passwordService.compare(password, hash);
    }

    /**
     * Jsonify the user object
     * @param {User} userObject 
     * @returns {Object}
     */
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
    deleteUser(user) {
        const functionName = 'deleteUser';
        const params = { user: user._id };

        user.deletedAt = timeService().toISOString();

        return user.save()
            .then((result) => {
                const log = new ServiceLog(functionName, params, result).toObject();
                this.logger.info(log);

                return result;
            }).catch((err) => {
                const log = new ServiceLog(functionName, params, err).toObject();
                this.logger.error(log);

                return Promise.reject(err);
            });
    }
}

module.exports = UserService;