const UserService = require('../user/user.service'); // eslint-disable-line
const JwtService = require('../user/jwt.service'); // eslint-disable-line
const ServiceError = require('../log/service.error.model'); // eslint-disable-line

const { AUTH, API: { STATUS } } = require('../enums');

class AuthService {
    /**
     * Auth Service constructor
     * @param {String} hash The hash for signing the jwt
     * @param {String} tokenExpiration The max expiration of the generated token
     * @param {JwtService} jwtService The optionals settings for the auth middleware
     * @param {UserService} userService The service of the user
     * @param {ServiceError} serviceErrorModel
     */
    constructor(jwtService, userService, serviceErrorModel) {
        this.jwtService = jwtService;
        this.userService = userService;
        this.ServiceError = serviceErrorModel;

        this.serviceName = 'auth';
    }

    authenticate() {
        const functionName = 'authenticate';
        const middleware = async (context, next) => {
            const userToken = context.input.headers[AUTH.TOKEN_HEADER];

            const verifyOptions = {
                subject: AUTH.TOKEN_SUBJECT
            };

            let payload;
            try {
                payload = await this.jwtService.verify(userToken, verifyOptions);   
            } catch (error) {
                const jwtError = new this.ServiceError(
                    'Token validation failed',
                    this.serviceName,
                    functionName,
                    context.input,
                    error
                );
                context.throw(STATUS.UNAUTHORIZED, jwtError);

                return;
            }

            try {
                const userId = payload.id;
                const query = {
                    _id: userId
                };
                const user = await this.userService.findUser(query);

                context.state.user = user;
            } catch (error) {
                const serviceError = new this.ServiceError(
                    'Error finding the user',
                    this.serviceName,
                    functionName,
                    context.input,
                    error
                );
                context.throw(STATUS.INTERNAL_ERROR, serviceError);

                return;
            }

            if (!context.state.user) {
                const findError = new this.ServiceError(
                    'Invalid user',
                    this.serviceName,
                    functionName,
                    context.input,
                    'User not found'
                );
                context.throw(STATUS.UNAUTHORIZED, findError);

                return;
            }

            return next();
        };
        return middleware;
    }
}

module.exports = AuthService;