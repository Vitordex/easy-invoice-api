const JwtToken = require('./jwt.model.js');

class UserController {
    constructor({
        userService,
        authHash,
        authConfigs,
        mailService
    }) {
        this.mailService = mailService;
        this.userService = userService;

        this.hash = authHash;
        this.tokenExpiration = authConfigs.token.expiration;
        this.tokenOptions = authConfigs.optionals;
    }

    async login(context, next) {
        const requestBody = context.request.body;
        const email = requestBody.email;
        const user = await this.userService.findUser({ email });

        if (!user) {
            context.throw(404, 'Usuário não encontrado');
            return next();
        }

        const password = requestBody.password;
        const match = this.userService.matchPassword(password, user.password);

        if (!match) {
            context.throw(401, 'Não autorizado');
            return next();
        }

        const token = new JwtToken({ id: user.id }, this.hash, this.tokenOptions);

        context.body = { user: this.userService.toJSON(user), token: await token.hash() };
        context.type = 'json';
        return next();
    }

    async verify(context, next) {
        const email = context.request.body.email;

        const user = await this.userService.findUser({ email });
        if (!user) {
            context.throw(404, 'Usuário não encontrado');
            return next();
        }

        const token = new JwtToken(
            { id: user.id, email: user.email },
            this.hash,
            this.tokenOptions
        );

        try {
            await this.mailService.sendMail(
                'Teste Verificação',
                email,
                'Troca de senha - Empresa',
                `Houve uma solicitação de troca de senha 
para este email. Se você deseja realizar a troca 
favor clique no link ${context.request.origin}/users/reset/password?token=${await token.hash()}
Se não ignore este email`
            );
        } catch (error) {
            context.throw(400, 'Email inválido');
            return next();
        }

        context.status = 200;
        return next();
    }

    async resetPassword(context, next) {
        const { token } = context.request.query;
        const emailToken = new JwtToken({}, this.hash, this.tokenOptions);

        let payload;

        try {
            payload = await emailToken.verify(token);
        } catch (error) {
            context.throw(401, 'Token inválido');
            return next();
        }

        const newPassword = context.request.body.password;
        const hashedPass = this.userService.hashPassword(newPassword);

        const user = await this.userService.findUser({ email: payload.email });
        user.password = hashedPass;

        try {
            await user.save();
        } catch (error) {
            context.throw(500, 'Houve um erro ao salvar a senha');
            return next();
        }

        context.status = 200;
        return next();
    }
}

module.exports = UserController;