const express = require('express');
const { protect } = require('../middleware/auth');
const { createOrGetRoom, saveLiveNotes } = require('../controllers/consultationController');

const router = express.Router();

router.use(protect);

router.post('/:appointmentId/room', createOrGetRoom);
router.post('/:appointmentId/notes', saveLiveNotes);

module.exports = router;
