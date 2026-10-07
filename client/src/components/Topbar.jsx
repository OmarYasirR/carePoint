import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Bell, LogOut, ChevronDown, UserRound, Menu } from 'lucide-react';
import api from '../services/api.js';
import { logout } from '../features/auth/authSlice.js';
import { disconnectSocket, getSocket } from '../services/socket.js';

export default function Topbar({ title, onMenuClick }) {
  const { user } = useSelector((s) => s.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data: notifData, refetch: refetchUnread } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => (await api.get('/notifications', { params: { unreadOnly: true, limit: 1 } })).data,
    refetchInterval: 60 * 1000, // fallback poll in case a socket event is missed
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => refetchUnread();
    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchUnread]);

  const unreadCount = notifData?.unreadCount || 0;
  const rolePrefix = { admin: '/admin', doctor: '/doctor', patient: '/patient' }[user?.role] || '';

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      disconnectSocket();
      dispatch(logout());
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 gap-3">
      <button
        onClick={onMenuClick}
        className="text-slate-500 hover:text-brand-primary transition-colors lg:hidden shrink-0"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      <div className="flex items-center gap-3 flex-1 min-w-0 max-w-md">
        <div className="relative w-full min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            placeholder="Search"
            className="w-full min-w-0 bg-slate-100 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
      </div>

      {title && <h2 className="hidden md:block text-sm font-medium text-slate-500 mx-4 shrink-0">{title}</h2>}

      <div className="flex items-center gap-4 shrink-0">
        <Link to={`${rolePrefix}/notifications`} className="relative text-slate-500 hover:text-brand-primary transition-colors">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2"
          >
            <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm font-semibold">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-slate-800">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-slate-400 capitalize">{user?.role}</div>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-100 py-1">
              {(user?.role === 'patient' || user?.role === 'doctor') && (
                <Link
                  to={`${rolePrefix}/profile`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <UserRound size={14} /> My Profile
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
