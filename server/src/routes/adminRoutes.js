const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  getDashboardMetrics,
  getAppointmentTrends,
  listUsers,
  createStaffUser,
  toggleUserStatus,
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/metrics', getDashboardMetrics);
router.get('/appointment-trends', getAppointmentTrends);
router.get('/users', listUsers);
router.post(
  '/users',
  [
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
  ],
  validate,
  createStaffUser
);
router.patch('/users/:id/status', [body('isActive').isBoolean()], validate, toggleUserStatus);

module.exports = router;
