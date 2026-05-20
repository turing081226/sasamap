const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/empty', verifyToken, roomController.getEmptyRooms);
router.get('/available', verifyToken, roomController.getAvailableRooms);
router.get('/occupancies', roomController.getAllOccupancies);
router.get('/timetables', roomController.getAllTimetables);
router.get('/', verifyToken, roomController.getAllRooms);
router.get('/:id/status', verifyToken, roomController.getRoomStatus);

module.exports = router;
