/*globals describe, it, before*/
const assert = require('assert');

const config = require('../../src/services/config.service');

const MailService = require('../../src/services/mail.service');
const HashingService = require('../../src/services/hashing.service');

const ValidationMiddleware = require('../../src/middleware/validation.middleware');

const UserService = require('../../src/user/user.service');
const UserController = require('../../src/user/user.controller');
const UserSchema = require('../../src/user/user.schema');

const JwtService = require('../../src/auth/jwt.service');
const Context = require('./context.model');
const ObjectId = require('../../src/database/object.id');

const ControllerError = require('../../src/log/controller.error.model');

const fs = require('fs');

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

    validationMiddleware = new ValidationMiddleware();
    userSchema = new UserSchema(validationMiddleware.baseSchema);

    mailService = new MailService(config.get('mail.options'));

    userService = new UserService(userModel, hashingService);

    const authConfigs = config.get('auth');

    const authTokenExpiration = authConfigs.token.expiration;
    const hashKey = fs.readFileSync('./server.hash.key', { encoding: 'utf-8' });
    const authJwtOptions = {
        hash: hashKey,
        tokenExpiration: authTokenExpiration,
        subject: AUTH.AUTH_SUBJECT
    };
    const jwtService = new JwtService(authJwtOptions);

    userController = new UserController({
        authConfigs,
        authHash: hashKey,
        userService,
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
            const successUser = {...putValidUserInput};

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
                    body: {...putValidUserInput}
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
});