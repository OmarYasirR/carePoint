const asyncHandler = require('express-async-handler');

/**
 * POST /api/uploads
 * Accepts a single multipart file (field name "file") and returns the
 * metadata shape MedicalRecord.attachments / general attachment fields
 * expect: { fileName, fileUrl, fileType }. The record itself is only
 * created afterward (POST /api/records) with this data embedded — this
 * endpoint just handles the binary upload.
 *
 * In production, swap the disk storage in middleware/upload.js for an
 * S3 (or similar) driver and return the resulting bucket URL instead.
 */
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file was uploaded');
  }

  res.status(201).json({
    fileName: req.file.originalname,
    fileUrl: `/uploads/${req.file.filename}`,
    fileType: req.body.fileType || req.file.mimetype,
    sizeBytes: req.file.size,
  });
});

module.exports = { uploadFile };
