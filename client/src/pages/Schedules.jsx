import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Plus, Trash2, Save } from 'lucide-react';
import api from '../services/api.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function defaultDay(weekday) {
  return { weekday, isWorkingDay: false, shifts: [], breaks: [] };
}

export default function Schedules() {
  const { user } = useSelector((s) => s.auth);
  const doctorId = user._id; // doctor editing their own; admin variant could accept :doctorId param

  const { data, isSuccess } = useQuery({
    queryKey: ['schedule', doctorId],
    queryFn: async () => (await api.get(`/schedules/${doctorId}`)).data,
  });

  const [days, setDays] = useState(() => WEEKDAYS.map((_, i) => defaultDay(i)));

  useEffect(() => {
    if (isSuccess && data) {
      const merged = WEEKDAYS.map((_, i) => data.find((d) => d.weekday === i) || defaultDay(i));
      setDays(merged);
    }
  }, [isSuccess, data]);

  const save = useMutation({
    mutationFn: () => api.put(`/schedules/${doctorId}`, { weeklyAvailability: days }),
  });

  const toggleWorking = (i) => {
    setDays((d) => d.map((day, idx) => (idx === i ? { ...day, isWorkingDay: !day.isWorkingDay } : day)));
  };

  const addShift = (i) => {
    setDays((d) =>
      d.map((day, idx) =>
        idx === i
          ? {
              ...day,
              shifts: [
                ...day.shifts,
                { startTime: '09:00', endTime: '17:00', slotDurationMinutes: 15, maxPatientsPerSlot: 1 },
              ],
            }
          : day
      )
    );
  };

  const updateShift = (i, si, field, value) => {
    setDays((d) =>
      d.map((day, idx) =>
        idx === i
          ? { ...day, shifts: day.shifts.map((s, sidx) => (sidx === si ? { ...s, [field]: value } : s)) }
          : day
      )
    );
  };

  const removeShift = (i, si) => {
    setDays((d) =>
      d.map((day, idx) => (idx === i ? { ...day, shifts: day.shifts.filter((_, sidx) => sidx !== si) } : day))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">My Weekly Schedule</h1>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="flex items-center gap-1 text-xs font-medium bg-brand-primary text-white rounded-lg px-3 py-2 hover:bg-brand-primaryDark disabled:opacity-60"
        >
          <Save size={14} /> {save.isPending ? 'Saving...' : 'Save schedule'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {days.map((day, i) => (
          <div key={i} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={day.isWorkingDay} onChange={() => toggleWorking(i)} />
                {WEEKDAYS[i]}
              </label>
              {day.isWorkingDay && (
                <button onClick={() => addShift(i)} className="flex items-center gap-1 text-xs text-brand-primary hover:underline">
                  <Plus size={12} /> Add shift
                </button>
              )}
            </div>

            {day.isWorkingDay &&
              day.shifts.map((shift, si) => (
                <div key={si} className="flex flex-wrap items-center gap-2 mb-2 pl-6">
                  <input type="time" value={shift.startTime} onChange={(e) => updateShift(i, si, 'startTime', e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs" />
                  <span className="text-xs text-slate-400">to</span>
                  <input type="time" value={shift.endTime} onChange={(e) => updateShift(i, si, 'endTime', e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs" />
                  <input type="number" min={5} value={shift.slotDurationMinutes}
                    onChange={(e) => updateShift(i, si, 'slotDurationMinutes', Number(e.target.value))}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-20" title="Slot duration (min)" />
                  <span className="text-xs text-slate-400">min slots</span>
                  <input type="number" min={1} value={shift.maxPatientsPerSlot}
                    onChange={(e) => updateShift(i, si, 'maxPatientsPerSlot', Number(e.target.value))}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs w-16" title="Max per slot" />
                  <span className="text-xs text-slate-400">max/slot</span>
                  <button onClick={() => removeShift(i, si)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
