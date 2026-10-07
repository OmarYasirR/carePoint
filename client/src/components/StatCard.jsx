export default function StatCard({ label, value, delta, icon: Icon }) {
  const positive = typeof delta === 'number' ? delta >= 0 : true;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex-1 min-w-[160px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        {Icon && (
          <div className="bg-brand-primary/10 text-brand-primary p-1.5 rounded-lg">
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-slate-800">{value}</span>
        {delta !== undefined && (
          <span className={`text-xs font-medium mb-1 ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
            {positive ? '+' : ''}
            {delta}%
          </span>
        )}
      </div>
    </div>
  );
}
