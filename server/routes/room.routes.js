const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');

router.get('/empty', roomController.getEmptyRooms);
router.get('/available', roomController.getAvailableRooms);
router.get('/occupancies', roomController.getAllOccupancies);
router.get('/timetables', roomController.getAllTimetables);
router.get('/', roomController.getAllRooms);
router.get('/:id/status', roomController.getRoomStatus);

module.exports = router;
