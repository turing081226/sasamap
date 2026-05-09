const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
// const { verifyToken } = require('../middlewares/auth.middleware');

// [임시] 프론트엔드 연동 테스트를 위해 verifyToken 인증 해제
router.get('/', searchController.searchAll);

module.exports = router;
