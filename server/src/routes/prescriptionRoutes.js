const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize, authorizeOwnerOrRoles } = require('../middleware/role');
const {
  listForPatient,
  getPrescription,
  createPrescription,
  updatePrescriptionStatus,
} = require('../controllers/prescriptionController');

const router = express.Router();

router.use(protect);

router.get('/patient/:patientId', authorizeOwnerOrRoles('patientId', 'admin', 'doctor'), listForPatient);
router.get('/:id', getPrescription);

router.post(
  '/',
  authorize('doctor'),
  [
    body('patient').notEmpty(),
    body('medications').isArray({ min: 1 }).withMessage('At least one medication is required'),
  ],
  validate,
  createPrescription
);

router.patch(
  '/:id/status',
  authorize('doctor', 'admin'),
  [body('status').isIn(['Active', 'Fulfilled', 'Expired', 'Cancelled'])],
  validate,
  updatePrescriptionStatus
);

module.exports = router;
