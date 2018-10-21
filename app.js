const bodyParser = require('koa-bodyparser');
const config = require('./src/services/config.service');

const Koa = require('koa');
const DatabaseService = require('./src/database/database.service');
const JwtService = require('./src/auth/jwt.service');
const AuthService = require('./src/auth/auth.service');
const MailService = require('./src/services/mail.service');
const HashingService = require('./src/services/hashing.service');
const ValidationMiddleware = require('./src/middleware/validation.middleware');

const User = require('./src/database/user.model');
const UserService = require('./src/user/user.service');
const UserController = require('./src/user/user.controller');
const UserSchema = require('./src/user/user.schema');
const UserRouter = require('./src/user/user.api');

const AuthController = require('./src/auth/auth.controller');
const AuthSchema = require('./src/auth/auth.schema');
const AuthRouter = require('./src/auth/auth.api');

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

const ControllerError = require('./src/log/controller.error.model');
const ServiceError = require('./src/log/service.error.model');

const fs = require('fs');
const hashKey = fs.readFileSync('./server.hash.key', { encoding: 'utf-8' });

const errorMiddleware = require('./src/middleware/error.handle.middleware');

const { AUTH } = require('./src/enums');

async function initApp(logger) {
    const app = new Koa();

    app.use(bodyParser());

    app.use(errorMiddleware(logger));

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

    //Build user api
    const userModel = new User(databaseService);

    const userService = new UserService(userModel, hashingService);
    const authService = new AuthService(authJwtService, userService, ServiceError);

    const userControllerParameters = {
        userService,
        apiErrorModel: ControllerError,
        authJwtService,
        confirmJwtService,
        resetJwtService,
        mailService
    };
    const userController = new UserController(userControllerParameters);

    const userSchema = new UserSchema(validationMiddleware.baseSchema);
    const userApiParameters = {
        authService,
        mailService,
        userController,
        userSchema,
        validationMiddleware
    };
    const userApi = new UserRouter(userApiParameters);
    userApi.buildRoutes();

    app.use(userApi.router.routes());

    //Build auth api
    const authControllerParameters = {
        userService,
        apiErrorModel: ControllerError,
        authJwtService,
        confirmJwtService,
        resetJwtService,
        mailService
    };
    const authController = new AuthController(authControllerParameters);

    const authSchema = new AuthSchema(validationMiddleware.baseSchema);
    const authApiParameters = {
        authService,
        mailService,
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

    const invoiceControllerParameters = {
        userService,
        invoiceService,
        apiErrorModel: ControllerError
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

    return app;
}

module.exports = initApp;