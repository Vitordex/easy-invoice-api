/* globals describe, it, before, after*/
const sinon = require('sinon');
const assert = require('assert');

const config = require('../../src/services/config.service');
const fs = require('fs');

const CustomerService = require('../../src/customer/customer.service');
const CustomerController = require('../../src/customer/customer.controller');
const CustomerSchema = require('../../src/customer/customer.schema');

const ValidationMiddleware = require('../../src/middleware/validation.middleware');
const JwtService = require('../../src/auth/jwt.service');

const ControllerError = require('../../src/log/controller.error.model');
const ObjectId = require('../../src/database/object.id');

const Context = require('./context.model');

describe('Customer Component', () => {
    const { AUTH, API: { STATUS } } = require('../../src/enums');

    const authConfigs = config.get('auth');

    const authTokenExpiration = authConfigs.token.expiration;
    const hashKey = fs.readFileSync('./server.hash.key', { encoding: 'utf-8' });
    const authJwtOptions = {
        hash: hashKey,
        tokenExpiration: authTokenExpiration,
        subject: AUTH.AUTH_SUBJECT
    };
    const jwtService = new JwtService(authJwtOptions);

    const generatedCustomerId = new ObjectId().toHex();
    const generatedUserId = new ObjectId().toHex();

    const validCustomerJSON = {
        _id: generatedCustomerId,
        id: generatedCustomerId,
        name: 'Testando teste',
        document: '123456789',
        userId: generatedUserId
    };

    const validToJSON = () => validCustomerJSON;
    const validCustomerObject = {
        ...validCustomerJSON,
        toJSON: validToJSON,
        save: () => Promise.resolve(true),
        updateWithDates: () => Promise.resolve(true)
    };

    const customerService = new CustomerService({});

    const customerControllerOptions = {
        customerService,
        apiErrorModel: ControllerError
    };
    const customerController = new CustomerController(customerControllerOptions);

    const validationMiddleware = new ValidationMiddleware();
    const customerSchema = new CustomerSchema(validationMiddleware.baseSchema);

    const source = 'customer.controller';

    /**@type {Context} */
    let context;
    describe('get customer route', () => {
        const defaultNext = () => { };
        const functionName = 'getCustomer';

        describe('Happy path', () => {
            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    }
                };
                const params = {
                    customerId: generatedCustomerId
                };
                context = new Context(request, params);

                sinon.stub(customerService, 'findCustomer')
                    .resolves(validCustomerObject);

                const next = async () => {
                    await customerController.getCustomer(context, defaultNext);
                };

                await validationMiddleware
                    .validate(customerSchema.schemas.getCustomer)(
                        context,
                        next
                    );
            });

            it(`should return status ${STATUS.OK}`, () => {
                const { status } = context;

                assert(status === STATUS.OK);
            });

            it('should return the success customer', () => {
                const { body } = context;

                assert(body && body._id === generatedCustomerId);
            });

            after(() => {
                customerService.findCustomer.restore();
            });
        });

        describe('Find error', () => {
            const returnedStatus = STATUS.INTERNAL_ERROR;

            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    }
                };
                const params = {
                    customerId: generatedCustomerId
                };
                context = new Context(request, params);

                sinon.stub(customerService, 'findCustomer')
                    .throws();

                const next = async () => {
                    await customerController.getCustomer(context, defaultNext);
                };

                await validationMiddleware
                    .validate(customerSchema.schemas.getCustomer)(
                        context,
                        next
                    );
            });

            it(`should return status ${returnedStatus}`, () => {
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
            });

            after(() => {
                customerService.findCustomer.restore();
            });
        });

        describe('Customer not found', () => {
            const returnedStatus = STATUS.NOT_FOUND;

            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    }
                };
                const params = {
                    customerId: generatedCustomerId
                };
                context = new Context(request, params);

                sinon.stub(customerService, 'findCustomer')
                    .resolves(null);

                const next = async () => {
                    await customerController.getCustomer(context, defaultNext);
                };

                await validationMiddleware
                    .validate(customerSchema.schemas.getCustomer)(
                        context,
                        next
                    );
            });

            it(`should return status ${returnedStatus}`, () => {
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

                it('controller should equal not found', () => {
                    const { output } = context.body;

                    assert(output === 'Customer not found');
                });
            });

            after(() => {
                customerService.findCustomer.restore();
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
                        customerSchema.schemas.listCustomers
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
                        customerSchema.schemas.listCustomers
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
        });
    });

    describe('post customer route', () => {
        const defaultNext = () => { };
        const functionName = 'postCustomer';

        const postValidCustomer = {
            name: 'Customer asd',
            address: {
                street: 'Testes',
                number: 1,
                complement: 'asd',
                neighborhood: 'Teste',
                zip_code: '00000000',
                city: 'Acrelândia',
                state: 'Acre'
            },
            document: '11111111122'
        };

        describe('Happy path', () => {
            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    },
                    body: postValidCustomer
                };

                const state = {
                    user: {
                        customers: [],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, {}, state);

                sinon.stub(customerService, 'create')
                    .resolves({
                        _id: 1,
                        ...postValidCustomer,
                        save: () => Promise.resolve(true)
                    });

                const next = async () => {
                    await customerController.postCustomer(context, defaultNext);
                };

                await validationMiddleware
                    .validate(customerSchema.schemas.postCustomer)(
                        context,
                        next
                    );
            });

            it(`should return status ${STATUS.OK}`, () => {
                const { status } = context;

                assert(status === STATUS.OK);
            });

            it('should return the success customer id', () => {
                const { body } = context;

                assert(body.customerId === 1);
            });

            after(() => {
                customerService.create.restore();

                if (postValidCustomer || postValidCustomer.userId === undefined)
                    delete postValidCustomer.userId;
            });
        });

        describe('Save error', () => {
            const returnedStatus = STATUS.INTERNAL_ERROR;

            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    },
                    body: postValidCustomer
                };

                const state = {
                    user: {
                        customers: [],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, {}, state);

                sinon.stub(customerService, 'create')
                    .resolves({
                        _id: 1,
                        ...postValidCustomer,
                        save: () => Promise.reject()
                    });

                const next = async () => {
                    await customerController.postCustomer(context, defaultNext);
                };

                await validationMiddleware
                    .validate(customerSchema.schemas.postCustomer)(
                        context,
                        next
                    );
            });

            it(`should return status ${returnedStatus}`, () => {
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
            });

            after(() => {
                customerService.create.restore();

                if (postValidCustomer || postValidCustomer.userId === undefined)
                    delete postValidCustomer.userId;
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
                        customerSchema.schemas.listCustomers
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
                        customerSchema.schemas.listCustomers
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
        });
    });

    describe('update customer route', () => {
        const defaultNext = () => { };
        const functionName = 'putCustomer';
        const putValidCustomerInput = {
            name: 'Customer asd',
            address: {
                street: 'Testes',
                number: 1,
                complement: 'asd',
                neighborhood: 'Teste',
                zip_code: '00000000',
                city: 'Acrelândia',
                state: 'Acre'
            },
            document: '11111111122'
        };

        describe('Happy path', () => {
            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    },
                    body: putValidCustomerInput
                };
                const params = {
                    customerId: generatedCustomerId
                };
                const state = {
                    user: {
                        customers: [generatedCustomerId],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, params, state);

                sinon.stub(customerService, 'findCustomer')
                    .resolves(validCustomerObject);

                const next = async () => {
                    await customerController.putCustomer(context, defaultNext);
                };

                await validationMiddleware
                    .validate(customerSchema.schemas.putCustomer)(
                        context,
                        next
                    );
            });

            it(`should return status ${STATUS.OK}`, () => {
                const { status } = context;

                assert(status === STATUS.OK);
            });

            it('should return an empty body', () => {
                const { body } = context;

                assert(!body);
            });

            after(() => {
                customerService.findCustomer.restore();
            });
        });

        describe('User does not have rights for customer', () => {
            const returnedStatus = STATUS.FORBIDDEN;

            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    },
                    body: putValidCustomerInput
                };
                const params = {
                    customerId: generatedCustomerId
                };
                const state = {
                    user: {
                        customers: [],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, params, state);

                const next = async () => {
                    await customerController.putCustomer(context, defaultNext);
                };

                await validationMiddleware
                    .validate(customerSchema.schemas.putCustomer)(
                        context,
                        next
                    );
            });

            it(`should return status ${returnedStatus}`, () => {
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

                it('controller should equal not found', () => {
                    const { output } = context.body;

                    assert(output === 'User does not have rights');
                });
            });
        });

        describe('Find error', () => {
            const returnedStatus = STATUS.INTERNAL_ERROR;

            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    },
                    body: putValidCustomerInput
                };
                const params = {
                    customerId: generatedCustomerId
                };
                const state = {
                    user: {
                        customers: [generatedCustomerId],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, params, state);

                sinon.stub(customerService, 'findCustomer')
                    .throws();

                const next = async () => {
                    await customerController.putCustomer(context, defaultNext);
                };

                await validationMiddleware
                    .validate(customerSchema.schemas.putCustomer)(
                        context,
                        next
                    );
            });

            it(`should return status ${returnedStatus}`, () => {
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
            });

            after(() => {
                customerService.findCustomer.restore();
            });
        });

        describe('Customer not found', () => {
            const returnedStatus = STATUS.NOT_FOUND;

            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    },
                    body: putValidCustomerInput
                };
                const params = {
                    customerId: generatedCustomerId
                };
                const state = {
                    user: {
                        customers: [generatedCustomerId],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, params, state);

                sinon.stub(customerService, 'findCustomer')
                    .resolves();

                const next = async () => {
                    await customerController.putCustomer(context, defaultNext);
                };

                await validationMiddleware
                    .validate(customerSchema.schemas.putCustomer)(
                        context,
                        next
                    );
            });

            it(`should return status ${returnedStatus}`, () => {
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

                it('controller should equal not found', () => {
                    const { output } = context.body;

                    assert(output === 'Customer not found');
                });
            });

            after(() => {
                customerService.findCustomer.restore();
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
                        customerSchema.schemas.putCustomer
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
                        customerSchema.schemas.putCustomer
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
                        customerSchema.schemas.putCustomer
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

    describe('delete customer route', () => {
        const defaultNext = () => { };
        const functionName = 'deleteCustomer';

        describe('Happy path', () => {
            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    }
                };
                const params = {
                    customerId: generatedCustomerId
                };
                const state = {
                    user: {
                        customers: [generatedCustomerId],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, params, state);

                sinon.stub(customerService, 'findCustomer')
                    .resolves(validCustomerObject);

                const next = async () => {
                    await customerController.deleteCustomer(context, defaultNext);
                };

                await validationMiddleware
                    .validate(customerSchema.schemas.deleteCustomer)(
                        context,
                        next
                    );
            });

            it(`should return status ${STATUS.OK}`, () => {
                const { status } = context;

                assert(status === STATUS.OK);
            });

            it('should return an empty body', () => {
                const { body } = context;

                assert(!body);
            });

            after(() => {
                customerService.findCustomer.restore();
            });
        });

        describe('User does not have rights for customer', () => {
            const returnedStatus = STATUS.FORBIDDEN;

            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    }
                };
                const params = {
                    customerId: generatedCustomerId
                };
                const state = {
                    user: {
                        customers: [],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, params, state);

                const next = async () => {
                    await customerController.deleteCustomer(context, defaultNext);
                };

                await validationMiddleware
                    .validate(customerSchema.schemas.deleteCustomer)(
                        context,
                        next
                    );
            });

            it(`should return status ${returnedStatus}`, () => {
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

                it('controller should equal not found', () => {
                    const { output } = context.body;

                    assert(output === 'User does not have rights');
                });
            });
        });

        describe('Find error', () => {
            const returnedStatus = STATUS.INTERNAL_ERROR;

            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    }
                };
                const params = {
                    customerId: generatedCustomerId
                };
                const state = {
                    user: {
                        customers: [generatedCustomerId],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, params, state);

                sinon.stub(customerService, 'findCustomer')
                    .throws();

                const next = async () => {
                    await customerController.deleteCustomer(context, defaultNext);
                };

                await validationMiddleware
                    .validate(customerSchema.schemas.deleteCustomer)(
                        context,
                        next
                    );
            });

            it(`should return status ${returnedStatus}`, () => {
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
            });

            after(() => {
                customerService.findCustomer.restore();
            });
        });

        describe('Customer not found', () => {
            const returnedStatus = STATUS.NOT_FOUND;

            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    }
                };
                const params = {
                    customerId: generatedCustomerId
                };
                const state = {
                    user: {
                        customers: [generatedCustomerId],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, params, state);

                sinon.stub(customerService, 'findCustomer')
                    .resolves();

                const next = async () => {
                    await customerController.deleteCustomer(context, defaultNext);
                };

                await validationMiddleware
                    .validate(customerSchema.schemas.deleteCustomer)(
                        context,
                        next
                    );
            });

            it(`should return status ${returnedStatus}`, () => {
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

                it('controller should equal not found', () => {
                    const { output } = context.body;

                    assert(output === 'Invalid customer id');
                });
            });

            after(() => {
                customerService.findCustomer.restore();
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
                        customerSchema.schemas.putCustomer
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
                        customerSchema.schemas.putCustomer
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
        });
    });

    describe('list customers route', () => {
        const defaultNext = () => { };
        const functionName = 'listCustomers';

        describe('Happy path', () => {
            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    }
                };
                const state = {
                    user: {
                        customers: []
                    }
                };
                context = new Context(request, {}, state);

                sinon.stub(customerService, 'findCustomers')
                    .resolves([]);

                const next = async () => {
                    await customerController.listCustomers(context, defaultNext);
                };

                await validationMiddleware
                    .validate(customerSchema.schemas.listCustomers)(
                        context,
                        next
                    );
            });

            it(`should return status ${STATUS.OK}`, () => {
                const { status } = context;

                assert(status === STATUS.OK);
            });

            it('should return the customers array', () => {
                const { body } = context;

                assert(body && body instanceof Array);
            });

            it('should have length equal to user customers', () => {
                const { body } = context;

                assert(body.length === 0);
            });

            after(() => {
                customerService.findCustomers.restore();
            });
        });

        describe('Find error', () => {
            const returnedStatus = STATUS.INTERNAL_ERROR;

            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    }
                };
                const state = {
                    user: {
                        customers: ['a123sd']
                    }
                };
                context = new Context(request, {}, state);

                sinon.stub(customerService, 'findCustomers')
                    .throws();

                const next = async () => {
                    await customerController.listCustomers(context, defaultNext);
                };

                await validationMiddleware
                    .validate(customerSchema.schemas.listCustomers)(
                        context,
                        next
                    );
            });

            it(`should return status ${returnedStatus}`, () => {
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
            });

            after(() => {
                customerService.findCustomers.restore();
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
                        customerSchema.schemas.listCustomers
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
                        customerSchema.schemas.listCustomers
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
        });
    });
});