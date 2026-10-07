import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { Save, User } from 'lucide-react';
import api from '../services/api.js';
import { setCredentials } from '../features/auth/authSlice.js';

const BLOOD_GROUPS = ['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function toFormState(user, profile) {
  return {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    bloodGroup: profile?.bloodGroup || 'Unknown',
    addressLine1: profile?.address?.line1 || '',
    addressCity: profile?.address?.city || '',
    addressState: profile?.address?.state || '',
    addressPostalCode: profile?.address?.postalCode || '',
    addressCountry: profile?.address?.country || '',
    emergencyName: profile?.emergencyContact?.name || '',
    emergencyRelationship: profile?.emergencyContact?.relationship || '',
    emergencyPhone: profile?.emergencyContact?.phone || '',
    insuranceProvider: profile?.insurance?.provider || '',
    insurancePolicyNumber: profile?.insurance?.policyNumber || '',
    allergies: (profile?.allergies || []).join(', '),
    chronicConditions: (profile?.chronicConditions || []).join(', '),
  };
}

/**
 * Patient's own profile editor — updates both the User (name/phone)
 * and PatientProfile (medical background, address, insurance) via a
 * single PUT /api/patients/:id, which the server splits across both
 * documents (see patientController.updatePatient).
 */
export default function PatientProfile() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/auth/me')).data,
  });

  const [form, setForm] = useState(toFormState(user, null));
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (me) setForm(toFormState(me.user, me.profile));
  }, [me]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const save = useMutation({
    mutationFn: () =>
      api.put(`/patients/${user._id}`, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        bloodGroup: form.bloodGroup,
        address: {
          line1: form.addressLine1,
          city: form.addressCity,
          state: form.addressState,
          postalCode: form.addressPostalCode,
          country: form.addressCountry,
        },
        emergencyContact: {
          name: form.emergencyName,
          relationship: form.emergencyRelationship,
          phone: form.emergencyPhone,
        },
        insurance: {
          provider: form.insuranceProvider,
          policyNumber: form.insurancePolicyNumber,
        },
        allergies: form.allergies.split(',').map((a) => a.trim()).filter(Boolean),
        chronicConditions: form.chronicConditions.split(',').map((c) => c.trim()).filter(Boolean),
      }),
    onSuccess: (res) => {
      // Keep the header/avatar initials in sync if name changed.
      dispatch(setCredentials({ user: res.data, accessToken: sessionStorage.getItem('accessToken') }));
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
          <User size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800">My Profile</h1>
          <p className="text-xs text-slate-400">Keep your details up to date for your care team</p>
        </div>
      </div>

      {success && (
        <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          Profile updated successfully
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="space-y-5"
      >
        <Section title="Basic information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="First name" value={form.firstName} onChange={update('firstName')} required />
            <Field label="Last name" value={form.lastName} onChange={update('lastName')} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Phone" value={form.phone} onChange={update('phone')} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Blood group</label>
              <select
                value={form.bloodGroup}
                onChange={update('bloodGroup')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Email: {me?.user?.email} · Date of birth:{' '}
            {me?.profile?.dateOfBirth ? new Date(me.profile.dateOfBirth).toLocaleDateString() : '—'} (contact
            support to change these)
          </p>
        </Section>

        <Section title="Address">
          <Field label="Street address" value={form.addressLine1} onChange={update('addressLine1')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="City" value={form.addressCity} onChange={update('addressCity')} />
            <Field label="State / Province" value={form.addressState} onChange={update('addressState')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Postal code" value={form.addressPostalCode} onChange={update('addressPostalCode')} />
            <Field label="Country" value={form.addressCountry} onChange={update('addressCountry')} />
          </div>
        </Section>

        <Section title="Emergency contact">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Name" value={form.emergencyName} onChange={update('emergencyName')} />
            <Field label="Relationship" value={form.emergencyRelationship} onChange={update('emergencyRelationship')} />
          </div>
          <Field label="Phone" value={form.emergencyPhone} onChange={update('emergencyPhone')} />
        </Section>

        <Section title="Insurance">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Provider" value={form.insuranceProvider} onChange={update('insuranceProvider')} />
            <Field label="Policy number" value={form.insurancePolicyNumber} onChange={update('insurancePolicyNumber')} />
          </div>
        </Section>

        <Section title="Medical background">
          <Field
            label="Allergies"
            value={form.allergies}
            onChange={update('allergies')}
            hint="Comma-separated, e.g. Penicillin, Peanuts"
          />
          <Field
            label="Chronic conditions"
            value={form.chronicConditions}
            onChange={update('chronicConditions')}
            hint="Comma-separated, e.g. Asthma, Hypertension"
          />
        </Section>

        <button
          type="submit"
          disabled={save.isPending}
          className="flex items-center gap-2 text-sm font-medium bg-brand-primary text-white rounded-lg px-5 py-2.5 hover:bg-brand-primaryDark disabled:opacity-60"
        >
          <Save size={15} /> {save.isPending ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, hint, ...inputProps }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        {...inputProps}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
      />
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
