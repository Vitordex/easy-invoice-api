/*globals describe, it, before, after*/
const assert = require('assert');
const sinon = require('sinon');

const config = require('../../src/services/config.service');

const MailService = require('../../src/services/mail.service');
const HashingService = require('../../src/services/hashing.service');

const ValidationMiddleware = require('../../src/services/validation.middleware');

const UserService = require('../../src/user/user.service');
const UserController = require('../../src/user/user.controller');
const UserSchema = require('../../src/user/user.schema');

const JwtToken = require('../../src/user/jwt.model');
const Context = require('./context.model');

const fs = require('fs');
const hashKey = fs.readFileSync('./server.hash.key', { encoding: 'utf-8' });

const authConfigs = config.get('auth');

const authOptionals = authConfigs.optionals;

const hashingOptions = authConfigs.password;

let mailService;
let hashingService;
let validationMiddleware;
let userModel;
let userService;
let userController;
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

    validationMiddleware = new ValidationMiddleware();
    userSchema = new UserSchema(validationMiddleware.baseSchema);

    mailService = new MailService(config.get('mail.options'));

    userService = new UserService(userModel, hashingService);

    userController = new UserController({
        authConfigs,
        authHash: hashKey,
        userService,
        mailService
    });

    describe('login route', () => {
        describe('happy path', () => {
            before(() => {
                sinon.stub(userService, 'findUser').resolves({
                    email: testEmail,
                    password: hashedTestPassword,
                    id: 1,
                    toJSON: () => ({
                        email: testEmail,
                        password: hashedTestPassword,
                        id: 1
                    })
                });
            });

            it('should return user with id 1', async () => {
                const context = new Context({
                    body: {
                        email: testEmail,
                        password: testPassword
                    }
                });

                await validationMiddleware.validate(userSchema.schemas.login)(
                    context,
                    async () => {
                        await userController.login(context, async () => {
                            const responseBody = context.body;
                            const jwt = await new JwtToken({ id: 1 }, hashKey, authOptionals).hash();

                            assert(responseBody.user && responseBody.user.id === 1);
                            assert(responseBody.token === jwt);
                        });
                    }
                );
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

                await validationMiddleware.validate(userSchema.schemas.login)(
                    context,
                    async () => {
                        await userController.login(context, () => {
                            const status = context.status;

                            assert(status === 404);
                        });
                    }
                );
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

            it('should throw a 401 error', async () => {
                const context = new Context({
                    body: {
                        email: testEmail,
                        password: 'teste45'
                    }
                });

                await validationMiddleware.validate(userSchema.schemas.login)(
                    context,
                    async () => {
                        await userController.login(context, () => {
                            const status = context.status;

                            assert(status === 401);
                        });
                    }
                );
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('wrong input', () => {
            it('should throw a 404 error', async () => {
                const context = new Context({
                    body: {}
                });

                await validationMiddleware.validate(
                    userSchema.schemas.login
                )(context);

                assert(context.status === 400);
                assert(context.body instanceof Array);
            });
        });
    });

    describe('verify route', () => {
        describe('happy path', () => {
            before(() => {
                sinon.stub(userService, 'findUser').resolves({
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
                        email: testEmail,
                        password: testPassword
                    },
                    origin: 'localhost'
                });

                await validationMiddleware.validate(userSchema.schemas.verify)(
                    context,
                    async () => {
                        await userController.verify(context, async () => {
                            const jwt = await new JwtToken({
                                id: 1,
                                email: testEmail
                            }, hashKey, authOptionals).hash();
                            const url = `localhost/users/reset/password?token=${jwt}`;

                            assert(mailService.sendMail.getCall(0).args[3].includes(url));
                            assert(context.status === 200);
                        });
                    }
                );
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

                await validationMiddleware.validate(userSchema.schemas.verify)(
                    context,
                    async () => {
                        await userController.verify(context, () => {
                            const status = context.status;

                            assert(status === 404);
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

                await validationMiddleware.validate(userSchema.schemas.verify)(
                    context,
                    async () => {
                        await userController.verify(context, () => {
                            const status = context.status;

                            assert(status === 400);
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
            it('should throw a 404 error', async () => {
                const context = new Context({
                    body: {}
                });

                await validationMiddleware.validate(
                    userSchema.schemas.verify
                )(context);

                assert(context.status === 400);
                assert(context.body instanceof Array);
            });
        });
    });

    describe('reset password route', () => {
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
                const context = new Context({
                    body: {
                        password: testPassword
                    },
                    query: {
                        token: await new JwtToken({
                            id: 1,
                            email: testEmail
                        }, hashKey, authOptionals).hash()
                    }
                });

                await validationMiddleware.validate(userSchema.schemas.recover)(
                    context,
                    async () => {
                        await userController.recover(context, async () => {
                            assert(context.status === 200);
                        });
                    }
                );
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('invalid token', () => {
            it('should throw a 401 error', async () => {
                const context = new Context({
                    body: {
                        password: testPassword
                    },
                    query: {
                        token: await new JwtToken({
                            id: 1,
                            email: testEmail
                        }, 'test', authOptionals).hash()
                    }
                });

                await validationMiddleware.validate(userSchema.schemas.recover)(
                    context,
                    async () => {
                        await userController.recover(context, () => {
                            const status = context.status;

                            assert(status === 401);
                        });
                    }
                );
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

                await validationMiddleware.validate(userSchema.schemas.recover)(
                    context,
                    async () => {
                        await userController.recover(context, () => {
                            const status = context.status;

                            assert(status === 500);
                        });
                    }
                );
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('wrong input', () => {
            it('should throw a 404 error', async () => {
                const context = new Context({
                    body: {}
                });

                await validationMiddleware.validate(
                    userSchema.schemas.recover
                )(context);

                assert(context.status === 400);
                assert(context.body instanceof Array);
            });
        });
    });
});