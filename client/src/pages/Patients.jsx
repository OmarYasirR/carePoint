import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';
import DataTable from '../components/DataTable.jsx';

export default function Patients() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ['patients', search, page],
    queryFn: async () => (await api.get('/patients', { params: { search, page, limit: 10 } })).data,
  });

  const columns = [
    {
      key: 'name',
      label: 'Patient Name',
      render: (r) => `${r.firstName} ${r.lastName}`,
    },
    {
      key: 'dob',
      label: 'Date of Birth',
      render: (r) => (r.profile?.dateOfBirth ? new Date(r.profile.dateOfBirth).toLocaleDateString() : '—'),
    },
    { key: 'gender', label: 'Gender', render: (r) => r.profile?.gender || '—' },
    { key: 'phone', label: 'Contact' },
    { key: 'email', label: 'Email' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Patients</h1>
      </div>
      <DataTable
        columns={columns}
        data={data?.data || []}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        page={data?.page || 1}
        totalPages={data?.totalPages || 1}
        onPageChange={setPage}
      />
    </div>
  );
}
