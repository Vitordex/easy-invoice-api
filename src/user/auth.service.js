const passport = require('koa-passport');

const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

class AuthService {
    constructor(hash, tokenExpiration, optionals = {}) {
        passport.use(new JwtStrategy({
            secretOrKey: hash,
            ...optionals,
            ignoreExpiration: !tokenExpiration,
            maxAge: tokenExpiration,
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                ExtractJwt.fromUrlQueryParameter('token')
            ])
        }, (jwt_payload, done) => {
            done(null, true);
        }));
    }

    initialize() {
        return passport.initialize();
    }

    authenticate() {
        return passport.authenticate('jwt', { session: false });
    }
}

module.exports = AuthService;