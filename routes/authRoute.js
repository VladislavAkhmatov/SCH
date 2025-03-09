const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

router.get('/get-role', authController.getRole);
router.post('/login', authController.login);

module.exports = router;