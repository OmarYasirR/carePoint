import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FileText, Paperclip, Plus } from 'lucide-react';
import api from '../services/api.js';
import AttachmentUploader from '../components/AttachmentUploader.jsx';

const emptyForm = {
  diagnosis: '',
  diagnosticNotes: '',
  bloodPressure: '',
  heartRateBpm: '',
  weightKg: '',
  temperatureC: '',
};

export default function MedicalRecords() {
  const { user } = useSelector((s) => s.auth);
  const params = useParams();
  const patientId = params.patientId || user._id; // patients view their own
  const [expandedId, setExpandedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [attachments, setAttachments] = useState([]);
  const queryClient = useQueryClient();

  const { data: records } = useQuery({
    queryKey: ['records', patientId],
    queryFn: async () => (await api.get(`/records/patient/${patientId}`)).data,
    enabled: Boolean(patientId),
  });

  const { data: detail } = useQuery({
    queryKey: ['record-detail', expandedId],
    queryFn: async () => (await api.get(`/records/${expandedId}`)).data,
    enabled: Boolean(expandedId),
  });

  const createRecord = useMutation({
    mutationFn: () =>
      api.post('/records', {
        patient: patientId,
        diagnosis: form.diagnosis ? form.diagnosis.split(',').map((d) => d.trim()).filter(Boolean) : [],
        diagnosticNotes: form.diagnosticNotes,
        vitals: {
          bloodPressure: form.bloodPressure || undefined,
          heartRateBpm: form.heartRateBpm ? Number(form.heartRateBpm) : undefined,
          weightKg: form.weightKg ? Number(form.weightKg) : undefined,
          temperatureC: form.temperatureC ? Number(form.temperatureC) : undefined,
        },
        attachments,
      }),
    onSuccess: () => {
      setShowForm(false);
      setForm(emptyForm);
      setAttachments([]);
      queryClient.invalidateQueries({ queryKey: ['records', patientId] });
    },
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Medical Records</h1>
        {user.role === 'doctor' && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1 text-xs font-medium bg-brand-primary text-white rounded-lg px-3 py-2 hover:bg-brand-primaryDark"
          >
            <Plus size={14} /> New record
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">New Visit Record</h3>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis</label>
            <input
              value={form.diagnosis}
              onChange={update('diagnosis')}
              placeholder="Comma-separated, e.g. Hypertension, Type 2 Diabetes"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input placeholder="BP e.g. 120/80" value={form.bloodPressure} onChange={update('bloodPressure')}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
            <input placeholder="Heart rate (bpm)" type="number" value={form.heartRateBpm} onChange={update('heartRateBpm')}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
            <input placeholder="Weight (kg)" type="number" value={form.weightKg} onChange={update('weightKg')}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
            <input placeholder="Temp (°C)" type="number" step="0.1" value={form.temperatureC} onChange={update('temperatureC')}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Diagnostic notes <span className="text-xs text-slate-400 font-normal">(encrypted at rest)</span>
            </label>
            <textarea
              value={form.diagnosticNotes}
              onChange={update('diagnosticNotes')}
              rows={4}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <AttachmentUploader attachments={attachments} onChange={setAttachments} />

          <button
            onClick={() => createRecord.mutate()}
            disabled={createRecord.isPending}
            className="text-sm font-medium bg-brand-primary text-white rounded-lg px-4 py-2 hover:bg-brand-primaryDark disabled:opacity-60"
          >
            {createRecord.isPending ? 'Saving...' : 'Save record'}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {(records || []).map((r) => (
          <div key={r._id} className="bg-white rounded-xl border border-slate-200 p-5">
            <button
              onClick={() => setExpandedId(expandedId === r._id ? null : r._id)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className="bg-brand-primary/10 text-brand-primary p-2 rounded-lg">
                  <FileText size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700">
                    Visit with Dr. {r.doctor?.firstName} {r.doctor?.lastName}
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(r.visitDate).toLocaleDateString([], { dateStyle: 'medium' })}
                    {r.diagnosis?.length > 0 && ` · ${r.diagnosis.join(', ')}`}
                  </div>
                </div>
              </div>
              {r.attachments?.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Paperclip size={12} /> {r.attachments.length}
                </span>
              )}
            </button>

            {expandedId === r._id && detail && (
              <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600 space-y-3">
                {detail.vitals && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {detail.vitals.bloodPressure && <div>BP: {detail.vitals.bloodPressure}</div>}
                    {detail.vitals.heartRateBpm && <div>HR: {detail.vitals.heartRateBpm} bpm</div>}
                    {detail.vitals.weightKg && <div>Weight: {detail.vitals.weightKg} kg</div>}
                    {detail.vitals.temperatureC && <div>Temp: {detail.vitals.temperatureC} °C</div>}
                  </div>
                )}
                {detail.diagnosticNotes && (
                  <p className="text-slate-600 whitespace-pre-wrap">{detail.diagnosticNotes}</p>
                )}
                {detail.attachments?.length > 0 && (
                  <div className="space-y-1">
                    {detail.attachments.map((a, i) => (
                      <a
                        key={i}
                        href={a.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-xs text-brand-primary hover:underline"
                      >
                        <Paperclip size={12} /> {a.fileName}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {(!records || records.length === 0) && (
          <p className="text-sm text-slate-400 text-center py-10">No medical records yet</p>
        )}
      </div>
    </div>
  );
}
