const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize, authorizeOwnerOrRoles } = require('../middleware/role');
const {
  listDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  updateAvailability,
  deactivateDoctor,
} = require('../controllers/doctorController');

const router = express.Router();

router.use(protect);

router.get('/', listDoctors);
router.get('/:id', getDoctor);

router.post(
  '/',
  authorize('admin'),
  [
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('specialty').notEmpty(),
  ],
  validate,
  createDoctor
);

router.put('/:id', authorizeOwnerOrRoles('id', 'admin'), updateDoctor);
router.put('/:id/availability', authorizeOwnerOrRoles('id', 'admin'), updateAvailability);
router.delete('/:id', authorize('admin'), deactivateDoctor);

module.exports = router;
