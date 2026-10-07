const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  listAppointments,
  getAppointment,
  createAppointment,
  updateStatus,
  rescheduleAppointment,
} = require('../controllers/appointmentController');

const router = express.Router();

router.use(protect);

router.get('/', listAppointments);
router.get('/:id', getAppointment);

router.post(
  '/',
  [
    body('doctor').notEmpty().withMessage('doctor is required'),
    body('startTime').isISO8601(),
    body('endTime').isISO8601(),
    body('type').optional().isIn(['in-person', 'video']),
  ],
  validate,
  createAppointment
);

router.patch(
  '/:id/status',
  authorize('doctor', 'admin'),
  [body('status').isIn(['Scheduled', 'Completed', 'Cancelled', 'No-show'])],
  validate,
  updateStatus
);

router.put(
  '/:id/reschedule',
  [body('startTime').isISO8601(), body('endTime').isISO8601()],
  validate,
  rescheduleAppointment
);

module.exports = router;
