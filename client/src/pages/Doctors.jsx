import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../services/api.js';
import CreateDoctorModal from '../components/CreateDoctorModal.jsx';

export default function Doctors() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { user } = useSelector((s) => s.auth);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['doctors', search],
    queryFn: async () => (await api.get('/doctors', { params: { search } })).data,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-lg font-bold text-slate-800">
          {user?.role === 'patient' ? 'Find a Doctor' : 'Doctors'}
        </h1>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctors..."
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1 text-xs font-medium bg-brand-primary text-white rounded-lg px-3 py-2.5 hover:bg-brand-primaryDark whitespace-nowrap"
            >
              <Plus size={14} /> New Doctor
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data?.data || []).map((d) => (
          <div key={d._id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-semibold">
                {d.firstName?.[0]}
                {d.lastName?.[0]}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  Dr. {d.firstName} {d.lastName}
                </div>
                <div className="text-xs text-slate-400">{d.profile?.specialty}</div>
              </div>
              {d.profile?.isOnline && (
                <span className="ml-auto w-2.5 h-2.5 rounded-full bg-emerald-500" title="Online" />
              )}
            </div>
            <p className="text-xs text-slate-500 mb-4 line-clamp-2">{d.profile?.bio}</p>
            {user?.role === 'patient' && (
              <Link
                to={`/patient/doctors/${d._id}/book`}
                className="block text-center text-xs font-medium bg-brand-primary text-white rounded-lg py-2 hover:bg-brand-primaryDark"
              >
                Book appointment
              </Link>
            )}
            {user?.role === 'admin' && (
              <div className="text-xs text-slate-400">
                {d.email} {d.phone && `· ${d.phone}`}
              </div>
            )}
          </div>
        ))}
        {(data?.data || []).length === 0 && (
          <p className="text-sm text-slate-400 col-span-full text-center py-10">No doctors found</p>
        )}
      </div>

      {showCreate && (
        <CreateDoctorModal
          onClose={() => setShowCreate(false)}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ['doctors'] })}
        />
      )}
    </div>
  );
}
