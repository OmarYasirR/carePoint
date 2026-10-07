import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Plus, UserX, UserCheck } from 'lucide-react';
import api from '../services/api.js';
import DataTable from '../components/DataTable.jsx';

const ROLE_TABS = ['admin', 'doctor', 'patient'];
const emptyForm = { firstName: '', lastName: '', email: '', password: '', phone: '' };

export default function AdminUsers() {
  const { user: currentUser } = useSelector((s) => s.auth);
  const [role, setRole] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['admin-users', role, search, page],
    queryFn: async () => (await api.get('/admin/users', { params: { role, search, page, limit: 10 } })).data,
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/admin/users/${id}/status`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const createStaff = useMutation({
    mutationFn: () => api.post('/admin/users', form),
    onSuccess: () => {
      setShowCreate(false);
      setForm(emptyForm);
      setFormError('');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err) => setFormError(err.response?.data?.message || 'Failed to create account'),
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const columns = [
    { key: 'name', label: 'Name', render: (r) => `${r.firstName} ${r.lastName}` },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
    {
      key: 'role',
      label: 'Role',
      render: (r) => <span className="capitalize text-xs font-medium">{r.role}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            r.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {r.isActive ? 'Active' : 'Deactivated'}
        </span>
      ),
    },
    {
      key: 'joined',
      label: 'Joined',
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: '',
      render: (r) =>
        r._id === currentUser._id ? (
          <span className="text-xs text-slate-300">You</span>
        ) : (
          <button
            onClick={() => toggleStatus.mutate({ id: r._id, isActive: !r.isActive })}
            className={`flex items-center gap-1 text-xs font-medium hover:underline ${
              r.isActive ? 'text-red-500' : 'text-emerald-600'
            }`}
          >
            {r.isActive ? (
              <>
                <UserX size={13} /> Deactivate
              </>
            ) : (
              <>
                <UserCheck size={13} /> Reactivate
              </>
            )}
          </button>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">User Management</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 text-xs font-medium bg-brand-primary text-white rounded-lg px-3 py-2 hover:bg-brand-primaryDark"
        >
          <Plus size={14} /> New Admin
        </button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        statusOptions={ROLE_TABS}
        activeStatus={role}
        onStatusChange={(r) => {
          setRole(r);
          setPage(1);
        }}
        page={data?.page || 1}
        totalPages={data?.totalPages || 1}
        onPageChange={setPage}
      />

      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">Add Admin Account</h2>
            </div>

            {formError && (
              <div className="mx-6 mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {formError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setFormError('');
                createStaff.mutate();
              }}
              className="px-6 py-4 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input required placeholder="First name" value={form.firstName} onChange={update('firstName')}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <input required placeholder="Last name" value={form.lastName} onChange={update('lastName')}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <input required type="email" placeholder="Email" value={form.email} onChange={update('email')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input required type="password" minLength={8} placeholder="Temporary password" value={form.password} onChange={update('password')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Phone (optional)" value={form.phone} onChange={update('phone')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="text-sm font-medium text-slate-500 px-4 py-2 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createStaff.isPending}
                  className="text-sm font-medium bg-brand-primary text-white rounded-lg px-4 py-2 hover:bg-brand-primaryDark disabled:opacity-60"
                >
                  {createStaff.isPending ? 'Creating...' : 'Create account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
