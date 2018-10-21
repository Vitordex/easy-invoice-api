const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const serve = require('koa-static');
const fs = require('fs');

const {
    auth: {
        AuthRouter,
        AuthController,
        AuthService,
        AuthSchema,
        JwtService
    },
    customer: {
        CustomerRouter,
        CustomerController,
        CustomerService,
        CustomerSchema
    },
    database: {
        DatabaseService,
        User,
        Customer,
        Invoice
    },
    enums: { AUTH },
    invoice: {
        InvoiceRouter,
        InvoiceController,
        InvoiceService,
        InvoiceSchema
    },
    log: {
        ControllerError,
        ServiceError
    },
    middleware: {
        Validation: ValidationMiddleware,
        ErrorHandle: errorMiddleware
    },
    pdf: { PdfService },
    services: {
        MailService,
        HashingService,
        ConfigService: config
    },
    user: {
        UserService,
        UserController,
        UserSchema,
        UserRouter
    }
} = require('./src/');

const hashKey = fs.readFileSync('./server.hash.key', { encoding: 'utf-8' });
const pdfTemplate = fs.readFileSync('./src/invoice/invoice.template.html', { encoding: 'utf-8' });

async function initApp(logger) {
    const app = new Koa();

    app.use(bodyParser());

    app.use(errorMiddleware(logger));
    
    app.use(serve(__dirname + '/public'));

    const mailService = new MailService(config.get('mail.options'));

    const authConfigs = config.get('auth');

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

    const hashingOptions = authConfigs.password;
    const hashingService = new HashingService(
        hashingOptions.key,
        hashingOptions.algorithm,
        hashingOptions.encoding
    );

    const dbConfigs = config.get('database');
    const databaseService = new DatabaseService();
    await databaseService.connect(dbConfigs.auth);

    const validationMiddleware = new ValidationMiddleware(ControllerError);

    const userModel = new User(databaseService);

    const userService = new UserService(userModel, hashingService);
    const authService = new AuthService(authJwtService, userService, ServiceError);

    //Build auth api
    const emailTemplates = config.get('mail.templates');
    const authControllerParameters = {
        userService,
        apiErrorModel: ControllerError,
        authJwtService,
        confirmJwtService,
        resetJwtService,
        mailService,
        emailTemplates
    };
    const authController = new AuthController(authControllerParameters);

    const authSchema = new AuthSchema(validationMiddleware.baseSchema);
    const authApiParameters = {
        authService,
        authController,
        authSchema,
        validationMiddleware
    };
    const authApi = new AuthRouter(authApiParameters);
    authApi.buildRoutes();

    app.use(authApi.router.routes());

    //Build customer api
    const customerModel = new Customer(databaseService);
    const customerService = new CustomerService(customerModel);

    const customerControllerOptions = {
        userService,
        customerService,
        apiErrorModel: ControllerError
    };
    const customerController = new CustomerController(customerControllerOptions);

    const customerSchema = new CustomerSchema(validationMiddleware.baseSchema);

    const customerApiParameters = {
        authService,
        customerController,
        customerSchema,
        validationMiddleware
    };
    const customerApi = new CustomerRouter(customerApiParameters);
    customerApi.buildRoutes();

    app.use(customerApi.router.routes());

    //Build invoice api
    const invoiceModel = new Invoice(databaseService);
    const invoiceService = new InvoiceService(invoiceModel);

    const pdfServiceOptions = { format: 'Letter' };
    const pdfService = new PdfService(pdfServiceOptions);
    const invoiceControllerParameters = {
        userService,
        invoiceService,
        apiErrorModel: ControllerError,
        pdfService,
        pdfTemplate
    };
    const invoiceController = new InvoiceController(invoiceControllerParameters);

    const invoiceSchema = new InvoiceSchema(validationMiddleware.baseSchema);

    const invoiceApiParameters = {
        authService,
        invoiceController,
        invoiceSchema,
        validationMiddleware
    };
    const invoiceApi = new InvoiceRouter(invoiceApiParameters);
    invoiceApi.buildRoutes();

    app.use(invoiceApi.router.routes());

    //Build user api
    const userControllerParameters = {
        userService,
        invoiceService,
        customerService,
        apiErrorModel: ControllerError
    };
    const userController = new UserController(userControllerParameters);

    const userSchema = new UserSchema(validationMiddleware.baseSchema);
    const userApiParameters = {
        authService,
        userController,
        userSchema,
        validationMiddleware
    };
    const userApi = new UserRouter(userApiParameters);
    userApi.buildRoutes();

    app.use(userApi.router.routes());

    return app;
}

module.exports = initApp;