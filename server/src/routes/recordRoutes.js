const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize, authorizeOwnerOrRoles } = require('../middleware/role');
const {
  listRecordsForPatient,
  getRecord,
  createRecord,
  updateRecord,
} = require('../controllers/recordController');

const router = express.Router();

router.use(protect);

router.get('/patient/:patientId', authorizeOwnerOrRoles('patientId', 'admin', 'doctor'), listRecordsForPatient);
router.get('/:id', getRecord);

router.post(
  '/',
  authorize('doctor'),
  [body('patient').notEmpty(), body('diagnosis').optional().isArray()],
  validate,
  createRecord
);

router.put('/:id', authorize('doctor', 'admin'), updateRecord);

module.exports = router;
