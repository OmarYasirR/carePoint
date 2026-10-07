import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import api from '../services/api.js';

/**
 * Collects a cancellation reason before flipping the appointment's
 * status — the reason is stored on the appointment
 * (cancellationReason) and the patient is notified in real time by
 * the server (see appointmentController.updateStatus).
 */
export default function CancelAppointmentModal({ appointment, onClose, onCancelled }) {
  const [reason, setReason] = useState('');

  const cancel = useMutation({
    mutationFn: () =>
      api.patch(`/appointments/${appointment._id}/status`, {
        status: 'Cancelled',
        cancellationReason: reason,
      }),
    onSuccess: () => {
      onCancelled?.();
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Cancel Appointment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-slate-500">
            Cancel the appointment with {appointment.patient?.firstName} {appointment.patient?.lastName} on{' '}
            {new Date(appointment.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}?
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Reason for cancellation (shared with the patient)"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="text-sm font-medium text-slate-500 px-4 py-2 rounded-lg hover:bg-slate-50">
            Keep appointment
          </button>
          <button
            onClick={() => cancel.mutate()}
            disabled={cancel.isPending}
            className="text-sm font-medium bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-600 disabled:opacity-50"
          >
            {cancel.isPending ? 'Cancelling...' : 'Cancel appointment'}
          </button>
        </div>
      </div>
    </div>
  );
}
