import { useState, useEffect, useCallback } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────
export type AlertCondition = 'below' | 'above' | 'any_change';
export type AlertMode = 'buy' | 'rent' | 'land' | 'commercial';
export type AlertStatus = 'active' | 'triggered' | 'paused';

export interface PriceAlert {
  id: string;
  label: string;               // e.g. "2BHK Wagholi, Pune"
  city: string;
  area: string;
  mode: AlertMode;
  condition: AlertCondition;
  targetPrice: number;         // in absolute ₹
  lastKnownPrice: number;
  currentPrice?: number;
  status: AlertStatus;
  createdAt: number;
  triggeredAt?: number;
  triggerCount: number;
  notifyBrowser: boolean;
  percentChange?: number;
}

export interface AlertCheckResult {
  alert: PriceAlert;
  triggered: boolean;
  direction?: 'up' | 'down';
  changePercent?: number;
}

// ─── STORAGE KEY ─────────────────────────────────────────────────────────────
const STORAGE_KEY = 'qc_price_alerts';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const loadAlerts = (): PriceAlert[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveAlerts = (alerts: PriceAlert[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch {}
};

export const formatPrice = (price: number): string => {
  if (price >= 1e7) return `₹${(price / 1e7).toFixed(2)} Cr`;
  if (price >= 1e5) return `₹${(price / 1e5).toFixed(1)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
};

export const parseRawPrice = (raw: string): number => {
  if (!raw) return 0;
  const cleaned = raw.replace(/[₹,\s]/g, '').toLowerCase();
  if (cleaned.includes('cr')) return parseFloat(cleaned) * 1e7;
  if (cleaned.includes('l') || cleaned.includes('lac') || cleaned.includes('lakh'))
    return parseFloat(cleaned) * 1e5;
  if (cleaned.includes('k')) return parseFloat(cleaned) * 1e3;
  return parseFloat(cleaned) || 0;
};

// ─── CHECK IF ALERT SHOULD FIRE ──────────────────────────────────────────────
const shouldTrigger = (alert: PriceAlert, currentPrice: number): boolean => {
  if (alert.status !== 'active') return false;
  if (currentPrice <= 0) return false;

  switch (alert.condition) {
    case 'below':
      return currentPrice <= alert.targetPrice;
    case 'above':
      return currentPrice >= alert.targetPrice;
    case 'any_change': {
      const changePct = Math.abs((currentPrice - alert.lastKnownPrice) / alert.lastKnownPrice) * 100;
      return changePct >= 5; // trigger on ≥5% change
    }
    default:
      return false;
  }
};

// ─── BROWSER NOTIFICATION ─────────────────────────────────────────────────────
const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission();
  }
  return Notification.permission;
};

const fireNotification = (alert: PriceAlert, currentPrice: number) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const direction = currentPrice > alert.lastKnownPrice ? '📈 Rising' : '📉 Falling';
  const change = ((currentPrice - alert.lastKnownPrice) / alert.lastKnownPrice * 100).toFixed(1);

  const title = `🔔 QuantCasa Alert: ${alert.label}`;
  const body =
    alert.condition === 'any_change'
      ? `${direction} ${Math.abs(Number(change))}% · Now ${formatPrice(currentPrice)}`
      : alert.condition === 'below'
      ? `Price dropped below your target! Now ${formatPrice(currentPrice)}`
      : `Price crossed your target! Now ${formatPrice(currentPrice)}`;

  try {
    const n = new Notification(title, {
      body,
      icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='M25 75 L52 45 L79 75' stroke='%23585FD8' stroke-width='8' fill='none'/></svg>",
      badge: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%23585FD8'/></svg>",
      tag: alert.id,
      requireInteraction: false,
    });
    n.onclick = () => { window.focus(); n.close(); };
    setTimeout(() => n.close(), 8000);
  } catch {}
};

// ─── HOOK ─────────────────────────────────────────────────────────────────────
export const usePriceAlerts = () => {
  const [alerts, setAlerts] = useState<PriceAlert[]>(loadAlerts);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [recentTriggers, setRecentTriggers] = useState<AlertCheckResult[]>([]);

  // Persist on every change
  useEffect(() => { saveAlerts(alerts); }, [alerts]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    return perm;
  }, []);

  // Add a new alert
  const addAlert = useCallback((
    params: Pick<PriceAlert, 'label' | 'city' | 'area' | 'mode' | 'condition' | 'targetPrice' | 'lastKnownPrice' | 'notifyBrowser'>
  ): PriceAlert => {
    const alert: PriceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...params,
      status: 'active',
      createdAt: Date.now(),
      triggerCount: 0,
    };
    setAlerts(prev => [alert, ...prev]);
    return alert;
  }, []);

  // Remove an alert
  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  // Toggle pause/active
  const toggleAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === id
        ? { ...a, status: a.status === 'active' ? 'paused' : 'active' }
        : a
    ));
  }, []);

  // Reset a triggered alert back to active
  const resetAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'active', triggeredAt: undefined } : a
    ));
  }, []);

  // Clear all triggered
  const clearTriggered = useCallback(() => {
    setAlerts(prev => prev.filter(a => a.status !== 'triggered'));
  }, []);

  // Check a price against all matching alerts
  const checkPrice = useCallback((
    city: string,
    area: string,
    mode: AlertMode,
    currentPrice: number
  ): AlertCheckResult[] => {
    const results: AlertCheckResult[] = [];

    setAlerts(prev => prev.map(alert => {
      const matches =
        alert.status === 'active' &&
        alert.mode === mode &&
        alert.city.toLowerCase() === city.toLowerCase() &&
        (alert.area === '' || alert.area.toLowerCase() === area.toLowerCase());

      if (!matches) return alert;

      const triggered = shouldTrigger(alert, currentPrice);
      const direction: 'up' | 'down' = currentPrice >= alert.lastKnownPrice ? 'up' : 'down';
      const changePercent = alert.lastKnownPrice > 0
        ? ((currentPrice - alert.lastKnownPrice) / alert.lastKnownPrice) * 100
        : 0;

      results.push({ alert, triggered, direction, changePercent });

      if (triggered) {
        if (alert.notifyBrowser) fireNotification(alert, currentPrice);
        return {
          ...alert,
          status: 'triggered' as AlertStatus,
          currentPrice,
          triggeredAt: Date.now(),
          triggerCount: alert.triggerCount + 1,
          percentChange: changePercent,
        };
      }

      // Update last known price even if not triggered
      return { ...alert, currentPrice, lastKnownPrice: currentPrice };
    }));

    if (results.some(r => r.triggered)) {
      setRecentTriggers(results.filter(r => r.triggered));
    }

    return results;
  }, []);

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const triggeredCount = alerts.filter(a => a.status === 'triggered').length;
  const unreadCount = triggeredCount;

  return {
    alerts,
    activeCount,
    triggeredCount,
    unreadCount,
    notifPermission,
    recentTriggers,
    addAlert,
    removeAlert,
    toggleAlert,
    resetAlert,
    clearTriggered,
    checkPrice,
    requestPermission,
    formatPrice,
  };
};
