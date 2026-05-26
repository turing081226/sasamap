const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friend.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.use(verifyToken);

router.get('/', friendController.getFriends);
router.post('/request', friendController.requestFriend);
router.get('/requests', friendController.getRequests);
router.put('/:id/accept', friendController.acceptFriend);
router.delete('/:id', friendController.deleteFriend);

module.exports = router;
