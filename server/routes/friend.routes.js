const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friend.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.use(verifyToken);

router.post('/request', friendController.requestFriend);
router.get('/requests', friendController.getRequests);
router.post('/accept/:id', friendController.acceptRequest);
router.delete('/:id', friendController.deleteFriend);
router.get('/', friendController.getFriends);

module.exports = router;
