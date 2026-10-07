import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Save, Circle } from 'lucide-react';
import api from '../services/api.js';

/**
 * Doctor's own profile editor — mirrors PatientProfile.jsx for role
 * parity. Edits both the base User fields (name/phone) and the
 * DoctorProfile fields (specialty/bio/fee/etc) in one save, same
 * pattern as patientController.updatePatient on the server.
 */
export default function DoctorProfilePage() {
  const { user } = useSelector((s) => s.auth);
  const queryClient = useQueryClient();

  const { data, isSuccess } = useQuery({
    queryKey: ['doctor-self', user._id],
    queryFn: async () => (await api.get(`/doctors/${user._id}`)).data,
  });

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    specialty: '',
    qualifications: '',
    licenseNumber: '',
    yearsOfExperience: '',
    consultationFee: '',
    bio: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isSuccess && data) {
      setForm({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        specialty: data.profile?.specialty || '',
        qualifications: (data.profile?.qualifications || []).join(', '),
        licenseNumber: data.profile?.licenseNumber || '',
        yearsOfExperience: data.profile?.yearsOfExperience ?? '',
        consultationFee: data.profile?.consultationFee ?? '',
        bio: data.profile?.bio || '',
      });
    }
  }, [isSuccess, data]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const save = useMutation({
    mutationFn: () =>
      api.put(`/doctors/${user._id}`, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        specialty: form.specialty,
        qualifications: form.qualifications.split(',').map((q) => q.trim()).filter(Boolean),
        licenseNumber: form.licenseNumber,
        yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
        consultationFee: form.consultationFee ? Number(form.consultationFee) : undefined,
        bio: form.bio,
      }),
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['doctor-self', user._id] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const toggleOnline = useMutation({
    mutationFn: () => api.put(`/doctors/${user._id}`, { isOnline: !data?.profile?.isOnline }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-self', user._id] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
  });

  const isOnline = Boolean(data?.profile?.isOnline);

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">My Profile</h1>
        <button
          onClick={() => toggleOnline.mutate()}
          disabled={toggleOnline.isPending}
          className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
            isOnline
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
              : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}
        >
          <Circle size={10} className={isOnline ? 'fill-emerald-500 text-emerald-500' : 'fill-slate-400 text-slate-400'} />
          {isOnline ? 'Online — visible to patients' : 'Offline'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="First name" value={form.firstName} onChange={update('firstName')} />
          <Field label="Last name" value={form.lastName} onChange={update('lastName')} />
        </div>
        <Field label="Phone" value={form.phone} onChange={update('phone')} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Specialty" value={form.specialty} onChange={update('specialty')} />
          <Field label="License #" value={form.licenseNumber} onChange={update('licenseNumber')} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Years of experience" type="number" min={0} value={form.yearsOfExperience} onChange={update('yearsOfExperience')} />
          <Field label="Consultation fee ($)" type="number" min={0} value={form.consultationFee} onChange={update('consultationFee')} />
        </div>
        <Field
          label="Qualifications"
          value={form.qualifications}
          onChange={update('qualifications')}
          hint="Comma-separated, e.g. MD, FACC"
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={update('bio')}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="flex items-center gap-1 text-sm font-medium bg-brand-primary text-white rounded-lg px-4 py-2 hover:bg-brand-primaryDark disabled:opacity-60"
          >
            <Save size={14} /> {save.isPending ? 'Saving...' : 'Save changes'}
          </button>
          {saved && <span className="text-xs text-emerald-600">Saved</span>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, ...inputProps }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        {...inputProps}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
      />
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
