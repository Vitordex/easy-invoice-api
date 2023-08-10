/*globals describe, it, before, after*/
const sinon = require('sinon');
const assert = require('assert');
const fs = require('fs');

const {
    auth: { JwtService },
    database: { ObjectId },
    enums: { AUTH, API: { STATUS } },
    log: {ControllerError},
    middleware: {Validation: ValidationMiddleware},
    services: {MailService, HashingService, ConfigService: config},
    user: {UserSchema, UserService, UserController},
    invoice: {InvoiceService},
    customer: {CustomerService}
} = require('../../src/');
const Context = require('./context.model');

const authConfigs = config.get('auth');
const hashingOptions = authConfigs.password;

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
/**@type {InvoiceService} */
let invoiceService;
/**@type {CustomerService} */
let customerService;

describe('Users component', () => {
    const log = {
        info: () => {},
        error: () => {}
    };
    const logger = {
        child: () => log
    };

    const source = 'user.controller';

    hashingService = new HashingService(
        hashingOptions.key,
        hashingOptions.algorithm,
        hashingOptions.encoding,
        logger
    );

    validationMiddleware = new ValidationMiddleware();
    userSchema = new UserSchema(validationMiddleware.baseSchema);

    mailService = new MailService(config.get('mail.options'), logger);

    userService = new UserService(userModel, hashingService, logger);
    invoiceService = new InvoiceService({}, logger);
    customerService = new CustomerService({}, logger);

    const authConfigs = config.get('auth');

    const authTokenExpiration = authConfigs.token.expiration;
    const hashKey = fs.readFileSync('./server.hash.key', { encoding: 'utf-8' });
    const authJwtOptions = {
        hash: hashKey,
        tokenExpiration: authTokenExpiration,
        subject: AUTH.AUTH_SUBJECT,
        logger
    };
    const jwtService = new JwtService(authJwtOptions);

    userController = new UserController({
        authConfigs,
        authHash: hashKey,
        userService,
        invoiceService,
        customerService,
        mailService
    });

    const generatedUserId = new ObjectId().toHex();
    const validUserJSON = {
        _id: generatedUserId,
        id: generatedUserId,
        name: 'Testando teste',
        email: 'teste@teste.com'
    };

    const validToJSON = () => validUserJSON;
    const validUserObject = {
        ...validUserJSON,
        toJSON: validToJSON,
        save: () => Promise.resolve(true),
        updateWithDates: () => Promise.resolve(true)
    };

    const defaultNext = () => { };

    describe('update user route', () => {
        const functionName = 'patchUser';
        const email = 'teste@email.com';
        const password = '@Teste54';
        const putValidUserInput = {
            email: email,
            password: password
        };

        /**@type {Context} */
        let context;

        describe('Happy path', () => {
            const returnedStatus = STATUS.OK;
            const successUser = { ...putValidUserInput };

            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    },
                    body: successUser
                };
                const state = {
                    user: validUserObject
                };
                context = new Context(request, {}, state);

                const next = async () => {
                    await userController.patchUser(context, defaultNext);
                };

                await validationMiddleware
                    .validate(userSchema.schemas.patchUser)(
                        context,
                        next
                    );
            });

            it(`should return status ${returnedStatus}`, () => {
                const { status } = context;

                assert(status === returnedStatus);
            });

            it('should return an empty body', () => {
                const { body } = context;

                assert(!body);
            });

            it('password should be hashed', async () => {
                const hashed = await userService.hashPassword(password);

                assert(successUser.password === hashed);
            });
        });

        describe('save error', () => {
            const returnedStatus = STATUS.INTERNAL_ERROR;
            const errorUpdateUser = {
                updateWithDates: () => Promise.reject()
            };

            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    },
                    body: { ...putValidUserInput }
                };

                const state = {
                    user: errorUpdateUser
                };
                context = new Context(request, {}, state);

                const next = async () => {
                    await userController.patchUser(context, defaultNext);
                };

                await validationMiddleware
                    .validate(userSchema.schemas.patchUser)(
                        context,
                        next
                    );
            });

            it(`should throw a ${returnedStatus} status`, async () => {
                const { status } = context;

                assert(status === returnedStatus);
            });

            it('should return a Controller Error', () => {
                const { body } = context;

                assert(body instanceof ControllerError);
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

            describe('no token in headers', () => {
                before(async () => {
                    context = new Context({
                        headers: {}
                    });

                    await validationMiddleware.validate(
                        userSchema.schemas.patchUser
                    )(context);
                });

                it(`should throw a ${returnedStatus} error`, async () => {
                    assert(context.status === returnedStatus);
                });

                it('should have property required for token header', async () => {
                    const { body } = context;

                    assert(body.output.find(
                        (error) => error.type === 'any.required')
                    );
                });
            });

            describe('invalid token in headers', () => {
                before(async () => {
                    context = new Context({
                        headers: {
                            [AUTH.TOKEN_HEADER]: ''
                        }
                    });

                    await validationMiddleware.validate(
                        userSchema.schemas.patchUser
                    )(context);
                });

                it(`should throw a ${returnedStatus} error`, async () => {
                    assert(context.status === returnedStatus);
                });

                it('should have property required for token header', async () => {
                    const { body } = context;

                    assert(body.output.find(
                        (error) => error.type === 'any.empty')
                    );
                });
            });

            describe('no body', () => {
                before(async () => {
                    context = new Context({
                        headers: {}
                    });

                    await validationMiddleware.validate(
                        userSchema.schemas.patchUser
                    )(context);
                });

                it(`should throw a ${returnedStatus} error`, async () => {
                    assert(context.status === returnedStatus);
                });

                it('should have property required for token header', async () => {
                    const { body } = context;

                    assert(body.output.find(
                        (error) =>
                            error.type === 'any.required' &&
                            error.key === 'body'
                    ));
                });
            });
        });
    });

    describe('delete user route', () => {
        const functionName = 'deleteUser';

        /**@type {Context} */
        let context;

        describe('Happy path', () => {
            const returnedStatus = STATUS.OK;

            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    }
                };
                const state = {
                    user: validUserObject
                };
                context = new Context(request, {}, state);

                sinon.stub(invoiceService, 'deleteInvoices')
                    .resolves(true);
                sinon.stub(customerService, 'deleteCustomers')
                    .resolves(true);

                const next = async () => {
                    await userController.deleteUser(context, defaultNext);
                };

                await validationMiddleware
                    .validate(userSchema.schemas.deleteUser)(
                        context,
                        next
                    );
            });

            it(`should return status ${returnedStatus}`, () => {
                const { status } = context;

                assert(status === returnedStatus);
            });

            it('should return an empty body', () => {
                const { body } = context;

                assert(!body);
            });

            after(() => {
                invoiceService.deleteInvoices.restore();
                customerService.deleteCustomers.restore();
            });
        });

        describe('save error', () => {
            const returnedStatus = STATUS.INTERNAL_ERROR;
            const errorUpdateUser = {
                updateWithDates: () => Promise.reject()
            };

            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    }
                };

                const state = {
                    user: errorUpdateUser
                };
                context = new Context(request, {}, state);

                sinon.stub(invoiceService, 'deleteInvoices')
                    .resolves(true);
                sinon.stub(customerService, 'deleteCustomers')
                    .resolves(true);

                const next = async () => {
                    await userController.deleteUser(context, defaultNext);
                };

                await validationMiddleware
                    .validate(userSchema.schemas.deleteUser)(
                        context,
                        next
                    );
            });

            it(`should throw a ${returnedStatus} status`, async () => {
                const { status } = context;

                assert(status === returnedStatus);
            });

            it('should return a Controller Error', () => {
                const { body } = context;

                assert(body instanceof ControllerError);
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
                invoiceService.deleteInvoices.restore();
                customerService.deleteCustomers.restore();
            });
        });

        describe('wrong input', () => {
            const returnedStatus = STATUS.BAD_REQUEST;

            describe('no token in headers', () => {
                before(async () => {
                    context = new Context({
                        headers: {}
                    });

                    await validationMiddleware.validate(
                        userSchema.schemas.deleteUser
                    )(context);
                });

                it(`should throw a ${returnedStatus} error`, async () => {
                    assert(context.status === returnedStatus);
                });

                it('should have property required for token header', async () => {
                    const { body } = context;

                    assert(body.output.find(
                        (error) => error.type === 'any.required')
                    );
                });
            });

            describe('invalid token in headers', () => {
                before(async () => {
                    context = new Context({
                        headers: {
                            [AUTH.TOKEN_HEADER]: ''
                        }
                    });

                    await validationMiddleware.validate(
                        userSchema.schemas.patchUser
                    )(context);
                });

                it(`should throw a ${returnedStatus} error`, async () => {
                    assert(context.status === returnedStatus);
                });

                it('should have property required for token header', async () => {
                    const { body } = context;

                    assert(body.output.find(
                        (error) => error.type === 'any.empty')
                    );
                });
            });

            describe('no body', () => {
                before(async () => {
                    context = new Context({
                        headers: {}
                    });

                    await validationMiddleware.validate(
                        userSchema.schemas.patchUser
                    )(context);
                });

                it(`should throw a ${returnedStatus} error`, async () => {
                    assert(context.status === returnedStatus);
                });

                it('should have property required for token header', async () => {
                    const { body } = context;

                    assert(body.output.find(
                        (error) =>
                            error.type === 'any.required' &&
                            error.key === 'body'
                    ));
                });
            });
        });
    });
});