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

const JwtService = require('../../src/user/jwt.service');
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

    describe('login route', () => {
        describe('happy path', () => {
            before(() => {
                sinon.stub(userService, 'findUser').resolves({
                    active: 'static',
                    email: testEmail,
                    password: hashedTestPassword,
                    _id: 1,
                    toJSON: () => ({
                        email: testEmail,
                        password: hashedTestPassword,
                        _id: 1
                    }),
                    save: () => Promise.resolve(true)
                });
            });

            it('should return user with id 1', async () => {
                const context = new Context({
                    body: {
                        email: testEmail,
                        password: testPassword
                    }
                });

                const next = async () => {
                    await userController.login(context, defaultNext);
                };

                await validationMiddleware.validate(userSchema.schemas.login)(
                    context,
                    next
                );

                const responseBody = context.body;
                const headers = context.header;
                const jwt = await authJwtService.generate({ id: 1 });

                assert(responseBody && responseBody._id === 1);
                assert(headers[AUTH.TOKEN_HEADER] === jwt);
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('invalid customer', () => {
            before(() => {
                sinon.stub(userService, 'findUser').resolves(null);
            });

            it('should throw a 404 error', async () => {
                const context = new Context({
                    body: {
                        email: testEmail,
                        password: testPassword
                    }
                });

                const next = async () => {
                    await userController.login(context, defaultNext);
                };

                await validationMiddleware.validate(userSchema.schemas.login)(
                    context,
                    next
                );

                const status = context.status;

                assert(status === STATUS.NOT_FOUND);
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('wrong password', () => {
            before(() => {
                sinon.stub(userService, 'findUser').resolves({
                    email: testEmail,
                    password: hashedTestPassword,
                    id: 1,
                    toJSON: () =>
                        JSON.stringify({
                            email: testEmail,
                            password: hashedTestPassword,
                            id: 1
                        })
                });
            });

            it('should throw a 404 error', async () => {
                const context = new Context({
                    body: {
                        email: testEmail,
                        password: 'teste45'
                    }
                });

                const next = async () => {
                    await userController.login(context, defaultNext);
                };

                await validationMiddleware.validate(userSchema.schemas.login)(
                    context,
                    next
                );

                const status = context.status;

                assert(status === STATUS.NOT_FOUND);
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('wrong input', () => {
            it('should throw a 400 error', async () => {
                const context = new Context({
                    body: {}
                });

                await validationMiddleware.validate(
                    userSchema.schemas.login
                )(context);

                assert(context.status === STATUS.BAD_REQUEST);
                assert(context.body instanceof ControllerError);
            });
        });
    });

    describe('recover route', () => {
        describe('happy path', () => {
            before(() => {
                sinon.stub(userService, 'findUser').resolves({
                    _id: 1,
                    email: testEmail,
                    password: hashedTestPassword,
                    id: 1,
                    toJSON: () => ({
                        email: testEmail,
                        password: hashedTestPassword,
                        id: 1
                    })
                });

                sinon.stub(mailService, 'sendMail').resolves(true);
            });

            it('should return status 200', async () => {
                const context = new Context({
                    body: {
                        email: testEmail
                    },
                    origin: 'localhost'
                });

                const next = async () => {
                    await userController.recover(context, defaultNext);
                };

                await validationMiddleware.validate(userSchema.schemas.recover)(
                    context,
                    next
                );

                const payload = {
                    id: 1,
                    email: testEmail
                };
                const jwt = await resetJwtService.generate(payload);

                const url = `localhost/users/reset/password?token=${jwt}`;

                assert(mailService.sendMail.getCall(0).args[3].includes(url));
                assert(context.status === STATUS.OK);
            });

            after(() => {
                userService.findUser.restore();
                mailService.sendMail.restore();
            });
        });

        describe('invalid customer', () => {
            before(() => {
                sinon.stub(userService, 'findUser').resolves(null);
            });

            it('should throw a 404 error', async () => {
                const context = new Context({
                    body: {
                        email: testEmail,
                        password: testPassword
                    }
                });

                await validationMiddleware.validate(userSchema.schemas.recover)(
                    context,
                    async () => {
                        await userController.recover(context, () => {
                            const status = context.status;

                            assert(status === STATUS.NOT_FOUND);
                        });
                    }
                );
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('invalid email', () => {
            before(() => {
                sinon.stub(userService, 'findUser').resolves({
                    email: testEmail,
                    password: hashedTestPassword,
                    id: 1,
                    toJSON: () =>
                        JSON.stringify({
                            email: testEmail,
                            password: hashedTestPassword,
                            id: 1
                        })
                });

                sinon.stub(mailService, 'sendMail').throws('error');
            });

            it('should throw a 400 error', async () => {
                const context = new Context({
                    body: {
                        email: testEmail,
                        password: testPassword
                    }
                });

                await validationMiddleware.validate(userSchema.schemas.recover)(
                    context,
                    async () => {
                        await userController.recover(context, () => {
                            const status = context.status;

                            assert(status === STATUS.BAD_REQUEST);
                        });
                    }
                );
            });

            after(() => {
                userService.findUser.restore();
                mailService.sendMail.restore();
            });
        });

        describe('wrong input', () => {
            it('should throw a 400 error', async () => {
                const context = new Context({
                    body: {}
                });

                await validationMiddleware.validate(
                    userSchema.schemas.recover
                )(context);

                assert(context.status === STATUS.BAD_REQUEST);
                assert(context.body instanceof ControllerError);
            });
        });
    });

    describe('changePassword route', () => {
        describe('happy path', () => {
            before(() => {
                sinon.stub(userService, 'findUser').resolves({
                    email: testEmail,
                    password: hashedTestPassword,
                    id: 1,
                    save: () => Promise.resolve(true)
                });
            });

            it('should return status 200', async () => {
                const payload = {
                    id: 1,
                    email: testEmail
                };
                const context = new Context({
                    body: {
                        password: testPassword
                    },
                    headers: {
                        [AUTH.TOKEN_HEADER]: await resetJwtService.generate(payload)
                    }
                });

                const next = async () => {
                    await userController.changePassword(context, defaultNext);
                };

                await validationMiddleware.validate(userSchema.schemas.changePassword)(
                    context,
                    next
                );

                const status = context.status;

                assert(status === STATUS.OK);
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('invalid token', () => {
            it('should throw a 401 error', async () => {
                const payload = {
                    id: 1,
                    email: testEmail
                };
                const context = new Context({
                    body: {
                        password: testPassword
                    },
                    headers: {
                        [AUTH.TOKEN_HEADER]: await confirmJwtService.generate(payload)
                    }
                });

                const next = async () => {
                    await userController.changePassword(context, defaultNext);
                };

                await validationMiddleware.validate(userSchema.schemas.changePassword)(
                    context,
                    next
                );

                const status = context.status;

                assert(status === STATUS.UNAUTHORIZED);
            });
        });

        describe('save error', () => {
            before(() => {
                sinon.stub(userService, 'findUser').resolves({
                    email: testEmail,
                    password: hashedTestPassword,
                    id: 1,
                    save: () => Promise.reject(true)
                });
            });

            it('should throw a 500 status', async () => {
                const context = new Context({
                    body: {
                        email: testEmail,
                        password: testPassword
                    }
                });

                await validationMiddleware.validate(userSchema.schemas.changePassword)(
                    context,
                    async () => {
                        await userController.changePassword(context, () => {
                            const status = context.status;

                            assert(status === STATUS.INTERNAL_ERROR);
                        });
                    }
                );
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('wrong input', () => {
            it('should throw a 400 error', async () => {
                const context = new Context({
                    body: {}
                });

                await validationMiddleware.validate(
                    userSchema.schemas.changePassword
                )(context);

                assert(context.status === STATUS.BAD_REQUEST);
                assert(context.body instanceof ControllerError);
            });
        });
    });

    describe('confirm route', () => {
        describe('happy path', () => {
            before(() => {
                sinon.stub(userService, 'findUser').resolves({
                    active: true,
                    email: testEmail,
                    password: hashedTestPassword,
                    _id: 1,
                    toJSON: () => ({
                        email: testEmail,
                        password: hashedTestPassword,
                        _id: 1
                    }),
                    save: () => Promise.resolve(true)
                });
            });

            it('should return user with id 1', async () => {
                const context = new Context({
                    query: {
                        token: await confirmJwtService.generate()
                    }
                });

                const next = async () => {
                    await userController.confirm(context, defaultNext);
                };

                await validationMiddleware.validate(userSchema.schemas.confirm)(
                    context,
                    next
                );

                const { status } = context;

                assert(status === STATUS.OK);
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('invalid customer', () => {
            before(() => {
                sinon.stub(userService, 'findUser').resolves(null);
            });

            it('should throw a 404 error', async () => {
                const context = new Context({
                    query: {
                        token: await confirmJwtService.generate()
                    }
                });

                const next = async () => {
                    await userController.confirm(context, defaultNext);
                };

                await validationMiddleware.validate(userSchema.schemas.confirm)(
                    context,
                    next
                );

                const status = context.status;

                assert(status === STATUS.NOT_FOUND);
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('invalid token', () => {
            it('should throw a 401 error', async () => {
                const context = new Context({
                    query: {
                        token: await authJwtService.generate()
                    }
                });

                const next = async () => {
                    await userController.confirm(context, defaultNext);
                };

                await validationMiddleware.validate(userSchema.schemas.confirm)(
                    context,
                    next
                );

                const status = context.status;

                assert(status === STATUS.UNAUTHORIZED);
            });
        });

        describe('wrong input', () => {
            it('should throw a 400 error', async () => {
                const context = new Context({
                    query: {}
                });

                await validationMiddleware.validate(
                    userSchema.schemas.confirm
                )(context);

                assert(context.status === STATUS.BAD_REQUEST);
                assert(context.body instanceof ControllerError);
            });
        });
    });

    describe('register route', () => {
        describe('happy path', () => {
            before(() => {
                sinon.stub(userService, 'findUser').resolves(null);
                sinon.stub(userService, 'create').resolves({
                    active: true,
                    email: testEmail,
                    password: hashedTestPassword,
                    id: 1,
                    address: {},
                    save: () => Promise.resolve(true)
                });
                sinon.stub(mailService, 'sendMail').resolves(true);
            });

            it('should return user with id 1', async () => {
                const context = new Context({
                    body: testRegister
                });
                const next = async () => {
                    await userController.register(context, defaultNext);
                };

                await validationMiddleware.validate(userSchema.schemas.register)(
                    context,
                    next
                );

                const { status } = context;

                assert(status === STATUS.OK);
            });

            after(() => {
                userService.findUser.restore();
                userService.create.restore();
                mailService.sendMail.restore();
            });
        });

        describe('customer already exists', () => {
            before(() => {
                sinon.stub(userService, 'findUser').resolves({});
            });

            it('should throw a 400 error', async () => {
                const context = new Context({
                    body: testRegister
                });

                const next = async () => {
                    await userController.register(context, defaultNext);
                };

                await validationMiddleware.validate(userSchema.schemas.register)(
                    context,
                    next
                );

                const status = context.status;

                assert(status === STATUS.BAD_REQUEST);
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('save error', () => {
            before(() => {
                sinon.stub(userService, 'findUser').resolves(null);
                sinon.stub(userService, 'create').resolves({
                    email: testEmail,
                    password: hashedTestPassword,
                    id: 1,
                    address: {},
                    save: () => Promise.reject(false)
                });
            });

            it('should throw a 500', async () => {
                const context = new Context({
                    body: testRegister
                });

                const next = async () => {
                    await userController.register(context, defaultNext);
                };

                await validationMiddleware.validate(userSchema.schemas.register)(context, next);

                const status = context.status;

                assert(status === STATUS.INTERNAL_ERROR);
            });

            after(() => {
                userService.findUser.restore();
                userService.create.restore();
            });
        });

        describe('send email error', () => {
            before(() => {
                sinon.stub(userService, 'findUser').resolves(null);
                sinon.stub(userService, 'create').resolves({
                    active: true,
                    email: testEmail,
                    password: hashedTestPassword,
                    id: 1,
                    address: {},
                    save: () => Promise.resolve(true)
                });
                sinon.stub(mailService, 'sendMail').rejects(false);
            });

            it('should throw a 500', async () => {
                const context = new Context({
                    body: testRegister
                });

                const next = async () => {
                    await userController.register(context, defaultNext);
                };

                await validationMiddleware.validate(userSchema.schemas.register)(
                    context,
                    next
                );

                const status = context.status;

                assert(status === STATUS.INTERNAL_ERROR);
            });

            after(() => {
                userService.findUser.restore();
                userService.create.restore();
                mailService.sendMail.restore();
            });
        });

        describe('wrong input', () => {
            it('should throw a 400 error', async () => {
                const context = new Context({
                    body: {}
                });

                await validationMiddleware.validate(
                    userSchema.schemas.register
                )(context);

                assert(context.status === STATUS.BAD_REQUEST);
                assert(context.body instanceof ControllerError);
            });
        });
    });
});