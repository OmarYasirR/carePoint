import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Generic table with built-in search box, optional status filter
 * pills, and pagination — used across Patients, Doctors, Appointments,
 * Records and Prescriptions list screens.
 *
 * columns: [{ key, label, render? }]
 * data: array of row objects
 */
export default function DataTable({
  columns,
  data,
  search,
  onSearchChange,
  statusOptions,
  activeStatus,
  onStatusChange,
  page = 1,
  totalPages = 1,
  onPageChange,
}) {
  const [localSearch, setLocalSearch] = useState(search || '');

  const handleSearch = (e) => {
    setLocalSearch(e.target.value);
    onSearchChange?.(e.target.value);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            value={localSearch}
            onChange={handleSearch}
            placeholder="Search..."
            className="w-full bg-slate-100 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>

        {statusOptions && (
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange?.(s === activeStatus ? null : s)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  activeStatus === s
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                  No records found
                </td>
              </tr>
            )}
            {data.map((row, i) => (
              <tr key={row._id || row.id || i} className="border-b border-slate-50 hover:bg-slate-50/60">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-slate-700">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Page {page} of {totalPages || 1}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="p-1.5 rounded-md border border-slate-200 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="p-1.5 rounded-md border border-slate-200 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
