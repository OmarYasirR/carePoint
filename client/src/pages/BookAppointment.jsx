import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Video, MapPin } from 'lucide-react';
import api from '../services/api.js';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Patient-facing booking flow for /patient/doctors/:doctorId/book.
 * 1. Pick a date
 * 2. GET /api/schedules/:doctorId/slots?date= expands the doctor's
 *    weekly template into open slots for that day
 * 3. Pick a slot + visit type + reason
 * 4. POST /api/appointments — server re-validates for conflicts
 *    (handles the race where someone else grabbed the slot first)
 */
export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const [date, setDate] = useState(todayISO());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [type, setType] = useState('in-person');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: doctor } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: async () => (await api.get(`/doctors/${doctorId}`)).data,
  });

  const { data: slotsData, isFetching: loadingSlots } = useQuery({
    queryKey: ['slots', doctorId, date],
    queryFn: async () => (await api.get(`/schedules/${doctorId}/slots`, { params: { date } })).data,
    enabled: Boolean(doctorId && date),
  });

  const book = useMutation({
    mutationFn: () =>
      api.post('/appointments', {
        doctor: doctorId,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        type,
        reason,
      }),
    onSuccess: () => setSuccess(true),
    onError: (err) => {
      setError(err.response?.data?.message || 'Unable to book this slot. Please try another.');
      setSelectedSlot(null);
    },
  });

  const handleDateChange = (e) => {
    setDate(e.target.value);
    setSelectedSlot(null);
    setError('');
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4">
          <CalendarDays size={24} />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Appointment booked</h2>
        <p className="text-sm text-slate-500 mb-6">
          Your {type === 'video' ? 'video consultation' : 'in-person visit'} with Dr. {doctor?.firstName}{' '}
          {doctor?.lastName} is confirmed for{' '}
          {new Date(selectedSlot.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.
        </p>
        <button
          onClick={() => navigate('/patient/appointments')}
          className="bg-brand-primary text-white text-sm font-medium rounded-lg px-5 py-2.5 hover:bg-brand-primaryDark"
        >
          View my appointments
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand-primary"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-semibold">
            {doctor?.firstName?.[0]}
            {doctor?.lastName?.[0]}
          </div>
          <div>
            <div className="text-base font-semibold text-slate-800">
              Dr. {doctor?.firstName} {doctor?.lastName}
            </div>
            <div className="text-xs text-slate-400">{doctor?.profile?.specialty}</div>
          </div>
          {doctor?.profile?.consultationFee > 0 && (
            <div className="ml-auto text-sm font-semibold text-slate-700">
              ${doctor.profile.consultationFee}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Visit type</label>
          <div className="flex gap-2">
            <button
              onClick={() => setType('in-person')}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border ${
                type === 'in-person'
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <MapPin size={14} /> In-person
            </button>
            <button
              onClick={() => setType('video')}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border ${
                type === 'video'
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Video size={14} /> Video call
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
          <input
            type="date"
            min={todayISO()}
            value={date}
            onChange={handleDateChange}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Available times</label>
          {loadingSlots && <p className="text-sm text-slate-400">Loading slots...</p>}
          {!loadingSlots && (slotsData?.slots || []).length === 0 && (
            <p className="text-sm text-slate-400">No open slots on this date — try another day.</p>
          )}
          <div className="flex flex-wrap gap-2">
            {(slotsData?.slots || []).map((slot) => {
              const isSelected = selectedSlot?.startTime === slot.startTime;
              return (
                <button
                  key={slot.startTime}
                  onClick={() => setSelectedSlot(slot)}
                  className={`text-xs font-medium px-3 py-2 rounded-lg border ${
                    isSelected
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Reason for visit (optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Briefly describe what you'd like to discuss..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>

        <button
          onClick={() => book.mutate()}
          disabled={!selectedSlot || book.isPending}
          className="w-full bg-brand-primary text-white text-sm font-medium rounded-lg py-2.5 hover:bg-brand-primaryDark disabled:opacity-50"
        >
          {book.isPending ? 'Booking...' : selectedSlot ? 'Confirm appointment' : 'Select a time slot'}
        </button>
      </div>
    </div>
  );
}
