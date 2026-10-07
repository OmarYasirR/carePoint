import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import api from '../services/api.js';
import DataTable from '../components/DataTable.jsx';
import RescheduleModal from '../components/RescheduleModal.jsx';
import CancelAppointmentModal from '../components/CancelAppointmentModal.jsx';

const STATUS_OPTIONS = ['Scheduled', 'Completed', 'Cancelled', 'No-show'];

export default function Appointments() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(null);
  const [page, setPage] = useState(1);
  const [rescheduling, setRescheduling] = useState(null); // appointment or null
  const [cancelling, setCancelling] = useState(null); // appointment or null
  const { user } = useSelector((s) => s.auth);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['appointments', status, page],
    queryFn: async () => (await api.get('/appointments', { params: { status, page, limit: 10 } })).data,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['appointments'] });

  const updateStatus = useMutation({
    mutationFn: ({ id, status: newStatus }) => api.patch(`/appointments/${id}/status`, { status: newStatus }),
    onSuccess: invalidate,
  });

  const isStaff = user?.role === 'doctor' || user?.role === 'admin';

  const columns = [
    {
      key: 'patient',
      label: 'Patient',
      render: (r) => `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`,
    },
    {
      key: 'doctor',
      label: 'Doctor',
      render: (r) => `Dr. ${r.doctor?.firstName || ''} ${r.doctor?.lastName || ''}`,
    },
    {
      key: 'startTime',
      label: 'Date & Time',
      render: (r) => new Date(r.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
    },
    { key: 'type', label: 'Type', render: (r) => (r.type === 'video' ? 'Video call' : 'In-person') },
    { key: 'reason', label: 'Reason', render: (r) => r.reason || '—' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            {
              Scheduled: 'bg-blue-50 text-blue-600',
              Completed: 'bg-emerald-50 text-emerald-600',
              Cancelled: 'bg-red-50 text-red-500',
              'No-show': 'bg-slate-100 text-slate-500',
            }[r.status]
          }`}
        >
          {r.status}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex flex-wrap gap-2">
          {r.type === 'video' && r.status === 'Scheduled' && (
            <Link
              to={`/${user.role}/consultations/${r._id}`}
              className="text-xs font-medium text-brand-primary hover:underline"
            >
              Join
            </Link>
          )}
          {isStaff && r.status === 'Scheduled' && (
            <>
              <button
                onClick={() => setRescheduling(r)}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:underline"
              >
                <CalendarClock size={13} /> Reschedule
              </button>
              <button
                onClick={() => updateStatus.mutate({ id: r._id, status: 'Completed' })}
                className="text-xs font-medium text-emerald-600 hover:underline"
              >
                Complete
              </button>
              <button
                onClick={() => updateStatus.mutate({ id: r._id, status: 'No-show' })}
                className="text-xs font-medium text-slate-400 hover:underline"
              >
                No-show
              </button>
              <button
                onClick={() => setCancelling(r)}
                className="text-xs font-medium text-red-500 hover:underline"
              >
                Cancel
              </button>
            </>
          )}
          {user.role === 'doctor' && r.status === 'Completed' && (
            <>
              <Link to={`/doctor/records/${r.patient._id}`} className="text-xs font-medium text-brand-primary hover:underline">
                Add record
              </Link>
              <Link to={`/doctor/prescriptions/${r.patient._id}`} className="text-xs font-medium text-brand-primary hover:underline">
                Prescribe
              </Link>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-800">Appointments</h1>
      <DataTable
        columns={columns}
        data={data?.data || []}
        search={search}
        onSearchChange={setSearch}
        statusOptions={STATUS_OPTIONS}
        activeStatus={status}
        onStatusChange={(s) => {
          setStatus(s);
          setPage(1);
        }}
        page={data?.page || 1}
        totalPages={data?.totalPages || 1}
        onPageChange={setPage}
      />

      {rescheduling && (
        <RescheduleModal
          appointment={rescheduling}
          onClose={() => setRescheduling(null)}
          onRescheduled={invalidate}
        />
      )}
      {cancelling && (
        <CancelAppointmentModal
          appointment={cancelling}
          onClose={() => setCancelling(null)}
          onCancelled={invalidate}
        />
      )}
    </div>
  );
}
