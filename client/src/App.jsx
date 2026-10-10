import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RoleRoute from './routes/RoleRoute.jsx';
import RedirectIfAuthenticated from './routes/RedirectIfAuthenticated.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import { bootstrapAuth } from './features/auth/authSlice.js';

import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

import AdminDashboard from './pages/AdminDashboard.jsx';
import DoctorDashboard from './pages/DoctorDashboard.jsx';
import PatientDashboard from './pages/PatientDashboard.jsx';

import Patients from './pages/Patients.jsx';
import Doctors from './pages/Doctors.jsx';
import BookAppointment from './pages/BookAppointment.jsx';
import Appointments from './pages/Appointments.jsx';
import Schedules from './pages/Schedules.jsx';
import MedicalRecords from './pages/MedicalRecords.jsx';
import Prescriptions from './pages/Prescriptions.jsx';
import Consultation from './pages/Consultation.jsx';
import Notifications from './pages/Notifications.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import PatientProfile from './pages/PatientProfile.jsx';
import DoctorProfilePage from './pages/DoctorProfilePage.jsx';
import Loader from './components/Loader.jsx';

export default function App() {
  const dispatch = useDispatch();
  const initialized = useSelector((s) => s.auth.initialized);

  // Silent persistent-login check: trades the httpOnly refresh cookie
  // (if still valid — up to 7 days) for a fresh access token before
  // any routing decision is made. See bootstrapAuth in authSlice.js.
  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  if (!initialized) {
    return (
      <div className="fixed inset-0 grid place-items-center">
        <Loader />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthenticated>
            <LoginPage />
          </RedirectIfAuthenticated>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuthenticated>
            <RegisterPage />
          </RedirectIfAuthenticated>
        }
      />
      <Route path="/unauthorized" element={<div className="p-10 text-center text-slate-500">Not authorized</div>} />

      <Route element={<ProtectedRoute />}>
        {/* ---- Admin ---- */}
        <Route element={<RoleRoute allowed={['admin']} />}>
          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="schedules" element={<Schedules />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>

        {/* ---- Doctor ---- */}
        <Route element={<RoleRoute allowed={['doctor']} />}>
          <Route path="/doctor" element={<DashboardLayout />}>
            <Route index element={<DoctorDashboard />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="patients" element={<Patients />} />
            <Route path="records" element={<MedicalRecords />} />
            <Route path="records/:patientId" element={<MedicalRecords />} />
            <Route path="prescriptions" element={<Prescriptions />} />
            <Route path="prescriptions/:patientId" element={<Prescriptions />} />
            <Route path="schedule" element={<Schedules />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="consultations/:appointmentId" element={<Consultation />} />
            <Route path="profile" element={<DoctorProfilePage />} />
          </Route>
        </Route>

        {/* ---- Patient ---- */}
        <Route element={<RoleRoute allowed={['patient']} />}>
          <Route path="/patient" element={<DashboardLayout />}>
            <Route index element={<PatientDashboard />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="doctors/:doctorId/book" element={<BookAppointment />} />
            <Route path="records" element={<MedicalRecords />} />
            <Route path="prescriptions" element={<Prescriptions />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="consultations/:appointmentId" element={<Consultation />} />
            <Route path="profile" element={<PatientProfile />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}