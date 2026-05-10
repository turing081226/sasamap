const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/empty', verifyToken, roomController.getEmptyRooms);
router.get('/:id/status', verifyToken, roomController.getRoomStatus);
router.get('/timetables', roomController.getAllTimetables);

module.exports = router;
