const asyncHandler = require('express-async-handler');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function fromMinutes(mins, baseDate) {
  const d = new Date(baseDate);
  d.setHours(0, mins, 0, 0);
  return d;
}

/**
 * GET /api/schedules/:doctorId
 * Returns the doctor's raw weekly template (shifts + breaks per weekday).
 */
const getWeeklySchedule = asyncHandler(async (req, res) => {
  const profile = await DoctorProfile.findOne({ user: req.params.doctorId });
  if (!profile) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }
  res.json(profile.weeklyAvailability);
});

/**
 * GET /api/schedules/:doctorId/slots?date=YYYY-MM-DD
 * Expands the weekday's shift(s) into concrete bookable slots, minus
 * break windows and already-booked appointments — this is what the
 * booking UI renders as clickable time buttons.
 */
const getAvailableSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date) {
    res.status(400);
    throw new Error('date query param (YYYY-MM-DD) is required');
  }

  const profile = await DoctorProfile.findOne({ user: req.params.doctorId });
  if (!profile) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const targetDate = new Date(`${date}T00:00:00`);
  const weekday = targetDate.getDay();
  const dayTemplate = profile.weeklyAvailability.find((d) => d.weekday === weekday);

  if (!dayTemplate || !dayTemplate.isWorkingDay || dayTemplate.shifts.length === 0) {
    return res.json({ date, slots: [] });
  }

  // Existing appointments for that doctor on that day, to exclude booked slots.
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);
  const existing = await Appointment.find({
    doctor: req.params.doctorId,
    status: { $ne: 'Cancelled' },
    startTime: { $gte: dayStart, $lte: dayEnd },
  }).select('startTime endTime');

  const bookedRanges = existing.map((a) => [a.startTime.getTime(), a.endTime.getTime()]);
  const breakRanges = (dayTemplate.breaks || []).map((b) => [toMinutes(b.startTime), toMinutes(b.endTime)]);

  const slots = [];
  dayTemplate.shifts.forEach((shift) => {
    const start = toMinutes(shift.startTime);
    const end = toMinutes(shift.endTime);
    const step = shift.slotDurationMinutes || 15;

    for (let t = start; t + step <= end; t += step) {
      const inBreak = breakRanges.some(([bs, be]) => t < be && t + step > bs);
      if (inBreak) continue;

      const slotStart = fromMinutes(t, targetDate);
      const slotEnd = fromMinutes(t + step, targetDate);
      const isBooked = bookedRanges.some(
        ([bs, be]) => slotStart.getTime() < be && slotEnd.getTime() > bs
      );
      if (!isBooked) {
        slots.push({ startTime: slotStart, endTime: slotEnd });
      }
    }
  });

  res.json({ date, slots });
});

/**
 * PUT /api/schedules/:doctorId
 * Doctor (own) or admin — replaces the full weekly template.
 */
const setWeeklySchedule = asyncHandler(async (req, res) => {
  const { weeklyAvailability } = req.body;
  const profile = await DoctorProfile.findOneAndUpdate(
    { user: req.params.doctorId },
    { $set: { weeklyAvailability } },
    { new: true, runValidators: true }
  );
  if (!profile) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }
  res.json(profile.weeklyAvailability);
});

module.exports = { getWeeklySchedule, getAvailableSlots, setWeeklySchedule };
