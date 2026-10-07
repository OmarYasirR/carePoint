import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Stethoscope, CalendarDays, FileText,
  ClipboardList, CalendarClock, Bell, ShieldCheck, Activity, X,
} from 'lucide-react';

// Nav items per role — mirrors the reference design's left rail.
const NAV_BY_ROLE = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/patients', label: 'Patients', icon: Users },
    { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
    { to: '/admin/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/admin/schedules', label: 'Schedules', icon: CalendarClock },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/users', label: 'User Management', icon: ShieldCheck },
  ],
  doctor: [
    { to: '/doctor', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/doctor/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/doctor/patients', label: 'Patients', icon: Users },
    { to: '/doctor/records', label: 'Medical Records', icon: FileText },
    { to: '/doctor/prescriptions', label: 'Prescriptions', icon: ClipboardList },
    { to: '/doctor/schedule', label: 'My Schedule', icon: CalendarClock },
    { to: '/doctor/notifications', label: 'Notifications', icon: Bell },
  ],
  patient: [
    { to: '/patient', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/patient/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/patient/doctors', label: 'Find a Doctor', icon: Stethoscope },
    { to: '/patient/records', label: 'Medical Records', icon: FileText },
    { to: '/patient/prescriptions', label: 'Prescriptions', icon: ClipboardList },
    { to: '/patient/notifications', label: 'Notifications', icon: Bell },
  ],
};

/**
 * Below the `lg` breakpoint this renders as an off-canvas drawer
 * (fixed, slid out of view via `-translate-x-full`, toggled by
 * `open`) with a backdrop that closes it on tap. At `lg` and above it
 * reverts to the original always-visible static rail — the transform
 * and backdrop classes are simply inert there.
 */
export default function Sidebar({ role, open, onClose }) {
  const items = NAV_BY_ROLE[role] || [];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-64 shrink-0 bg-brand-navy text-slate-300 h-screen flex flex-col
          fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:sticky lg:top-0 lg:z-auto`}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="bg-brand-primary/20 p-1.5 rounded-lg">
              <Activity className="text-brand-accent" size={20} />
            </div>
            <div>
              <div className="text-white font-bold leading-tight">CarePoint</div>
              <div className="text-[10px] text-slate-400 leading-tight">Clinic Management System</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white lg:hidden" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 mt-4 space-y-1 overflow-y-auto">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-primary text-white'
                    : 'text-slate-300 hover:bg-brand-navyLight hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
