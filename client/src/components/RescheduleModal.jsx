import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import api from '../services/api.js';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Lets a doctor/admin move an existing appointment to a new open slot.
 * Reuses the same slot-generation endpoint the patient booking flow
 * uses, scoped to the appointment's doctor, and excludes the
 * appointment being moved from the server-side conflict check.
 */
export default function RescheduleModal({ appointment, onClose, onRescheduled }) {
  const [date, setDate] = useState(todayISO());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [error, setError] = useState('');

  const { data: slotsData, isFetching } = useQuery({
    queryKey: ['slots', appointment.doctor._id, date],
    queryFn: async () => (await api.get(`/schedules/${appointment.doctor._id}/slots`, { params: { date } })).data,
  });

  const reschedule = useMutation({
    mutationFn: () =>
      api.put(`/appointments/${appointment._id}/reschedule`, {
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      }),
    onSuccess: () => {
      onRescheduled?.();
      onClose();
    },
    onError: (err) => setError(err.response?.data?.message || 'Unable to reschedule to this slot'),
  });

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Reschedule Appointment</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {appointment.patient?.firstName} {appointment.patient?.lastName} with Dr.{' '}
              {appointment.doctor?.firstName} {appointment.doctor?.lastName}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New date</label>
            <input
              type="date"
              min={todayISO()}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSelectedSlot(null);
              }}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Available times</label>
            {isFetching && <p className="text-sm text-slate-400">Loading slots...</p>}
            {!isFetching && (slotsData?.slots || []).length === 0 && (
              <p className="text-sm text-slate-400">No open slots on this date.</p>
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
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="text-sm font-medium text-slate-500 px-4 py-2 rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => reschedule.mutate()}
            disabled={!selectedSlot || reschedule.isPending}
            className="text-sm font-medium bg-brand-primary text-white rounded-lg px-4 py-2 hover:bg-brand-primaryDark disabled:opacity-50"
          >
            {reschedule.isPending ? 'Saving...' : 'Confirm new time'}
          </button>
        </div>
      </div>
    </div>
  );
}
