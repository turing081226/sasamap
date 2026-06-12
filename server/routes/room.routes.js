const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/empty', verifyToken, roomController.getEmptyRooms);
router.get('/available', verifyToken, roomController.getAvailableRooms);
router.get('/occupancies', verifyToken, roomController.getAllOccupancies);
router.get('/timetables', verifyToken, roomController.getAllTimetables);
router.get('/', verifyToken, roomController.getAllRooms);
router.get('/:id/status', verifyToken, roomController.getRoomStatus);

module.exports = router;
