import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { CalendarCheck, Users, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import StatCard from '../components/StatCard.jsx';

export default function DoctorDashboard() {
  const { user } = useSelector((s) => s.auth);

  const { data } = useQuery({
    queryKey: ['doctor-today-appointments'],
    queryFn: async () => {
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      const to = new Date();
      to.setHours(23, 59, 59, 999);
      const res = await api.get('/appointments', {
        params: { from: from.toISOString(), to: to.toISOString(), limit: 20 },
      });
      return res.data;
    },
  });

  const appointments = data?.data || [];
  const upcoming = appointments.filter((a) => a.status === 'Scheduled');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Good to see you, Dr. {user?.lastName}!</h1>
        <p className="text-sm text-slate-500">Here's your schedule for today.</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <StatCard label="Today's Appointments" value={appointments.length} icon={CalendarCheck} />
        <StatCard label="Upcoming" value={upcoming.length} icon={Users} />
        <StatCard
          label="Video Consultations"
          value={appointments.filter((a) => a.type === 'video').length}
          icon={Video}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Today's Schedule</h3>
        </div>
        <ul className="divide-y divide-slate-50">
          {appointments.map((a) => (
            <li key={a._id} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="text-sm font-medium text-slate-700">
                  {a.patient?.firstName} {a.patient?.lastName}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {a.reason || 'General consultation'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-brand-primary/10 text-brand-primary">
                  {a.status}
                </span>
                {a.type === 'video' && (
                  <Link
                    to={`/doctor/consultations/${a._id}`}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-primary text-white hover:bg-brand-primaryDark"
                  >
                    Join
                  </Link>
                )}
              </div>
            </li>
          ))}
          {appointments.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-slate-400">No appointments scheduled today</li>
          )}
        </ul>
      </div>
    </div>
  );
}
