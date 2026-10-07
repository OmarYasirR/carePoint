import { useQuery } from '@tanstack/react-query';
import { Users, CalendarCheck, ClipboardList, Stethoscope } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useSelector } from 'react-redux';
import api from '../services/api.js';
import StatCard from '../components/StatCard.jsx';

export default function AdminDashboard() {
  const { user } = useSelector((s) => s.auth);

  const { data: metrics } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: async () => (await api.get('/admin/metrics')).data,
  });

  const { data: trends } = useQuery({
    queryKey: ['admin-trends'],
    queryFn: async () => (await api.get('/admin/appointment-trends?days=7')).data,
  });

  const chartData = (trends || []).map((t) => ({ day: t._id.slice(5), count: t.count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Welcome back, {user?.firstName}!</h1>
        <p className="text-sm text-slate-500">Here's what's happening across the clinic today.</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <StatCard label="Total Patients" value={metrics?.totalPatients ?? '—'} icon={Users} />
        <StatCard label="Today's Appointments" value={metrics?.todaysAppointments ?? '—'} icon={CalendarCheck} />
        <StatCard label="Doctors Online" value={metrics?.doctorsOnline ?? '—'} icon={Stethoscope} />
        <StatCard label="Pending Prescriptions" value={metrics?.pendingPrescriptions ?? 0} icon={ClipboardList} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Appointment Trends</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#0ea5b7" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Recently Added Patients</h3>
          <ul className="space-y-3">
            {(metrics?.recentPatients || []).map((p) => (
              <li key={p._id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-semibold">
                  {p.firstName?.[0]}
                  {p.lastName?.[0]}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700">
                    {p.firstName} {p.lastName}
                  </div>
                  <div className="text-xs text-slate-400">{p.email}</div>
                </div>
              </li>
            ))}
            {(!metrics?.recentPatients || metrics.recentPatients.length === 0) && (
              <p className="text-sm text-slate-400">No recent registrations</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
