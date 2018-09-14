const router = require('express').Router();
const requires_login = require('../middleware/requireLogin');
const user = require('../schemas/user');
const bcrypt = require('bcrypt');

router.post('/', requires_login, async (req, res) => { 
    let response = await user.find.byID(req.user._id);
    res.json(response);
});

router.delete('/', requires_login, async (req, res) => {
    res.json(await user.remove(req.user._id));
});

router.put('/', requires_login, async (req, res) => {});

module.exports = router;