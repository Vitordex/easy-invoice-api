const passport = require('koa-passport');

const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('mongoose').Model; // eslint-disable-line

const { AUTH } = require('../enums');

class AuthService {
    /**
     * Auth Service constructor
     * @param {String} hash The hash for signing the jwt
     * @param {String} tokenExpiration The max expiration of the generated token
     * @param {Object} optionals The optionals settings for the auth middleware
     * @param {User} userModel The model of the user table
     */
    constructor(hash, tokenExpiration, userModel, optionals = {}) {
        passport.use(new JwtStrategy({
            secretOrKey: hash,
            ...optionals,
            ignoreExpiration: !tokenExpiration,
            maxAge: tokenExpiration,
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromHeader(AUTH.TOKEN_HEADER)
            ])
        }, async (jwt_payload, done) => {
            let user, error;
            
            try {
                user = await userModel.findById(jwt_payload.id);   
            } catch (err) {
                error = err;
            }

            done(error, user);
        }));
    }

    initialize() {
        return passport.initialize();
    }

    authenticate() {
        return passport.authenticate(AUTH.JWT_AUTH_METHOD, { session: false });
    }
}

module.exports = AuthService;