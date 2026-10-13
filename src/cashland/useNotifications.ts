import { useState, useCallback, useEffect } from 'react';

export type NotifType = 'sent' | 'received' | 'deposit' | 'info';

export interface CashlandNotification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  amount?: number;
  timestamp: number;
  read: boolean;
}

// Persistent store in sessionStorage so notifications survive HMR
const STORAGE_KEY = 'cashland_notifications';

function loadNotifs(): CashlandNotification[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CashlandNotification[]) : [];
  } catch {
    return [];
  }
}

function saveNotifs(notifs: CashlandNotification[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
  } catch { /* ignore */ }
}

// Global state so multiple components share the same list
let globalNotifs: CashlandNotification[] = loadNotifs();
const listeners = new Set<() => void>();

function notify() {
  saveNotifs(globalNotifs);
  listeners.forEach(fn => fn());
}

export function addNotification(n: Omit<CashlandNotification, 'id' | 'timestamp' | 'read'>) {
  const item: CashlandNotification = {
    ...n,
    id: Math.random().toString(36).slice(2),
    timestamp: Date.now(),
    read: false,
  };
  globalNotifs = [item, ...globalNotifs].slice(0, 40); // cap at 40
  notify();

  // Fire native push if permission granted
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification(item.title, {
        body: item.body,
        icon: '/icon-192.png',
        tag: item.id,
      });
    } catch { /* may throw in sandboxed iframe */ }
  }

  return item.id;
}

export function useNotifications() {
  const [notifs, setNotifs] = useState<CashlandNotification[]>(globalNotifs);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  );

  useEffect(() => {
    const refresh = () => setNotifs([...globalNotifs]);
    listeners.add(refresh);
    return () => { listeners.delete(refresh); };
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      addNotification({
        type: 'info',
        title: 'Cashland notifications on',
        body: "You'll get alerts for payments and deposits.",
      });
    }
  }, []);

  const push = useCallback((n: Omit<CashlandNotification, 'id' | 'timestamp' | 'read'>) => {
    return addNotification(n);
  }, []);

  const markAllRead = useCallback(() => {
    globalNotifs = globalNotifs.map(n => ({ ...n, read: true }));
    notify();
  }, []);

  const markRead = useCallback((id: string) => {
    globalNotifs = globalNotifs.map(n => n.id === id ? { ...n, read: true } : n);
    notify();
  }, []);

  const clearAll = useCallback(() => {
    globalNotifs = [];
    notify();
  }, []);

  const unreadCount = notifs.filter(n => !n.read).length;

  return {
    notifs,
    unreadCount,
    permission,
    requestPermission,
    push,
    markAllRead,
    markRead,
    clearAll,
  };
}

// Convenience senders used by send/deposit success handlers
export function pushSentNotification(recipientName: string, amount: string) {
  addNotification({
    type: 'sent',
    title: 'Payment sent',
    body: `You sent ${amount} to ${recipientName}.`,
  });
}

export function pushReceivedNotification(senderName: string, amount: string) {
  addNotification({
    type: 'received',
    title: 'Money received',
    body: `${senderName} sent you ${amount}.`,
  });
}

export function pushDepositNotification(amount?: string, method?: string) {
  addNotification({
    type: 'deposit',
    title: 'Deposit successful',
    body: amount
      ? `${amount} added via ${method ?? 'bank transfer'}.`
      : 'Your Cashland balance has been updated.',
  });
}
