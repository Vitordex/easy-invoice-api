const passport = require('koa-passport');

const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const { AUTH } = require('../enums');

class AuthService {
    constructor(hash, tokenExpiration, optionals = {}) {
        passport.use(new JwtStrategy({
            secretOrKey: hash,
            ...optionals,
            ignoreExpiration: !tokenExpiration,
            maxAge: tokenExpiration,
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromHeader(AUTH.TOKEN_HEADER)
            ])
        }, (jwt_payload, done) => {
            done(null, true);
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