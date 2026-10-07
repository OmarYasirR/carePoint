import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { CalendarPlus, FileText, ClipboardList } from 'lucide-react';
import api from '../services/api.js';

export default function PatientDashboard() {
  const { user } = useSelector((s) => s.auth);

  const { data } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: async () => (await api.get('/appointments', { params: { status: 'Scheduled', limit: 5 } })).data,
  });

  const appointments = data?.data || [];
  const next = appointments[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Hi {user?.firstName}, welcome back!</h1>
        <p className="text-sm text-slate-500">Here's an overview of your care.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/patient/doctors" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-primary transition-colors">
          <CalendarPlus className="text-brand-primary mb-3" size={22} />
          <div className="text-sm font-semibold text-slate-700">Book an appointment</div>
          <div className="text-xs text-slate-400 mt-1">Find a doctor and reserve a slot</div>
        </Link>
        <Link to="/patient/records" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-primary transition-colors">
          <FileText className="text-brand-primary mb-3" size={22} />
          <div className="text-sm font-semibold text-slate-700">Medical records</div>
          <div className="text-xs text-slate-400 mt-1">View your visit history</div>
        </Link>
        <Link to="/patient/prescriptions" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-primary transition-colors">
          <ClipboardList className="text-brand-primary mb-3" size={22} />
          <div className="text-sm font-semibold text-slate-700">Prescriptions</div>
          <div className="text-xs text-slate-400 mt-1">Active and past medications</div>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Next Appointment</h3>
        {next ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-700">
                Dr. {next.doctor?.firstName} {next.doctor?.lastName}
              </div>
              <div className="text-xs text-slate-400">
                {new Date(next.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
            {next.type === 'video' && (
              <Link
                to={`/patient/consultations/${next._id}`}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-primary text-white hover:bg-brand-primaryDark"
              >
                Join call
              </Link>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">You have no upcoming appointments.</p>
        )}
      </div>
    </div>
  );
}
