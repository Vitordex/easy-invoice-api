const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('x-authentication-token');
    if (!token) return res.status(401).send('Access denied. No token provided.');

    try {
        req.user = jwt.verify(token, process.env.SECRET || secret);
        next();
    } catch (e) { res.status(400).send('Invalid token'); }
};