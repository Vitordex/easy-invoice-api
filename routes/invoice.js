const router = require('express').Router();
const requires_login = require('../middleware/requireLogin');
const bcrypt = require('bcrypt');

router.post('/', requires_login, async (req, res) => {});
router.delete('/', requires_login, async (req, res) => {});
router.put('/', requires_login, async (req, res) => {});

module.exports = router;