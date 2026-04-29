const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, searchController.searchAll);

module.exports = router;
