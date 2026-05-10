const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/google', authController.googleLogin);
router.post('/mock-login', authController.mockLogin);

module.exports = router;

