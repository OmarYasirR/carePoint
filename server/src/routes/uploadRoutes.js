const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { upload } = require('../middleware/upload');
const { uploadFile } = require('../controllers/uploadController');

const router = express.Router();

router.use(protect);

// Doctors and admins attach lab results / imaging / reports to records.
router.post('/', authorize('doctor', 'admin'), upload.single('file'), uploadFile);

module.exports = router;
