import { useState, useRef } from 'react';
import { Paperclip, X, Loader2, FileText } from 'lucide-react';
import api from '../services/api.js';

/**
 * Uploads one or more files to POST /api/uploads (multipart) and
 * accumulates the returned { fileName, fileUrl, fileType } metadata
 * via onChange — the shape MedicalRecord.attachments expects.
 */
export default function AttachmentUploader({ attachments, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError('');
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post('/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploaded.push(data);
      }
      onChange([...(attachments || []), ...uploaded]);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Check file type and size (max 10MB).');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAttachment = (i) => {
    onChange(attachments.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Attachments</label>

      <div className="space-y-2 mb-2">
        {(attachments || []).map((a, i) => (
          <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <a
              href={a.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs text-slate-600 hover:text-brand-primary truncate"
            >
              <FileText size={14} className="shrink-0" />
              <span className="truncate">{a.fileName}</span>
            </a>
            <button type="button" onClick={() => removeAttachment(i)} className="text-slate-400 hover:text-red-500 shrink-0">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <label className="flex items-center gap-2 text-xs font-medium text-brand-primary cursor-pointer hover:underline w-fit">
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
        {uploading ? 'Uploading...' : 'Attach lab results, imaging, or reports'}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
          onChange={handleFiles}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
