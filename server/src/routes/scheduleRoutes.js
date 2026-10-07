const express = require('express');
const { protect } = require('../middleware/auth');
const { authorizeOwnerOrRoles } = require('../middleware/role');
const {
  getWeeklySchedule,
  getAvailableSlots,
  setWeeklySchedule,
} = require('../controllers/scheduleController');

const router = express.Router();

router.use(protect);

router.get('/:doctorId', getWeeklySchedule);
router.get('/:doctorId/slots', getAvailableSlots);
router.put('/:doctorId', authorizeOwnerOrRoles('doctorId', 'admin'), setWeeklySchedule);

module.exports = router;
