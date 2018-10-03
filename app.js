const bodyParser = require('koa-bodyparser');
const config = require('./src/services/config.service');

const Koa = require('koa');
const DatabaseService = require('./src/database/database.service');
const AuthService = require('./src/user/auth.service');
const MailService = require('./src/services/mail.service');
const HashingService = require('./src/services/hashing.service');
const ValidationMiddleware = require('./src/services/validation.middleware');

const User = require('./src/database/user.model');
const UserService = require('./src/user/user.service');
const UserController = require('./src/user/user.controller');
const UserSchema = require('./src/user/user.schema');
const UserRouter = require('./src/user/user.api');

const fs = require('fs');
const hashKey = fs.readFileSync('./server.hash.key', { encoding: 'utf-8' });

async function initApp(logger) {
    const app = new Koa();

    app.use(bodyParser());

    app.use(async (context, next) => {
        try {
            await next();
        } catch (error) {
            logger.error(error);
            context.throw(error);
        }
    });

    const mailService = new MailService(config.get('mail.options'));

    const authConfigs = config.get('auth');

    const hashingOptions = authConfigs.password;
    const hashingService = new HashingService(
        hashingOptions.key,
        hashingOptions.algorithm,
        hashingOptions.encoding
    );

    const dbConfigs = config.get('database');
    const databaseService = new DatabaseService();
    await databaseService.connect(dbConfigs.auth);

    const userModel = new User(databaseService);
    const userService = new UserService(
        userModel,
        hashingService
    );
    const userController = new UserController({
        userService,
        authHash: hashKey,
        authConfigs,
        mailService
    });

    const tokenExpiration = authConfigs.token.expiration;
    const authOptionals = authConfigs.optionals;

    const authService = new AuthService(
        hashKey,
        tokenExpiration,
        userModel,
        authOptionals
    );

    const validationMiddleware = new ValidationMiddleware();
    const userSchema = new UserSchema(validationMiddleware.baseSchema);
    const userApi = new UserRouter({
        authService,
        mailService,
        userController, 
        userSchema, 
        validationMiddleware
    });
    userApi.buildRoutes();
    app.use(userApi.router.routes());

    return app;
}

module.exports = initApp;