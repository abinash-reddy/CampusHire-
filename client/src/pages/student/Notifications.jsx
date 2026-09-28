import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Briefcase,
  Calendar,
  Award,
  Megaphone,
  CheckCheck,
  AlertCircle,
} from 'lucide-react';
import { notificationsApi } from '../../services/api';
import Button from '../../components/common/Button';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationsApi.getAll({ limit: 50 });
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      const res = await notificationsApi.markAllRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.warn('Could not mark all notifications read:', err.message);
    }
  };

  const markSingleRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn('Could not mark notification read:', err.message);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'DRIVE':
        return <Briefcase className="w-5 h-5 text-indigo-600" />;
      case 'INTERVIEW':
        return <Calendar className="w-5 h-5 text-amber-600" />;
      case 'RESULT':
        return <Award className="w-5 h-5 text-emerald-600" />;
      case 'UPDATE':
        return <Megaphone className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-indigo-600" />
            Notification Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Stay updated with recruitment alerts, shortlisted statuses, and interview schedules
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" icon={CheckCheck} onClick={markAllRead}>
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          You have no notifications yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item._id}
              onClick={() => {
                if (!item.isRead) markSingleRead(item._id);
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                item.isRead
                  ? 'bg-white border-slate-200/80 shadow-2xs hover:bg-slate-50/60'
                  : 'bg-indigo-50/40 border-indigo-200 shadow-xs'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-white border border-slate-100 shrink-0 shadow-2xs">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={`text-xs sm:text-sm font-bold truncate ${
                      item.isRead ? 'text-slate-800' : 'text-indigo-950 font-extrabold'
                    }`}
                  >
                    {item.title}
                  </h3>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {item.message}
                </p>
              </div>

              {!item.isRead && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
