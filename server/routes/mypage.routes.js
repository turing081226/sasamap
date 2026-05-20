const express = require('express');
const router = express.Router();
const mypageController = require('../controllers/mypage.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.use(verifyToken);

router.get('/timetable', mypageController.getMyTimetable);
router.post('/timetable', mypageController.updateMyTimetable);
router.post('/plan', mypageController.createPlan);
router.post('/notification', mypageController.setNotification);

// User location occupancy routes
router.get('/occupancy', mypageController.getMyOccupancy);
router.post('/occupancy', mypageController.occupyRoom);
router.delete('/occupancy/:id', mypageController.cancelOccupancy);

module.exports = router;
