const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

router.use(verifyToken);
router.use(isAdmin);

// Users
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);

// Timetables
router.get('/timetables', adminController.getAllTimetables);
router.post('/timetables', adminController.createTimetable);
router.put('/timetables/:id', adminController.updateTimetable);
router.delete('/timetables/:id', adminController.deleteTimetable);
router.post('/timetable', adminController.uploadTimetable); // bulk upload

// Rooms
router.get('/rooms', adminController.getAllRooms);
router.put('/rooms/:id/status', adminController.updateRoomStatus);

module.exports = router;

