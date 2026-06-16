const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/me', verifyToken, authController.me);
router.post('/google', authController.googleLogin);
router.post('/dev', authController.devLogin);
router.post('/logout', authController.logout);

module.exports = router;
