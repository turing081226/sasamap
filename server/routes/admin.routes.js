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
// Teachers
router.get('/teachers', adminController.getAllTeachers);
router.post('/teachers', adminController.createTeacher);
router.put('/teachers/:id', adminController.updateTeacher);
router.delete('/teachers/:id', adminController.deleteTeacher);

// Rooms
router.get('/rooms', adminController.getAllRooms);
router.post('/rooms', adminController.createRoom);
router.put('/rooms/:id', adminController.updateRoomInfo);
router.put('/rooms/:id/status', adminController.updateRoomStatus);
router.delete('/rooms/:id', adminController.deleteRoom);

module.exports = router;

