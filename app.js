const Koa = require('koa');
const DatabaseService = require('./src/database/database.service');
const JwtService = require('./src/user/jwt.service');
const AuthService = require('./src/user/auth.service');
const MailService = require('./src/services/mail.service');
const HashingService = require('./src/services/hashing.service');
const ValidationMiddleware = require('./src/middleware/validation.middleware');

const User = require('./src/database/user.model');
const UserService = require('./src/user/user.service');
const UserController = require('./src/user/user.controller');
const UserSchema = require('./src/user/user.schema');
const UserRouter = require('./src/user/user.api');

const Customer = require('./src/database/customer.model');
const CustomerService = require('./src/customer/customer.service');
const CustomerController = require('./src/customer/customer.controller');
const CustomerSchema = require('./src/customer/customer.schema');
const CustomerRouter = require('./src/customer/customer.api');

const Invoice = require('./src/database/invoice.model');
const InvoiceService = require('./src/invoice/invoice.service');
const InvoiceController = require('./src/invoice/invoice.controller');
const InvoiceSchema = require('./src/invoice/invoice.schema');
const InvoiceRouter = require('./src/invoice/invoice.api');

const Material = require('./src/database/material.model');
const MaterialService = require('./src/material/material.service');
const MaterialController = require('./src/material/material.controller');
const MaterialSchema = require('./src/material/material.schema');
const MaterialRouter = require('./src/material/material.api');

const ControllerError = require('./src/log/controller.error.model');
const ServiceError = require('./src/log/service.error.model');

const helmet = require('koa-helmet');
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

    const securityOptions = {
        hpkp: {
            maxAge: 90 * 24 * 60 * 60 * 1000,
            sha256s: [
                '1525C85D9C9355589AEAC85C461EA7AF9B677E65E6CB66369C0D3B8AB763C0AB',
                'F0B44F780621386EAA7D71EFF3D8D44B32B207DDC9B8FB9C12D3279BE8DE445B'
            ]
        },
        frameguard: true,
        xssFilter: true,
        noSniff: true,
        referrerPolicy: true
    };
    app.use(helmet(securityOptions));

    app.use(bodyParser());

    app.use(errorMiddleware(logger));

    app.use(serve(__dirname + '/public'));

    const mailService = new MailService(config.get('mail.options'), logger);

    const authConfigs = config.get('auth');

    const authTokenExpiration = authConfigs.token.expiration;
    const authJwtOptions = {
        hash: hashKey,
        tokenExpiration: authTokenExpiration,
        subject: AUTH.AUTH_SUBJECT,
        logger
    };
    const authJwtService = new JwtService(authJwtOptions);

    const recoverConfigs = config.get('recover');
    const recoverTokenExpiration = recoverConfigs.token.expiration;
    const recoverJwtOptions = {
        hash: hashKey,
        tokenExpiration: recoverTokenExpiration,
        subject: AUTH.RESET_SUBJECT,
        logger
    };
    const resetJwtService = new JwtService(recoverJwtOptions);

    const confirmConfigs = config.get('confirm');
    const confirmTokenExpiration = confirmConfigs.token.expiration;
    const confirmJwtOptions = {
        hash: hashKey,
        tokenExpiration: confirmTokenExpiration,
        subject: AUTH.CONFIRM_SUBJECT,
        logger
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

    const userService = new UserService(userModel, hashingService, logger);
    const authService = new AuthService(authJwtService, userService, ServiceError);

    //Build customer api
    const customerModel = new Customer(databaseService);
    const customerService = new CustomerService(customerModel, logger);

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
    const invoiceService = new InvoiceService(invoiceModel, logger);

    const pdfServiceOptions = {
        format: 'Letter',
        phatomPath: './node_modules/phantomjs-prebuilt/bin/phatomjs'
    };
    const pdfService = new PdfService(pdfServiceOptions, logger);
    const invoiceControllerParameters = {
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

    //Build material api
    const materialModel = new Material(databaseService);
    const materialService = new MaterialService(materialModel);

    const materialControllerParameters = {
        materialService,
        apiErrorModel: ControllerError
    };
    const materialController = new MaterialController(materialControllerParameters);

    const materialSchema = new MaterialSchema(validationMiddleware.baseSchema);

    const materialApiParameters = {
        authService,
        materialController,
        materialSchema,
        validationMiddleware
    };
    const materialApi = new MaterialRouter(materialApiParameters);
    materialApi.buildRoutes();

    app.use(materialApi.router.routes());

    //Build auth api
    const emailTemplates = config.get('mail.templates');
    const authControllerParameters = {
        userService,
        invoiceService,
        customerService,
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