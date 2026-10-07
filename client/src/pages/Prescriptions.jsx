import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import api from '../services/api.js';

const emptyMed = { name: '', dosage: '', frequency: '', duration: '', instructions: '' };

export default function Prescriptions() {
  const { user } = useSelector((s) => s.auth);
  const params = useParams();
  const patientId = params.patientId || user._id;
  const [showForm, setShowForm] = useState(false);
  const [medications, setMedications] = useState([{ ...emptyMed }]);
  const [notes, setNotes] = useState('');

  const { data: prescriptions, refetch } = useQuery({
    queryKey: ['prescriptions', patientId],
    queryFn: async () => (await api.get(`/prescriptions/patient/${patientId}`)).data,
    enabled: Boolean(patientId),
  });

  const create = useMutation({
    mutationFn: () => api.post('/prescriptions', { patient: patientId, medications, notes }),
    onSuccess: () => {
      setShowForm(false);
      setMedications([{ ...emptyMed }]);
      setNotes('');
      refetch();
    },
  });

  const updateMed = (i, field, value) => {
    setMedications((meds) => meds.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Prescriptions</h1>
        {user.role === 'doctor' && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1 text-xs font-medium bg-brand-primary text-white rounded-lg px-3 py-2 hover:bg-brand-primaryDark"
          >
            <Plus size={14} /> New prescription
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Digital Prescription Writer</h3>
          {medications.map((m, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 items-end">
              <input placeholder="Medication" value={m.name} onChange={(e) => updateMed(i, 'name', e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
              <input placeholder="Dosage" value={m.dosage} onChange={(e) => updateMed(i, 'dosage', e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
              <input placeholder="Frequency" value={m.frequency} onChange={(e) => updateMed(i, 'frequency', e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
              <input placeholder="Duration" value={m.duration} onChange={(e) => updateMed(i, 'duration', e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
              <div className="flex gap-1">
                <input placeholder="Instructions" value={m.instructions} onChange={(e) => updateMed(i, 'instructions', e.target.value)}
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm flex-1" />
                <button onClick={() => setMedications((meds) => meds.filter((_, idx) => idx !== i))}
                  className="text-red-400 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => setMedications((meds) => [...meds, { ...emptyMed }])}
            className="text-xs font-medium text-brand-primary hover:underline"
          >
            + Add medication
          </button>
          <textarea
            placeholder="Additional notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            rows={2}
          />
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="text-sm font-medium bg-brand-primary text-white rounded-lg px-4 py-2 hover:bg-brand-primaryDark disabled:opacity-60"
          >
            {create.isPending ? 'Saving...' : 'Save prescription'}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {(prescriptions || []).map((p) => (
          <div key={p._id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-slate-700">
                Dr. {p.doctor?.firstName} {p.doctor?.lastName}
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-brand-primary/10 text-brand-primary">
                {p.status}
              </span>
            </div>
            <ul className="text-sm text-slate-600 space-y-1">
              {p.medications.map((m, i) => (
                <li key={i}>
                  <span className="font-medium">{m.name}</span> — {m.dosage}, {m.frequency}, {m.duration}
                  {m.instructions && ` (${m.instructions})`}
                </li>
              ))}
            </ul>
            <div className="text-xs text-slate-400 mt-2">
              Issued {new Date(p.issuedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
        {(!prescriptions || prescriptions.length === 0) && (
          <p className="text-sm text-slate-400 text-center py-10">No prescriptions yet</p>
        )}
      </div>
    </div>
  );
}
