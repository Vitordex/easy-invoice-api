/*globals describe, it, before, after*/
const assert = require('assert');
const sinon = require('sinon');

const config = require('../../src/services/config.service');

const MailService = require('../../src/services/mail.service');
const HashingService = require('../../src/services/hashing.service');

const ValidationMiddleware = require('../../src/middleware/validation.middleware');

const UserService = require('../../src/user/user.service');
const UserController = require('../../src/user/user.controller');
const UserSchema = require('../../src/user/user.schema');

const JwtService = require('../../src/auth/jwt.service');
const Context = require('./context.model');

const ControllerError = require('../../src/log/controller.error.model');

const fs = require('fs');
const hashKey = fs.readFileSync('./server.hash.key', { encoding: 'utf-8' });

const authConfigs = config.get('auth');

const hashingOptions = authConfigs.password;

const { AUTH, API: { STATUS } } = require('../../src/enums');

/**@type {MailService} */
let mailService;
/**@type {HashService} */
let hashingService;
/**@type {ValidationMiddleware} */
let validationMiddleware;
/**@type {User} */
let userModel;
/**@type {UserService} */
let userService;
/**@type {UserController} */
let userController;
/**@type {UserSchema} */
let userSchema;

describe('Users component', () => {
    const source = 'user.controller';

    hashingService = new HashingService(
        hashingOptions.key,
        hashingOptions.algorithm,
        hashingOptions.encoding
    );

    let testEmail = 'teste@teste.com';
    let testPassword = 'teste1';
    let hashedTestPassword = hashingService.createHash(testPassword);
    let testRegister = {
        email: testEmail,
        password: '@Testinho1',
        phone: '(11) 95555-5555',
        name: 'Teste teste',
        state: 'Acre'
    };

    const defaultNext = () => { };

    validationMiddleware = new ValidationMiddleware();
    userSchema = new UserSchema(validationMiddleware.baseSchema);

    mailService = new MailService(config.get('mail.options'));

    userService = new UserService(userModel, hashingService);

    const authTokenExpiration = authConfigs.token.expiration;
    const authJwtOptions = {
        hash: hashKey,
        tokenExpiration: authTokenExpiration,
        subject: AUTH.AUTH_SUBJECT
    };
    const authJwtService = new JwtService(authJwtOptions);

    const recoverTokenExpiration = authConfigs.token.expiration;
    const recoverJwtOptions = {
        hash: hashKey,
        tokenExpiration: recoverTokenExpiration,
        subject: AUTH.RESET_SUBJECT
    };
    const resetJwtService = new JwtService(recoverJwtOptions);

    const confirmTokenExpiration = authConfigs.token.expiration;
    const confirmJwtOptions = {
        hash: hashKey,
        tokenExpiration: confirmTokenExpiration,
        subject: AUTH.CONFIRM_SUBJECT
    };
    const confirmJwtService = new JwtService(confirmJwtOptions);

    userController = new UserController({
        authConfigs,
        authHash: hashKey,
        userService,
        mailService,
        authJwtService,
        confirmJwtService,
        resetJwtService
    });
});