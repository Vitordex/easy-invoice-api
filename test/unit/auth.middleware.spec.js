/*globals describe, it, before, after*/
const assert = require('assert');

const {
    auth: {
        AuthService,
        JwtService
    },
    enums: { AUTH, API: { STATUS } },
    log: { ServiceError },
    services: { ConfigService: config }
} = require('../../src/');
const Context = require('./context.model');

const validUser = {
    id: 1
};
const findUser = () => Promise.resolve(validUser);
let userService = { findUser };

describe('Auth', () => {
    const log = {
        info: () => {},
        error: () => {}
    };
    const logger = {
        child: () => log
    };

    const serviceName = 'auth.service';
    const functionName = 'authenticate';
    const authConfigs = config.get('auth');

    const authHash = 'hashKey';
    const authTokenExpiration = authConfigs.token.expiration;
    const authJwtOptions = {
        hash: authHash,
        tokenExpiration: authTokenExpiration,
        subject: AUTH.AUTH_SUBJECT,
        logger
    };
    const authJwtService = new JwtService(authJwtOptions);
    const authService = new AuthService(authJwtService, userService, ServiceError);

    it('happy path', async () => {
        const token = await authJwtService.generate({ id: 1 });
        const context = new Context({
            headers: {
                [AUTH.TOKEN_HEADER]: token
            }
        });

        const middleware = authService.authenticate();
        await middleware(context, () => { });
    });

    describe('invalid signature', () => {
        const returnedStatus = STATUS.UNAUTHORIZED;

        /**@type {JwtService} */
        let otherJwtService;

        /**@type {Context} */
        let context;
        before(async () => {
            const otherTokenExpiration = authConfigs.token.expiration;
            const otherJwtOptions = {
                hash: 'other',
                tokenExpiration: otherTokenExpiration,
                subject: AUTH.AUTH_SUBJECT,
                logger
            };
            otherJwtService = new JwtService(otherJwtOptions);

            const token = await otherJwtService.generate({ id: 1 });
            context = new Context({
                headers: {
                    [AUTH.TOKEN_HEADER]: token
                }
            });

            const middleware = authService.authenticate();
            await middleware(context, () => { });
        });

        it(`should return status ${returnedStatus}`, () => {
            const { status } = context;

            assert(status === returnedStatus);
        });

        it('should return a service error', () => {
            const { body } = context;

            assert(body instanceof ServiceError);
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
                const { service } = context.body;

                assert(!!service);
            });

            it(`controller should equal ${serviceName}`, () => {
                const { service } = context.body;

                assert(service === serviceName);
            });
        });
    });

    describe('find error', () => {
        const returnedStatus = STATUS.INTERNAL_ERROR;

        /**@type {Context} */
        let context;
        before(async () => {
            const token = await authJwtService.generate({ id: 1 });
            context = new Context({
                headers: {
                    [AUTH.TOKEN_HEADER]: token
                }
            });

            userService.findUser = () => Promise.reject();

            const middleware = authService.authenticate();
            await middleware(context, () => { });
        });

        it(`should return status ${returnedStatus}`, () => {
            const { status } = context;

            assert(status === returnedStatus);
        });

        it('should return a service error', () => {
            const { body } = context;

            assert(body instanceof ServiceError);
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
                const { service } = context.body;

                assert(!!service);
            });

            it(`controller should equal ${serviceName}`, () => {
                const { service } = context.body;

                assert(service === serviceName);
            });
        });

        after(() => {
            userService.findUser = findUser;
        });
    });

    describe('user not found', () => {
        const returnedStatus = STATUS.UNAUTHORIZED;

        /**@type {Context} */
        let context;
        before(async () => {
            const token = await authJwtService.generate({ id: 1 });
            context = new Context({
                headers: {
                    [AUTH.TOKEN_HEADER]: token
                }
            });

            userService.findUser = () => Promise.resolve(null);

            const middleware = authService.authenticate();
            await middleware(context, () => { });
        });

        it(`should return status ${returnedStatus}`, () => {
            const { status } = context;

            assert(status === returnedStatus);
        });

        it('should return a service error', () => {
            const { body } = context;

            assert(body instanceof ServiceError);
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
                const { service } = context.body;

                assert(!!service);
            });

            it(`controller should equal ${serviceName}`, () => {
                const { service } = context.body;

                assert(service === serviceName);
            });
        });
    });

    describe('token expired', () => {
        const returnedStatus = STATUS.UNAUTHORIZED;

        /**@type {JwtService} */
        let otherJwtService;

        /**@type {Context} */
        let context;
        before(async () => {
            const otherTokenExpiration = '0s';
            const otherJwtOptions = {
                hash: authHash,
                tokenExpiration: otherTokenExpiration,
                subject: AUTH.AUTH_SUBJECT,
                logger
            };
            otherJwtService = new JwtService(otherJwtOptions);

            const token = await otherJwtService.generate({ id: 1 });
            context = new Context({
                headers: {
                    [AUTH.TOKEN_HEADER]: token
                }
            });

            const middleware = authService.authenticate();
            await middleware(context, () => { });
        });

        it(`should return status ${returnedStatus}`, () => {
            const { status } = context;

            assert(status === returnedStatus);
        });

        it('should return a service error', () => {
            const { body } = context;

            assert(body instanceof ServiceError);
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
                const { service } = context.body;

                assert(!!service);
            });

            it(`controller should equal ${serviceName}`, () => {
                const { service } = context.body;

                assert(service === serviceName);
            });

            it('error message should be about subject', () => {
                const { output } = context.body;

                assert(output.message.includes('expired'));
            });
        });
    });

    describe('incorrect subject', () => {
        const returnedStatus = STATUS.UNAUTHORIZED;

        /**@type {JwtService} */
        let otherJwtService;

        /**@type {Context} */
        let context;
        before(async () => {
            const otherTokenExpiration = authConfigs.token.expiration;
            const otherJwtOptions = {
                hash: authHash,
                tokenExpiration: otherTokenExpiration,
                subject: 'test',
                logger
            };
            otherJwtService = new JwtService(otherJwtOptions);

            const token = await otherJwtService.generate({ id: 1 });
            context = new Context({
                headers: {
                    [AUTH.TOKEN_HEADER]: token
                }
            });

            const middleware = authService.authenticate();
            await middleware(context, () => { });
        });

        it(`should return status ${returnedStatus}`, () => {
            const { status } = context;

            assert(status === returnedStatus);
        });

        it('should return a service error', () => {
            const { body } = context;

            assert(body instanceof ServiceError);
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
                const { service } = context.body;

                assert(!!service);
            });

            it(`controller should equal ${serviceName}`, () => {
                const { service } = context.body;

                assert(service === serviceName);
            });

            it('error message should be about subject', () => {
                const { output } = context.body;

                assert(output.message.includes('subject'));
            });
        });
    });
});