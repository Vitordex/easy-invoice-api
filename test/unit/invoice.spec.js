/* globals describe, it, before, after*/
const sinon = require('sinon');
const assert = require('assert');
const fs = require('fs');

const {
    auth: { JwtService },
    database: { ObjectId },
    invoice: {
        InvoiceController,
        InvoiceService,
        InvoiceSchema
    },
    log: { ControllerError },
    middleware: { Validation: ValidationMiddleware },
    services: { ConfigService: config }
} = require('../../src/');
const Context = require('./context.model');

describe('Invoice Component', () => {
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

    const generatedInvoiceId = new ObjectId().toHex();
    const generatedUserId = new ObjectId().toHex();

    const validInvoiceJSON = {
        _id: generatedInvoiceId,
        id: generatedInvoiceId,
        description: 'Testando teste',
        customer: '123456789',
        userId: generatedUserId
    };

    const validToJSON = () => validInvoiceJSON;
    const validInvoiceObject = {
        ...validInvoiceJSON,
        toJSON: validToJSON,
        save: () => Promise.resolve(true),
        updateWithDates: () => Promise.resolve(true)
    };

    const invoiceService = new InvoiceService({});

    const invoiceControllerOptions = {
        invoiceService,
        apiErrorModel: ControllerError
    };
    const invoiceController = new InvoiceController(invoiceControllerOptions);

    const validationMiddleware = new ValidationMiddleware();
    const invoiceSchema = new InvoiceSchema(validationMiddleware.baseSchema);

    const source = 'invoice.controller';

    /**@type {Context} */
    let context;
    describe('get invoice route', () => {
        const defaultNext = () => { };
        const functionName = 'getInvoice';

        describe('Happy path', () => {
            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    }
                };
                const params = {
                    invoiceId: generatedInvoiceId
                };
                context = new Context(request, params);

                sinon.stub(invoiceService, 'findInvoice')
                    .resolves(validInvoiceObject);

                const next = async () => {
                    await invoiceController.getInvoice(context, defaultNext);
                };

                await validationMiddleware
                    .validate(invoiceSchema.schemas.getInvoice)(
                        context,
                        next
                    );
            });

            it(`should return status ${STATUS.OK}`, () => {
                const { status } = context;

                assert(status === STATUS.OK);
            });

            it('should return the success invoice', () => {
                const { body } = context;

                assert(body && body._id === generatedInvoiceId);
            });

            after(() => {
                invoiceService.findInvoice.restore();
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
                    invoiceId: generatedInvoiceId
                };
                context = new Context(request, params);

                sinon.stub(invoiceService, 'findInvoice')
                    .throws();

                const next = async () => {
                    await invoiceController.getInvoice(context, defaultNext);
                };

                await validationMiddleware
                    .validate(invoiceSchema.schemas.getInvoice)(
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
                invoiceService.findInvoice.restore();
            });
        });

        describe('Invoice not found', () => {
            const returnedStatus = STATUS.NOT_FOUND;

            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    }
                };
                const params = {
                    invoiceId: generatedInvoiceId
                };
                context = new Context(request, params);

                sinon.stub(invoiceService, 'findInvoice')
                    .resolves(null);

                const next = async () => {
                    await invoiceController.getInvoice(context, defaultNext);
                };

                await validationMiddleware
                    .validate(invoiceSchema.schemas.getInvoice)(
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

                    assert(output === 'Invalid invoice id');
                });
            });

            after(() => {
                invoiceService.findInvoice.restore();
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
                        invoiceSchema.schemas.listInvoices
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
                        invoiceSchema.schemas.listInvoices
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

    describe('post invoice route', () => {
        const defaultNext = () => { };
        const functionName = 'postInvoice';

        const postValidInvoice = {
            customer: 'e09e774cbf8b5',
            description: 'Descricao da nota aqui asd',
            addition: 'aopidfhioasdjnosiebm',
            discount: '15%',
            value: 800,
            type: 'Casa'
        };

        describe('Happy path', () => {
            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    },
                    body: postValidInvoice
                };

                const state = {
                    user: {
                        invoices: [],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, {}, state);

                sinon.stub(invoiceService, 'create')
                    .resolves({
                        _id: 1,
                        ...postValidInvoice,
                        save: () => Promise.resolve(true)
                    });

                const next = async () => {
                    await invoiceController.postInvoice(context, defaultNext);
                };

                await validationMiddleware
                    .validate(invoiceSchema.schemas.postInvoice)(
                        context,
                        next
                    );
            });

            it(`should return status ${STATUS.OK}`, () => {
                const { status } = context;

                assert(status === STATUS.OK);
            });

            it('should return the success invoice id', () => {
                const { body } = context;

                assert(body.invoiceId === 1);
            });

            after(() => {
                invoiceService.create.restore();

                if (postValidInvoice || postValidInvoice.userId === undefined)
                    delete postValidInvoice.userId;
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
                    body: postValidInvoice
                };

                const state = {
                    user: {
                        invoices: [],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, {}, state);

                sinon.stub(invoiceService, 'create')
                    .resolves({
                        _id: 1,
                        ...postValidInvoice,
                        save: () => Promise.reject()
                    });

                const next = async () => {
                    await invoiceController.postInvoice(context, defaultNext);
                };

                await validationMiddleware
                    .validate(invoiceSchema.schemas.postInvoice)(
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
                invoiceService.create.restore();

                if (postValidInvoice || postValidInvoice.userId === undefined)
                    delete postValidInvoice.userId;
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
                        invoiceSchema.schemas.listInvoices
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
                        invoiceSchema.schemas.listInvoices
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

    describe('update invoice route', () => {
        const defaultNext = () => { };
        const functionName = 'patchInvoice';
        const putValidInvoiceInput = {
            description: 'Descricao da nota aqui asd',
            addition: 'aopidfhioasdjnosiebm',
            discount: '15%',
            value: 800,
            type: 'Casa'
        };

        describe('Happy path', () => {
            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    },
                    body: putValidInvoiceInput
                };
                const params = {
                    invoiceId: generatedInvoiceId
                };
                const state = {
                    user: {
                        invoices: [generatedInvoiceId],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, params, state);

                sinon.stub(invoiceService, 'findInvoice')
                    .resolves(validInvoiceObject);

                const next = async () => {
                    await invoiceController.patchInvoice(context, defaultNext);
                };

                await validationMiddleware
                    .validate(invoiceSchema.schemas.patchInvoice)(
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
                invoiceService.findInvoice.restore();
            });
        });

        describe('User does not have rights for invoice', () => {
            const returnedStatus = STATUS.FORBIDDEN;

            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    },
                    body: putValidInvoiceInput
                };
                const params = {
                    invoiceId: generatedInvoiceId
                };
                const state = {
                    user: {
                        invoices: [],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, params, state);

                const next = async () => {
                    await invoiceController.patchInvoice(context, defaultNext);
                };

                await validationMiddleware
                    .validate(invoiceSchema.schemas.patchInvoice)(
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
                    body: putValidInvoiceInput
                };
                const params = {
                    invoiceId: generatedInvoiceId
                };
                const state = {
                    user: {
                        invoices: [generatedInvoiceId],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, params, state);

                sinon.stub(invoiceService, 'findInvoice')
                    .throws();

                const next = async () => {
                    await invoiceController.patchInvoice(context, defaultNext);
                };

                await validationMiddleware
                    .validate(invoiceSchema.schemas.patchInvoice)(
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
                invoiceService.findInvoice.restore();
            });
        });

        describe('Invoice not found', () => {
            const returnedStatus = STATUS.NOT_FOUND;

            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    },
                    body: putValidInvoiceInput
                };
                const params = {
                    invoiceId: generatedInvoiceId
                };
                const state = {
                    user: {
                        invoices: [generatedInvoiceId],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, params, state);

                sinon.stub(invoiceService, 'findInvoice')
                    .resolves();

                const next = async () => {
                    await invoiceController.patchInvoice(context, defaultNext);
                };

                await validationMiddleware
                    .validate(invoiceSchema.schemas.patchInvoice)(
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

                    assert(output === 'Invalid invoice id');
                });
            });

            after(() => {
                invoiceService.findInvoice.restore();
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
                        invoiceSchema.schemas.patchInvoice
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
                        invoiceSchema.schemas.patchInvoice
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
                        invoiceSchema.schemas.patchInvoice
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

    describe('delete invoice route', () => {
        const defaultNext = () => { };
        const functionName = 'deleteInvoice';

        describe('Happy path', () => {
            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    }
                };
                const params = {
                    invoiceId: generatedInvoiceId
                };
                const state = {
                    user: {
                        invoices: [generatedInvoiceId],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, params, state);

                sinon.stub(invoiceService, 'findInvoice')
                    .resolves(validInvoiceObject);
                sinon.stub(invoiceService, 'deleteInvoice')
                    .resolves(true);

                const next = async () => {
                    await invoiceController.deleteInvoice(context, defaultNext);
                };

                await validationMiddleware
                    .validate(invoiceSchema.schemas.deleteInvoice)(
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
                invoiceService.findInvoice.restore();
                invoiceService.deleteInvoice.restore();
            });
        });

        describe('User does not have rights for invoice', () => {
            const returnedStatus = STATUS.FORBIDDEN;

            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    }
                };
                const params = {
                    invoiceId: generatedInvoiceId
                };
                const state = {
                    user: {
                        invoices: [],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, params, state);

                const next = async () => {
                    await invoiceController.deleteInvoice(context, defaultNext);
                };

                await validationMiddleware
                    .validate(invoiceSchema.schemas.deleteInvoice)(
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
                    invoiceId: generatedInvoiceId
                };
                const state = {
                    user: {
                        invoices: [generatedInvoiceId],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, params, state);

                sinon.stub(invoiceService, 'findInvoice')
                    .throws();

                const next = async () => {
                    await invoiceController.deleteInvoice(context, defaultNext);
                };

                await validationMiddleware
                    .validate(invoiceSchema.schemas.deleteInvoice)(
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
                invoiceService.findInvoice.restore();
            });
        });

        describe('Invoice not found', () => {
            const returnedStatus = STATUS.NOT_FOUND;

            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    }
                };
                const params = {
                    invoiceId: generatedInvoiceId
                };
                const state = {
                    user: {
                        invoices: [generatedInvoiceId],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, params, state);

                sinon.stub(invoiceService, 'findInvoice')
                    .resolves();

                const next = async () => {
                    await invoiceController.deleteInvoice(context, defaultNext);
                };

                await validationMiddleware
                    .validate(invoiceSchema.schemas.deleteInvoice)(
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

                    assert(output === 'Invalid invoice id');
                });
            });

            after(() => {
                invoiceService.findInvoice.restore();
            });
        });

        describe('save error', () => {
            const returnedStatus = STATUS.INTERNAL_ERROR;

            before(async () => {
                const token = await jwtService.generate();
                const request = {
                    headers: {
                        [AUTH.TOKEN_HEADER]: token
                    }
                };
                const params = {
                    invoiceId: generatedInvoiceId
                };
                const state = {
                    user: {
                        invoices: [generatedInvoiceId],
                        save: () => Promise.resolve(true)
                    }
                };
                context = new Context(request, params, state);

                sinon.stub(invoiceService, 'findInvoice')
                    .resolves(validInvoiceObject);
                sinon.stub(invoiceService, 'deleteInvoice')
                    .throws();

                const next = async () => {
                    await invoiceController.deleteInvoice(context, defaultNext);
                };

                await validationMiddleware
                    .validate(invoiceSchema.schemas.deleteInvoice)(
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
                invoiceService.findInvoice.restore();
                invoiceService.deleteInvoice.restore();
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
                        invoiceSchema.schemas.patchInvoice
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
                        invoiceSchema.schemas.patchInvoice
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

    describe('list invoices route', () => {
        const defaultNext = () => { };
        const functionName = 'listInvoices';

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
                        invoices: []
                    }
                };
                context = new Context(request, {}, state);

                sinon.stub(invoiceService, 'findInvoices')
                    .resolves([]);

                const next = async () => {
                    await invoiceController.listInvoices(context, defaultNext);
                };

                await validationMiddleware
                    .validate(invoiceSchema.schemas.listInvoices)(
                        context,
                        next
                    );
            });

            it(`should return status ${STATUS.OK}`, () => {
                const { status } = context;

                assert(status === STATUS.OK);
            });

            it('should return the invoices array', () => {
                const { body } = context;

                assert(body && body instanceof Array);
            });

            it('should have length equal to user invoices', () => {
                const { body } = context;

                assert(body.length === 0);
            });

            after(() => {
                invoiceService.findInvoices.restore();
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
                        invoices: ['a123sd']
                    }
                };
                context = new Context(request, {}, state);

                sinon.stub(invoiceService, 'findInvoices')
                    .throws();

                const next = async () => {
                    await invoiceController.listInvoices(context, defaultNext);
                };

                await validationMiddleware
                    .validate(invoiceSchema.schemas.listInvoices)(
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
                invoiceService.findInvoices.restore();
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
                        invoiceSchema.schemas.listInvoices
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
                        invoiceSchema.schemas.listInvoices
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