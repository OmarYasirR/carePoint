import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import api from '../services/api.js';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  specialty: '',
  licenseNumber: '',
  yearsOfExperience: '',
  consultationFee: '',
  qualifications: '', // comma-separated in the UI, split before submit
  bio: '',
};

/**
 * Admin-only form for onboarding a new doctor. Creates both the User
 * (role=doctor) and DoctorProfile in one call to POST /api/doctors.
 */
export default function CreateDoctorModal({ onClose, onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const create = useMutation({
    mutationFn: () =>
      api.post('/doctors', {
        ...form,
        yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
        consultationFee: form.consultationFee ? Number(form.consultationFee) : undefined,
        qualifications: form.qualifications
          ? form.qualifications.split(',').map((q) => q.trim()).filter(Boolean)
          : [],
      }),
    onSuccess: (res) => {
      onCreated?.(res.data);
      onClose();
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to create doctor account'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    create.mutate();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-sm font-semibold text-slate-800">Add New Doctor</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="First name" required value={form.firstName} onChange={update('firstName')} />
            <Field label="Last name" required value={form.lastName} onChange={update('lastName')} />
          </div>
          <Field label="Email" type="email" required value={form.email} onChange={update('email')} />
          <Field
            label="Temporary password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={update('password')}
            hint="The doctor can change this after first login."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Phone" value={form.phone} onChange={update('phone')} />
            <Field label="Specialty" required value={form.specialty} onChange={update('specialty')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="License #" value={form.licenseNumber} onChange={update('licenseNumber')} />
            <Field
              label="Years exp."
              type="number"
              min={0}
              value={form.yearsOfExperience}
              onChange={update('yearsOfExperience')}
            />
            <Field
              label="Fee ($)"
              type="number"
              min={0}
              value={form.consultationFee}
              onChange={update('consultationFee')}
            />
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
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-slate-500 px-4 py-2 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="text-sm font-medium bg-brand-primary text-white rounded-lg px-4 py-2 hover:bg-brand-primaryDark disabled:opacity-60"
            >
              {create.isPending ? 'Creating...' : 'Create doctor account'}
            </button>
          </div>
        </form>
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
