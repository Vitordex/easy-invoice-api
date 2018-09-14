const router = require('express').Router();
const requires_login = require('../middleware/requireLogin');
const user = require('../schemas/user');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const secret = "orcamento-facil";

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: { user: "t35t3t@gmail.com", pass: "Teste_123" }
});

router.post('/login', async (req, res) => {
    const { error } = user.validate.login(req.body);
    if (error) { 
        console.log(error);
        return res.status(400).send(error.details[0].message);
    }

    const _user = await user.find.byEmail(req.body);
    if (!_user) 
        return res.status(401).end("Invalid email or password");

    if (!await user.authenticate(req.body)) 
        return res.status(401).end("Invalid email or password");

    if (!_user.isValid())
        return res.status(401).end("Account not activated");

    res.header('x-authentication-token', _user.generateToken());
    res.json(_user);
});

// Send Registration Email
router.post('/register', async (req, res) => {
    const { error } = user.validate.register(req.body);
    if (error) {
        console.log(error);
        return res.status(400).send(error.details[0].message); 
    }

    if (await user.find.byEmail(req.body)) return res.status(400).send("User already exists");

    user.register(req.body).then(async _user => {
        transporter.sendMail({ from: 'Suporte <suporte@orcamentofacil.com>',
                            to: _user.email,
                            subject: 'Verificação de Email',
                            text: `http://127.0.0.1/auth/confirm?token=${_user.generateToken()}`,
                            html: '' })
                            .then(() => { return res.status(200).send(); })
                            .catch(err => {
                                console.log(err);
                                return res.status(400).send(err);
                            });
    }).catch(err => {
        console.log(err);
        return res.status(400).send(err);
    });
});

router.get('/:event', async (req, res) => {
    const { event } = req.params;
    const { token } = req.query;

    if (!token) return res.status(400).send();

    const id = user.verifyToken(token, process.env.SECRET || secret);
    if (!id) return res.status(400).send();

    const _user = await user.find.byID(id);
    if (!_user) return res.status(400).send();

    switch (event) {
        case 'recover':
            // DO recover password
            return res.status(200).send();
            break;
        case 'confirm':
            _user.activate(true);
            return res.status(200).send();
        default:
            return res.status(400).send();
    }
});

router.post('/recover', requires_login, async (req, res) => {
    const { error } = user.validate.email(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    
    const _user = await user.find.byEmail(req.body);
    if (!_user) 
        return res.status(400).send("User doesn't exists");
    if (!_user.isValid())
        return res.status(400).send("User is deactivate");
    
    transporter.sendMail({ from: 'Suporte <suporte@orcamentofacil.com>',
                            to: _user.email,
                            subject: 'Verificação de Email',
                            text: `http://127.0.0.1/auth/recover?token=${_user.generateToken()}`,
                            html: '' })
                            .then(() => { return res.status(200).send(); })
                            .catch(err => {
                                console.log(err);
                                return res.status(400).send(err);
                            });
});

module.exports = router;