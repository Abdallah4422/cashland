import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ArrowUpRight, ArrowDownLeft, Plus, Info, Trash2, BellOff } from 'lucide-react';
import { useNotifications, type CashlandNotification, type NotifType } from './useNotifications';
import { glass, navyGradient } from './design';

// ── Bell icon with badge ──────────────────────────────────────

export function NotificationBell({ onClick, white }: { onClick: () => void; white?: boolean }) {
  const { unreadCount } = useNotifications();

  return (
    <button
      onClick={onClick}
      className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
      style={white
        ? { background: 'rgba(255,255,255,0.20)', border: '1px solid rgba(255,255,255,0.25)' }
        : { background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(0,0,0,0.08)' }
      }
    >
      <Bell size={18} style={{ color: white ? 'white' : 'var(--ink)' }} />
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1"
            style={{ background: 'var(--error)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ── Notification item ─────────────────────────────────────────

function iconFor(type: NotifType) {
  switch (type) {
    case 'sent': return <ArrowUpRight size={16} style={{ color: 'var(--error)' }} />;
    case 'received': return <ArrowDownLeft size={16} style={{ color: 'var(--brand)' }} />;
    case 'deposit': return <Plus size={16} style={{ color: '#2563EB' }} />;
    default: return <Info size={16} style={{ color: 'var(--muted)' }} />;
  }
}

function bgFor(type: NotifType) {
  switch (type) {
    case 'sent': return 'rgba(229,62,62,0.10)';
    case 'received': return 'var(--brand-light)';
    case 'deposit': return 'rgba(37,99,235,0.10)';
    default: return 'rgba(0,0,0,0.05)';
  }
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NotifItem({ n, onRead }: { n: CashlandNotification; onRead: (id: string) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={() => onRead(n.id)}
      className="flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all active:scale-[0.98] rounded-2xl"
      style={{
        background: n.read ? 'transparent' : 'rgba(0,168,107,0.04)',
        border: n.read ? '1px solid transparent' : '1px solid rgba(0,168,107,0.12)',
      }}
    >
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: bgFor(n.type) }}>
        {iconFor(n.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>{n.title}</p>
          <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>{timeAgo(n.timestamp)}</span>
        </div>
        <p className="text-sm leading-snug" style={{ color: 'var(--subtle)' }}>{n.body}</p>
      </div>
      {!n.read && (
        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ background: 'var(--brand)' }} />
      )}
    </motion.div>
  );
}

// ── Permission prompt ─────────────────────────────────────────

function PermissionPrompt({ onAllow, onDismiss }: { onAllow: () => void; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4 rounded-2xl p-4"
      style={{ ...glass.card, border: '1.5px solid rgba(0,168,107,0.20)' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--brand-light)' }}>
          <Bell size={20} style={{ color: 'var(--brand)' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Enable notifications</p>
          <p className="text-xs" style={{ color: 'var(--subtle)' }}>Get alerts for payments and deposits</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onAllow}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
          style={{ background: navyGradient }}
        >
          Allow
        </button>
        <button
          onClick={onDismiss}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--subtle)' }}
        >
          Not now
        </button>
      </div>
    </motion.div>
  );
}

// ── Drawer ────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NotificationDrawer({ open, onClose }: Props) {
  const { notifs, unreadCount, permission, requestPermission, markAllRead, markRead, clearAll } = useNotifications();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Mark all read when drawer opens
  useEffect(() => {
    if (open && unreadCount > 0) {
      const t = setTimeout(markAllRead, 1200);
      return () => clearTimeout(t);
    }
  }, [open, unreadCount, markAllRead]);

  // Close on outside tap
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)' }}
          />

          {/* Drawer slides down from top */}
          <motion.div
            key="drawer"
            ref={drawerRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="fixed top-0 left-0 right-0 z-50 max-w-md mx-auto"
            style={{
              background: 'rgba(244,250,247,0.98)',
              backdropFilter: 'blur(20px)',
              borderBottomLeftRadius: 24,
              borderBottomRightRadius: 24,
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-12 pb-4">
              <div>
                <h2 className="display text-lg font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <p className="text-xs" style={{ color: 'var(--brand)' }}>{unreadCount} unread</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notifs.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                    style={{ background: 'rgba(229,62,62,0.10)' }}
                    title="Clear all"
                  >
                    <Trash2 size={14} style={{ color: 'var(--error)' }} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                  style={{ background: 'rgba(0,0,0,0.07)' }}
                >
                  <X size={16} style={{ color: 'var(--ink)' }} />
                </button>
              </div>
            </div>

            {/* Permission prompt */}
            {permission === 'default' && (
              <PermissionPrompt
                onAllow={() => { void requestPermission(); }}
                onDismiss={onClose}
              />
            )}

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto px-2 pb-6">
              {notifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ background: 'rgba(0,0,0,0.05)' }}>
                    <BellOff size={28} style={{ color: 'var(--muted)' }} />
                  </div>
                  <p className="text-base font-semibold mb-1" style={{ color: 'var(--ink)' }}>No notifications yet</p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    Activity from payments and deposits will appear here.
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {notifs.map(n => (
                    <NotifItem key={n.id} n={n} onRead={markRead} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
