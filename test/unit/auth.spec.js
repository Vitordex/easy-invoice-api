/*globals describe, it, before, after*/
const assert = require('assert');
const sinon = require('sinon');

const config = require('../../src/services/config.service');

const MailService = require('../../src/services/mail.service');
const HashingService = require('../../src/services/hashing.service');

const ValidationMiddleware = require('../../src/middleware/validation.middleware');

const UserService = require('../../src/user/user.service');
const AuthController = require('../../src/auth/auth.controller');
const AuthSchema = require('../../src/auth/auth.schema');

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
/**@type {AuthController} */
let authController;
/**@type {AuthSchema} */
let authSchema;

describe('Auth component', () => {
    const source = 'auth.controller';

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
    authSchema = new AuthSchema(validationMiddleware.baseSchema);

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

    authController = new AuthController({
        authConfigs,
        authHash: hashKey,
        userService,
        mailService,
        authJwtService,
        confirmJwtService,
        resetJwtService
    });

    describe('login route', () => {
        const functionName = 'login';

        describe('happy path', () => {
            const returnedStatus = STATUS.OK;
            const context = new Context({
                body: {
                    email: testEmail,
                    password: testPassword
                }
            });

            before(async () => {
                const successUser = {
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
                };
                sinon.stub(userService, 'findUser').resolves(successUser);

                const next = async () => {
                    await authController.login(context, defaultNext);
                };

                await validationMiddleware.validate(authSchema.schemas.login)(
                    context,
                    next
                );
            });

            it('should return auth with id 1', async () => {
                const { body } = context;

                assert(body && body._id === 1);
            });

            it('should have a valid token', async () => {
                const headers = context.header;
                const jwt = await authJwtService.generate({ id: 1 });

                assert(headers[AUTH.TOKEN_HEADER] === jwt);
            });

            it(`should return status ${returnedStatus}`, () => {
                const { status } = context;

                assert(status === returnedStatus);
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('invalid customer', () => {
            const returnedStatus = STATUS.NOT_FOUND;
            const context = new Context({
                body: {
                    email: testEmail,
                    password: testPassword
                }
            });

            before(async () => {
                sinon.stub(userService, 'findUser').resolves(null);

                const next = async () => {
                    await authController.login(context, defaultNext);
                };

                await validationMiddleware.validate(authSchema.schemas.login)(
                    context,
                    next
                );
            });

            it(`should throw a ${returnedStatus} error`, async () => {
                const { status } = context;

                assert(status === returnedStatus);
            });

            describe('context body', () => {
                it('should have property method', () => {
                    const { method } = context.body;

                    assert(!!method);
                });

                it(`method should equal ${functionName}`, () => {
                    const { method } = context.body;

                    assert(method === functionName);
                });

                it('should have property controller', () => {
                    const { controller } = context.body;

                    assert(!!controller);
                });

                it(`controller should equal ${source}`, () => {
                    const { controller } = context.body;

                    assert(controller === source);
                });

                it('should have property output', () => {
                    const { output } = context.body;

                    assert(!!output);
                });

                it('controller should equal not found', () => {
                    const { output } = context.body;

                    assert(output === 'User not found');
                });
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('wrong password', () => {
            const returnedStatus = STATUS.NOT_FOUND;
            const context = new Context({
                body: {
                    email: testEmail,
                    password: 'teste45'
                }
            });

            before(async () => {
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

                const next = async () => {
                    await authController.login(context, defaultNext);
                };

                await validationMiddleware.validate(authSchema.schemas.login)(
                    context,
                    next
                );
            });

            it(`should throw a ${returnedStatus} error`, async () => {
                const { status } = context;

                assert(status === returnedStatus);
            });

            describe('context body', () => {
                it('should have property method', () => {
                    const { method } = context.body;

                    assert(!!method);
                });

                it(`method should equal ${functionName}`, () => {
                    const { method } = context.body;

                    assert(method === functionName);
                });

                it('should have property controller', () => {
                    const { controller } = context.body;

                    assert(!!controller);
                });

                it(`controller should equal ${source}`, () => {
                    const { controller } = context.body;

                    assert(controller === source);
                });

                it('should have property output', () => {
                    const { output } = context.body;

                    assert(!!output);
                });

                it('controller should equal not found', () => {
                    const { output } = context.body;

                    assert(output === 'User not found');
                });
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('wrong input', () => {
            const returnedStatus = STATUS.BAD_REQUEST;
            const context = new Context({
                body: {}
            });

            before(async () => {
                await validationMiddleware.validate(
                    authSchema.schemas.login
                )(context);
            });

            it(`should throw a ${returnedStatus} error`, async () => {
                assert(context.status === returnedStatus);
            });

            it('should throw a Controller Error', () => {
                assert(context.body instanceof ControllerError);
            });
        });
    });

    describe('recover route', () => {
        const functionName = 'recover';

        describe('happy path', () => {
            const returnedStatus = STATUS.OK;
            const context = new Context({
                body: {
                    email: testEmail
                },
                origin: 'localhost'
            });

            before(async () => {
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
                const next = async () => {
                    await authController.recover(context, defaultNext);
                };

                await validationMiddleware.validate(authSchema.schemas.recover)(
                    context,
                    next
                );
            });

            it('should return status 200', async () => {
                assert(context.status === returnedStatus);
            });

            it('should contain a valid token on email call', async () => {
                const payload = {
                    id: 1,
                    email: testEmail
                };
                const jwt = await resetJwtService.generate(payload);

                const url = `localhost/auth/reset/password?token=${jwt}`;

                assert(mailService.sendMail.getCall(0).args[3].includes(url));
            });

            after(() => {
                userService.findUser.restore();
                mailService.sendMail.restore();
            });
        });

        describe('invalid customer', () => {
            const returnedStatus = STATUS.NOT_FOUND;
            const context = new Context({
                body: {
                    email: testEmail
                }
            });

            before(async () => {
                sinon.stub(userService, 'findUser').resolves(null);

                const next = async () => {
                    await authController.recover(context, defaultNext);
                };

                await validationMiddleware.validate(authSchema.schemas.recover)(
                    context,
                    next
                );
            });

            it(`should throw a ${returnedStatus} error`, async () => {
                const status = context.status;

                assert(status === returnedStatus);
            });

            describe('context body', () => {
                it('should have property method', () => {
                    const { method } = context.body;

                    assert(!!method);
                });

                it(`method should equal ${functionName}`, () => {
                    const { method } = context.body;

                    assert(method === functionName);
                });

                it('should have property controller', () => {
                    const { controller } = context.body;

                    assert(!!controller);
                });

                it(`controller should equal ${source}`, () => {
                    const { controller } = context.body;

                    assert(controller === source);
                });

                it('should have property output', () => {
                    const { output } = context.body;

                    assert(!!output);
                });

                it('controller should equal not found', () => {
                    const { output } = context.body;

                    assert(output === 'User not found');
                });
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('invalid email', () => {
            const returnedStatus = STATUS.BAD_REQUEST;
            const context = new Context({
                body: {
                    email: testEmail
                }
            });

            before(async () => {
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

                const next = async () => {
                    await authController.recover(context, defaultNext);
                };

                await validationMiddleware.validate(authSchema.schemas.recover)(
                    context,
                    next
                );
            });

            it(`should throw a ${returnedStatus} error`, async () => {
                const status = context.status;

                assert(status === returnedStatus);
            });

            describe('context body', () => {
                it('should have property method', () => {
                    const { method } = context.body;

                    assert(!!method);
                });

                it(`method should equal ${functionName}`, () => {
                    const { method } = context.body;

                    assert(method === functionName);
                });

                it('should have property controller', () => {
                    const { controller } = context.body;

                    assert(!!controller);
                });

                it(`controller should equal ${source}`, () => {
                    const { controller } = context.body;

                    assert(controller === source);
                });

                it('should have property output', () => {
                    const { output } = context.body;

                    assert(!!output);
                });
            });

            after(() => {
                userService.findUser.restore();
                mailService.sendMail.restore();
            });
        });

        describe('wrong input', () => {
            const returnedStatus = STATUS.BAD_REQUEST;
            const context = new Context({
                body: {}
            });

            before(async () => {
                await validationMiddleware.validate(
                    authSchema.schemas.recover
                )(context);
            });

            it(`should throw a ${returnedStatus} error`, async () => {
                assert(context.status === returnedStatus);
            });

            it('should throw a Controller Error', () => {
                assert(context.body instanceof ControllerError);
            });
        });
    });

    describe('changePassword route', () => {
        const functionName = 'changePassword';

        describe('happy path', () => {
            const returnedStatus = STATUS.OK;
            const context = new Context({
                body: {
                    password: testPassword
                }
            });

            before(async () => {
                sinon.stub(userService, 'findUser').resolves({
                    email: testEmail,
                    password: hashedTestPassword,
                    id: 1,
                    save: () => Promise.resolve(true)
                });

                const payload = {
                    id: 1,
                    email: testEmail
                };

                context.request.headers = {
                    [AUTH.TOKEN_HEADER]: await resetJwtService.generate(payload)
                };

                const next = async () => {
                    await authController.changePassword(context, defaultNext);
                };

                await validationMiddleware.validate(authSchema.schemas.changePassword)(
                    context,
                    next
                );
            });

            it('should return status 200', async () => {
                const { status } = context;

                assert(status === returnedStatus);
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('invalid token', () => {
            const returnedStatus = STATUS.UNAUTHORIZED;
            const context = new Context({
                body: {
                    password: testPassword
                }
            });

            before(async () => {
                const payload = {
                    id: 1,
                    email: testEmail
                };

                context.request.headers = {
                    [AUTH.TOKEN_HEADER]: await confirmJwtService.generate(payload)
                };

                const next = async () => {
                    await authController.changePassword(context, defaultNext);
                };

                await validationMiddleware.validate(authSchema.schemas.changePassword)(
                    context,
                    next
                );
            });

            it(`should throw a ${returnedStatus} error`, async () => {
                const status = context.status;

                assert(status === returnedStatus);
            });

            describe('context body', () => {
                it('should have property method', () => {
                    const { method } = context.body;

                    assert(!!method);
                });

                it(`method should equal ${functionName}`, () => {
                    const { method } = context.body;

                    assert(method === functionName);
                });

                it('should have property controller', () => {
                    const { controller } = context.body;

                    assert(!!controller);
                });

                it(`controller should equal ${source}`, () => {
                    const { controller } = context.body;

                    assert(controller === source);
                });

                it('should have property output', () => {
                    const { output } = context.body;

                    assert(!!output);
                });
            });
        });

        describe('save error', () => {
            const returnedStatus = STATUS.INTERNAL_ERROR;
            const context = new Context({
                body: {
                    password: testPassword
                }
            });

            before(async () => {
                sinon.stub(userService, 'findUser').resolves({
                    email: testEmail,
                    password: hashedTestPassword,
                    id: 1,
                    save: () => Promise.reject(true)
                });

                const payload = {
                    id: 1,
                    email: testEmail
                };

                context.request.headers = {
                    [AUTH.TOKEN_HEADER]: await resetJwtService.generate(payload)
                };

                const next = async () => {
                    await authController.changePassword(context, defaultNext);
                };

                await validationMiddleware.validate(authSchema.schemas.changePassword)(
                    context,
                    next
                );
            });

            it(`should throw a ${returnedStatus} status`, async () => {
                const { status } = context;

                assert(status === returnedStatus);
            });

            describe('context body', () => {
                it('should have property method', () => {
                    const { method } = context.body;

                    assert(!!method);
                });

                it(`method should equal ${functionName}`, () => {
                    const { method } = context.body;

                    assert(method === functionName);
                });

                it('should have property controller', () => {
                    const { controller } = context.body;

                    assert(!!controller);
                });

                it(`controller should equal ${source}`, () => {
                    const { controller } = context.body;

                    assert(controller === source);
                });

                it('should have property output', () => {
                    const { output } = context.body;

                    assert(!!output);
                });
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('wrong input', () => {
            const returnedStatus = STATUS.BAD_REQUEST;
            const context = new Context({
                body: {}
            });

            before(async () => {
                await validationMiddleware.validate(
                    authSchema.schemas.changePassword
                )(context);
            });

            it(`should throw a ${returnedStatus} error`, async () => {
                assert(context.status === returnedStatus);
            });

            it('should throw a Controller Error', () => {
                assert(context.body instanceof ControllerError);
            });
        });
    });

    describe('confirm route', () => {
        const functionName = 'confirm';
        const returnedStatus = STATUS.OK;

        describe('happy path', () => {
            const context = new Context({});

            before(async () => {
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

                context.request.query = {
                    token: await confirmJwtService.generate()
                };

                const next = async () => {
                    await authController.confirm(context, defaultNext);
                };

                await validationMiddleware.validate(authSchema.schemas.confirm)(
                    context,
                    next
                );
            });

            it(`should return a status of ${returnedStatus}`, async () => {
                const { status } = context;

                assert(status === returnedStatus);
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('invalid customer', () => {
            const returnedStatus = STATUS.NOT_FOUND;
            const context = new Context({});

            before(async () => {
                sinon.stub(userService, 'findUser').resolves(null);

                context.request.query = {
                    token: await confirmJwtService.generate()
                };

                const next = async () => {
                    await authController.confirm(context, defaultNext);
                };

                await validationMiddleware.validate(authSchema.schemas.confirm)(
                    context,
                    next
                );
            });

            it(`should throw a ${returnedStatus} error`, async () => {
                const status = context.status;

                assert(status === returnedStatus);
            });

            describe('context body', () => {
                it('should have property method', () => {
                    const { method } = context.body;

                    assert(!!method);
                });

                it(`method should equal ${functionName}`, () => {
                    const { method } = context.body;

                    assert(method === functionName);
                });

                it('should have property controller', () => {
                    const { controller } = context.body;

                    assert(!!controller);
                });

                it(`controller should equal ${source}`, () => {
                    const { controller } = context.body;

                    assert(controller === source);
                });

                it('should have property output', () => {
                    const { output } = context.body;

                    assert(!!output);
                });
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('invalid token', () => {
            const returnedStatus = STATUS.UNAUTHORIZED;
            const context = new Context({});

            before(async () => {
                context.request.query = {
                    token: await authJwtService.generate()
                };

                const next = async () => {
                    await authController.confirm(context, defaultNext);
                };

                await validationMiddleware.validate(authSchema.schemas.confirm)(
                    context,
                    next
                );
            });

            it(`should throw a ${returnedStatus} error`, async () => {
                const status = context.status;

                assert(status === returnedStatus);
            });

            describe('context body', () => {
                it('should have property method', () => {
                    const { method } = context.body;

                    assert(!!method);
                });

                it(`method should equal ${functionName}`, () => {
                    const { method } = context.body;

                    assert(method === functionName);
                });

                it('should have property controller', () => {
                    const { controller } = context.body;

                    assert(!!controller);
                });

                it(`controller should equal ${source}`, () => {
                    const { controller } = context.body;

                    assert(controller === source);
                });

                it('should have property output', () => {
                    const { output } = context.body;

                    assert(!!output);
                });
            });
        });

        describe('wrong input', () => {
            const returnedStatus = STATUS.BAD_REQUEST;
            const context = new Context({
                body: {}
            });

            before(async () => {
                await validationMiddleware.validate(
                    authSchema.schemas.confirm
                )(context);
            });

            it(`should throw a ${returnedStatus} error`, async () => {
                assert(context.status === returnedStatus);
            });

            it('should throw a Controller Error', () => {
                assert(context.body instanceof ControllerError);
            });
        });
    });

    describe('register route', () => {
        const functionName = 'register';

        describe('happy path', () => {
            const returnedStatus = STATUS.OK;
            const context = new Context({
                body: testRegister
            });

            before(async () => {
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

                const next = async () => {
                    await authController.register(context, defaultNext);
                };

                await validationMiddleware.validate(authSchema.schemas.register)(
                    context,
                    next
                );
            });

            it(`should return a status of ${returnedStatus}`, async () => {
                const { status } = context;

                assert(status === returnedStatus);
            });

            after(() => {
                userService.findUser.restore();
                userService.create.restore();
                mailService.sendMail.restore();
            });
        });

        describe('customer already exists', () => {
            const returnedStatus = STATUS.BAD_REQUEST;
            const context = new Context({
                body: testRegister
            });

            before(async () => {
                sinon.stub(userService, 'findUser').resolves({});

                const next = async () => {
                    await authController.register(context, defaultNext);
                };

                await validationMiddleware.validate(authSchema.schemas.register)(
                    context,
                    next
                );


            });

            it(`should throw a ${returnedStatus} error`, async () => {
                const status = context.status;
                assert(status === returnedStatus);
            });

            describe('context body', () => {
                it('should have property method', () => {
                    const { method } = context.body;

                    assert(!!method);
                });

                it(`method should equal ${functionName}`, () => {
                    const { method } = context.body;

                    assert(method === functionName);
                });

                it('should have property controller', () => {
                    const { controller } = context.body;

                    assert(!!controller);
                });

                it(`controller should equal ${source}`, () => {
                    const { controller } = context.body;

                    assert(controller === source);
                });

                it('should have property output', () => {
                    const { output } = context.body;

                    assert(!!output);
                });
            });

            after(() => {
                userService.findUser.restore();
            });
        });

        describe('save error', () => {
            const returnedStatus = STATUS.INTERNAL_ERROR;
            const context = new Context({
                body: testRegister
            });

            before(async () => {
                sinon.stub(userService, 'findUser').resolves(null);
                sinon.stub(userService, 'create').resolves({
                    email: testEmail,
                    password: hashedTestPassword,
                    id: 1,
                    address: {},
                    save: () => Promise.reject(false)
                });

                const next = async () => {
                    await authController.register(context, defaultNext);
                };

                await validationMiddleware.validate(authSchema.schemas.register)(context, next);
            });

            it(`should throw a ${returnedStatus}`, async () => {
                const status = context.status;

                assert(status === returnedStatus);
            });

            describe('context body', () => {
                it('should have property method', () => {
                    const { method } = context.body;

                    assert(!!method);
                });

                it(`method should equal ${functionName}`, () => {
                    const { method } = context.body;

                    assert(method === functionName);
                });

                it('should have property controller', () => {
                    const { controller } = context.body;

                    assert(!!controller);
                });

                it(`controller should equal ${source}`, () => {
                    const { controller } = context.body;

                    assert(controller === source);
                });

                it('should have property output', () => {
                    const { output } = context.body;

                    assert(output === false);
                });
            });

            after(() => {
                userService.findUser.restore();
                userService.create.restore();
            });
        });

        describe('send email error', () => {
            const returnedStatus = STATUS.INTERNAL_ERROR;
            const context = new Context({
                body: testRegister
            });

            before(async () => {
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

                const next = async () => {
                    await authController.register(context, defaultNext);
                };

                await validationMiddleware.validate(authSchema.schemas.register)(
                    context,
                    next
                );
            });

            it(`should throw a ${returnedStatus}`, async () => {
                const status = context.status;

                assert(status === returnedStatus);
            });

            describe('context body', () => {
                it('should have property method', () => {
                    const { method } = context.body;

                    assert(!!method);
                });

                it(`method should equal ${functionName}`, () => {
                    const { method } = context.body;

                    assert(method === functionName);
                });

                it('should have property controller', () => {
                    const { controller } = context.body;

                    assert(!!controller);
                });

                it(`controller should equal ${source}`, () => {
                    const { controller } = context.body;

                    assert(controller === source);
                });

                it('should have property output', () => {
                    const { output } = context.body;

                    assert(!!output);
                });
            });

            after(() => {
                userService.findUser.restore();
                userService.create.restore();
                mailService.sendMail.restore();
            });
        });

        describe('wrong input', () => {
            const returnedStatus = STATUS.BAD_REQUEST;
            const context = new Context({
                body: {}
            });

            before(async () => {
                await validationMiddleware.validate(
                    authSchema.schemas.register
                )(context);
            });

            it(`should throw a ${returnedStatus} error`, async () => {
                assert(context.status === returnedStatus);
            });

            it('should throw a Controller Error', () => {
                assert(context.body instanceof ControllerError);
            });
        });
    });
});