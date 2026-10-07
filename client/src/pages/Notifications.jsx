import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../services/api.js';
import { getSocket } from '../services/socket.js';

/**
 * Notification feed backed by the persisted Notification collection
 * (GET /api/notifications), topped up live via the `notification:new`
 * Socket.io event so new items appear instantly without a refetch.
 */
export default function Notifications() {
  const queryClient = useQueryClient();
  const [liveItems, setLiveItems] = useState([]);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications', { params: { limit: 30 } })).data,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (payload) => setLiveItems((prev) => [payload, ...prev]);
    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, []);

  const markAsRead = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      setLiveItems([]);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Live items are already persisted server-side by the time they're
  // emitted, so once a refetch happens they'll show up in `data` too —
  // dedupe by _id, preferring the persisted (fetched) copy.
  const persistedIds = new Set((data?.data || []).map((n) => n._id));
  const merged = [...liveItems.filter((n) => !persistedIds.has(n._id)), ...(data?.data || [])];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">
          Notifications
          {data?.unreadCount > 0 && (
            <span className="ml-2 text-xs font-medium bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">
              {data.unreadCount} unread
            </span>
          )}
        </h1>
        {data?.unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead.mutate()}
            className="flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
          >
            <CheckCheck size={14} /> Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-50">
        {merged.map((n, i) => (
          <button
            key={n._id || i}
            onClick={() => n._id && !n.isRead && markAsRead.mutate(n._id)}
            className={`flex items-start gap-3 px-5 py-4 w-full text-left hover:bg-slate-50/60 ${
              n.isRead ? '' : 'bg-brand-primary/[0.03]'
            }`}
          >
            <div className="bg-brand-primary/10 text-brand-primary p-2 rounded-lg mt-0.5">
              <Bell size={14} />
            </div>
            <div className="flex-1">
              <div className="text-sm text-slate-700">{n.message}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {new Date(n.at || n.createdAt).toLocaleString()}
              </div>
            </div>
            {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand-primary mt-2 shrink-0" />}
          </button>
        ))}
        {merged.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-10">No notifications</p>
        )}
      </div>
    </div>
  );
}
