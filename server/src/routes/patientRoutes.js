const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize, authorizeOwnerOrRoles } = require('../middleware/role');
const {
  listPatients,
  getPatient,
  updatePatient,
  deactivatePatient,
} = require('../controllers/patientController');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'doctor'), listPatients);
router.get('/:id', authorizeOwnerOrRoles('id', 'admin', 'doctor'), getPatient);
router.put('/:id', authorizeOwnerOrRoles('id', 'admin', 'doctor'), updatePatient);
router.delete('/:id', authorize('admin'), deactivatePatient);

module.exports = router;
