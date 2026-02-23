import React, { useState, useCallback } from 'react';
import {
  Bell, BellOff, BellRing, X, Plus, Trash2, Play, Pause,
  RefreshCw, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown,
  ChevronDown, Sparkles, Info, Shield, Zap, Clock, Target,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import {
  PriceAlert, AlertCondition, AlertMode,
  usePriceAlerts, formatPrice, parseRawPrice
} from './hooks/usePriceAlerts';

// ─── PROPS ────────────────────────────────────────────────────────────────────
interface PriceAlertPanelProps {
  onClose: () => void;
  // Pre-fill from current valuation
  prefill?: {
    city: string;
    area: string;
    mode: AlertMode;
    currentPrice: number;
    label: string;
  };
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: PriceAlert['status'] }> = ({ status }) => {
  const config = {
    active: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/25', dot: 'bg-emerald-400', label: 'Active' },
    triggered: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/25', dot: 'bg-orange-400', label: 'Triggered' },
    paused: { bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500/20', dot: 'bg-gray-500', label: 'Paused' },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${config.bg} ${config.text} border ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === 'active' ? 'animate-pulse' : ''}`}/>
      {config.label}
    </span>
  );
};

const ConditionTag: React.FC<{ condition: AlertCondition; target: number }> = ({ condition, target }) => {
  const config = {
    below: { icon: <ArrowDownRight size={11}/>, label: `Below ${formatPrice(target)}`, color: 'text-emerald-400' },
    above: { icon: <ArrowUpRight size={11}/>, label: `Above ${formatPrice(target)}`, color: 'text-red-400' },
    any_change: { icon: <Zap size={11}/>, label: '≥5% Change', color: 'text-yellow-400' },
  }[condition];

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${config.color}`}>
      {config.icon}{config.label}
    </span>
  );
};

// ─── CREATE ALERT FORM ────────────────────────────────────────────────────────
const CreateAlertForm: React.FC<{
  prefill?: PriceAlertPanelProps['prefill'];
  onSave: (params: Parameters<ReturnType<typeof usePriceAlerts>['addAlert']>[0]) => void;
  onCancel: () => void;
  notifPermission: NotificationPermission;
  onRequestPermission: () => void;
}> = ({ prefill, onSave, onCancel, notifPermission, onRequestPermission }) => {
  const [city, setCity] = useState(prefill?.city || '');
  const [area, setArea] = useState(prefill?.area || '');
  const [mode, setMode] = useState<AlertMode>(prefill?.mode || 'buy');
  const [condition, setCondition] = useState<AlertCondition>('below');
  const [targetInput, setTargetInput] = useState(
    prefill?.currentPrice ? String(Math.round(prefill.currentPrice * 0.95 / 100000) * 100000) : ''
  );
  const [label, setLabel] = useState(prefill?.label || '');
  const [notifyBrowser, setNotifyBrowser] = useState(notifPermission === 'granted');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!city.trim()) { setError('City is required'); return; }
    if (!label.trim()) { setError('Label is required'); return; }
    const targetPrice = Number(targetInput);
    if (!targetPrice || targetPrice <= 0) { setError('Enter a valid target price (₹)'); return; }
    const lastKnownPrice = prefill?.currentPrice || targetPrice;

    onSave({ label: label.trim(), city: city.trim(), area: area.trim(), mode, condition, targetPrice, lastKnownPrice, notifyBrowser });
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-neo-neon/50 transition-all placeholder:text-gray-600 font-medium";
  const labelCls = "text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block";

  return (
    <div className="space-y-4 p-5 bg-[#0a0a14] rounded-3xl border border-white/5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-xl bg-neo-neon/10 border border-neo-neon/20 flex items-center justify-center">
          <Plus size={16} className="text-neo-neon"/>
        </div>
        <h4 className="font-black text-white text-sm uppercase tracking-tight">New Price Alert</h4>
      </div>

      {/* Label */}
      <div>
        <label className={labelCls}>Alert Label</label>
        <input className={inputCls} placeholder="e.g. 2BHK Wagholi, Pune" value={label} onChange={e => setLabel(e.target.value)}/>
      </div>

      {/* City + Area */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>City</label>
          <input className={inputCls} placeholder="e.g. Pune" value={city} onChange={e => setCity(e.target.value)}/>
        </div>
        <div>
          <label className={labelCls}>Area (optional)</label>
          <input className={inputCls} placeholder="e.g. Wagholi" value={area} onChange={e => setArea(e.target.value)}/>
        </div>
      </div>

      {/* Mode */}
      <div>
        <label className={labelCls}>Property Type</label>
        <div className="grid grid-cols-4 gap-2">
          {(['buy', 'rent', 'land', 'commercial'] as AlertMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                mode === m
                  ? 'bg-neo-neon text-white border-neo-neon shadow-[0_0_12px_rgba(88,95,216,0.4)]'
                  : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/15'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className={labelCls}>Alert Condition</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'below', label: 'Price Falls Below', icon: <ArrowDownRight size={13}/>, color: 'text-emerald-400' },
            { value: 'above', label: 'Price Rises Above', icon: <ArrowUpRight size={13}/>, color: 'text-red-400' },
            { value: 'any_change', label: 'Any 5%+ Change', icon: <Zap size={13}/>, color: 'text-yellow-400' },
          ].map(c => (
            <button
              key={c.value}
              onClick={() => setCondition(c.value as AlertCondition)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                condition === c.value
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white/3 border-white/5 text-gray-500 hover:border-white/10'
              }`}
            >
              <span className={condition === c.value ? c.color : ''}>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target Price */}
      {condition !== 'any_change' && (
        <div>
          <label className={labelCls}>Target Price (₹)</label>
          <input
            className={inputCls}
            type="number"
            placeholder="e.g. 7500000"
            value={targetInput}
            onChange={e => setTargetInput(e.target.value)}
          />
          {targetInput && Number(targetInput) > 0 && (
            <p className="text-[10px] text-neo-neon mt-1 font-semibold">{formatPrice(Number(targetInput))}</p>
          )}
        </div>
      )}

      {/* Browser notifications */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/3 border border-white/5">
        <div className="flex items-center gap-2.5">
          <Bell size={15} className={notifyBrowser ? 'text-neo-neon' : 'text-gray-500'}/>
          <div>
            <p className="text-[11px] font-black text-white">Browser Notifications</p>
            <p className="text-[10px] text-gray-600">
              {notifPermission === 'granted' ? 'Permission granted' :
               notifPermission === 'denied' ? 'Blocked in browser settings' : 'Click to enable'}
            </p>
          </div>
        </div>
        {notifPermission === 'granted' ? (
          <button
            onClick={() => setNotifyBrowser(v => !v)}
            className={`w-11 h-6 rounded-full transition-all relative ${notifyBrowser ? 'bg-neo-neon' : 'bg-white/10'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notifyBrowser ? 'left-6' : 'left-1'}`}/>
          </button>
        ) : notifPermission === 'default' ? (
          <button
            onClick={onRequestPermission}
            className="text-[9px] font-black text-neo-neon uppercase tracking-widest px-3 py-1.5 bg-neo-neon/10 rounded-xl border border-neo-neon/20"
          >
            Enable
          </button>
        ) : (
          <span className="text-[9px] text-gray-600 uppercase font-semibold">Blocked</span>
        )}
      </div>

      {error && (
        <p className="text-[11px] text-red-400 flex items-center gap-1.5">
          <AlertTriangle size={12}/>{error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-2xl bg-white/5 text-gray-400 hover:text-white text-[11px] font-black uppercase tracking-widest transition-all border border-white/5"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-3 rounded-2xl bg-neo-neon text-white text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(88,95,216,0.4)]"
        >
          Set Alert
        </button>
      </div>
    </div>
  );
};

// ─── ALERT CARD ───────────────────────────────────────────────────────────────
const AlertCard: React.FC<{
  alert: PriceAlert;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  onReset: (id: string) => void;
}> = ({ alert, onRemove, onToggle, onReset }) => {
  const isTriggered = alert.status === 'triggered';
  const isPaused = alert.status === 'paused';

  return (
    <div className={`group p-4 rounded-2xl border transition-all ${
      isTriggered
        ? 'bg-orange-500/5 border-orange-500/20'
        : isPaused
        ? 'bg-white/2 border-white/5 opacity-60'
        : 'bg-white/3 border-white/5 hover:border-white/10'
    }`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <StatusBadge status={alert.status}/>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
              alert.mode === 'buy' ? 'bg-neo-neon/15 text-neo-neon' :
              alert.mode === 'rent' ? 'bg-emerald-500/15 text-emerald-400' :
              alert.mode === 'land' ? 'bg-orange-500/15 text-orange-400' :
              'bg-purple-500/15 text-purple-400'
            }`}>{alert.mode}</span>
          </div>
          <p className="font-black text-white text-sm truncate">{alert.label}</p>
          <p className="text-[11px] text-gray-500">{alert.city}{alert.area ? ` · ${alert.area}` : ''}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Toggle pause */}
          <button
            onClick={() => onToggle(alert.id)}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play size={12}/> : <Pause size={12}/>}
          </button>
          {/* Reset triggered */}
          {isTriggered && (
            <button
              onClick={() => onReset(alert.id)}
              className="w-7 h-7 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 flex items-center justify-center text-orange-400 transition-all"
              title="Reset alert"
            >
              <RefreshCw size={12}/>
            </button>
          )}
          {/* Remove */}
          <button
            onClick={() => onRemove(alert.id)}
            className="w-7 h-7 rounded-lg bg-red-500/0 hover:bg-red-500/15 flex items-center justify-center text-gray-600 hover:text-red-400 transition-all"
            title="Delete alert"
          >
            <Trash2 size={12}/>
          </button>
        </div>
      </div>

      {/* Condition + Price row */}
      <div className="flex items-center justify-between mb-2">
        <ConditionTag condition={alert.condition} target={alert.targetPrice}/>
        {alert.currentPrice && alert.currentPrice !== alert.lastKnownPrice && (
          <div className="flex items-center gap-1 text-[10px]">
            {alert.currentPrice > alert.lastKnownPrice
              ? <TrendingUp size={11} className="text-red-400"/>
              : <TrendingDown size={11} className="text-emerald-400"/>}
            <span className={alert.currentPrice > alert.lastKnownPrice ? 'text-red-400' : 'text-emerald-400'}>
              {alert.percentChange !== undefined ? `${Math.abs(alert.percentChange).toFixed(1)}%` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Triggered message */}
      {isTriggered && alert.triggeredAt && (
        <div className="mt-2 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/15 flex items-center gap-2">
          <BellRing size={13} className="text-orange-400 flex-shrink-0"/>
          <div>
            <p className="text-[10px] font-black text-orange-400">Alert Triggered!</p>
            <p className="text-[10px] text-gray-500">
              {new Date(alert.triggeredAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              {alert.currentPrice ? ` · ${formatPrice(alert.currentPrice)}` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 mt-2">
        <span className="text-[9px] text-gray-600 flex items-center gap-1">
          <Clock size={9}/>
          {new Date(alert.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
        {alert.triggerCount > 0 && (
          <span className="text-[9px] text-gray-600 flex items-center gap-1">
            <BellRing size={9}/>
            Fired {alert.triggerCount}×
          </span>
        )}
        {alert.notifyBrowser && (
          <span className="text-[9px] text-neo-neon flex items-center gap-1">
            <Bell size={9}/>
            Push on
          </span>
        )}
      </div>
    </div>
  );
};

// ─── MAIN PANEL ───────────────────────────────────────────────────────────────
const PriceAlertPanel: React.FC<PriceAlertPanelProps> = ({ onClose, prefill }) => {
  const {
    alerts, activeCount, triggeredCount, unreadCount,
    notifPermission, addAlert, removeAlert, toggleAlert,
    resetAlert, clearTriggered, requestPermission,
  } = usePriceAlerts();

  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'triggered' | 'paused'>('all');

  // Auto-open form if prefill provided and no existing alert for this combo
  const alreadyHasAlert = prefill && alerts.some(
    a => a.city === prefill.city && a.area === prefill.area && a.mode === prefill.mode
  );

  const filtered = alerts.filter(a => filter === 'all' ? true : a.status === filter);

  const handleSave = (params: Parameters<typeof addAlert>[0]) => {
    addAlert(params);
    setShowForm(false);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-2xl flex items-center justify-end">
      <div className="w-full max-w-md h-full bg-[#0d0d1a] border-l border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">

        {/* ── HEADER ── */}
        <div className="p-6 border-b border-white/5 bg-gradient-to-r from-[#1a1a2e] to-transparent flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-neo-neon/10 border border-neo-neon/20 flex items-center justify-center">
                  <Bell size={18} className="text-neo-neon"/>
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-tighter">Price Alerts</h2>
                <p className="text-[10px] text-neo-neon uppercase tracking-widest font-semibold">
                  {activeCount} active · {triggeredCount} triggered
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
              <X size={18} className="text-gray-400"/>
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Active', value: activeCount, color: 'text-emerald-400' },
              { label: 'Triggered', value: triggeredCount, color: 'text-orange-400' },
              { label: 'Total', value: alerts.length, color: 'text-neo-neon' },
            ].map(s => (
              <div key={s.label} className="p-2.5 rounded-xl bg-white/3 border border-white/5 text-center">
                <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── NOTIFICATION PERMISSION BANNER ── */}
        {notifPermission === 'default' && (
          <div className="mx-4 mt-4 p-3.5 rounded-2xl bg-neo-neon/5 border border-neo-neon/20 flex items-center gap-3">
            <BellRing size={16} className="text-neo-neon flex-shrink-0"/>
            <div className="flex-1">
              <p className="text-[11px] font-black text-white">Enable push notifications</p>
              <p className="text-[10px] text-gray-500">Get alerted even when the app is closed</p>
            </div>
            <button
              onClick={requestPermission}
              className="px-3 py-1.5 bg-neo-neon text-white text-[9px] font-black uppercase tracking-widest rounded-xl flex-shrink-0"
            >
              Allow
            </button>
          </div>
        )}

        {/* ── PREFILL CTA ── */}
        {prefill && !alreadyHasAlert && !showForm && (
          <div className="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 flex items-start gap-3">
            <Sparkles size={16} className="text-emerald-400 flex-shrink-0 mt-0.5"/>
            <div className="flex-1">
              <p className="text-[11px] font-black text-white mb-0.5">Set alert for current property?</p>
              <p className="text-[10px] text-gray-500">{prefill.label} · {formatPrice(prefill.currentPrice)}</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-3 py-1.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl flex-shrink-0 hover:scale-105 transition-all"
            >
              Set
            </button>
          </div>
        )}

        {/* ── FILTER TABS ── */}
        <div className="flex gap-1 px-4 mt-4 flex-shrink-0">
          {(['all', 'active', 'triggered', 'paused'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                filter === f
                  ? 'bg-neo-neon text-white shadow-[0_0_10px_rgba(88,95,216,0.3)]'
                  : 'bg-white/5 text-gray-500 hover:text-white'
              }`}
            >
              {f}
              {f === 'triggered' && triggeredCount > 0 && (
                <span className="ml-1 text-orange-400">{triggeredCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── SCROLL AREA ── */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 mt-4 space-y-3">
          {/* Create form */}
          {showForm ? (
            <CreateAlertForm
              prefill={prefill}
              onSave={handleSave}
              onCancel={() => setShowForm(false)}
              notifPermission={notifPermission}
              onRequestPermission={requestPermission}
            />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-white/10 hover:border-neo-neon/40 text-gray-600 hover:text-neo-neon transition-all text-[11px] font-black uppercase tracking-widest group"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform duration-200"/>
              Create New Alert
            </button>
          )}

          {/* Clear triggered */}
          {triggeredCount > 0 && filter !== 'active' && (
            <button
              onClick={clearTriggered}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500/5 border border-orange-500/15 text-orange-400 text-[10px] font-black uppercase tracking-widest hover:bg-orange-500/10 transition-all"
            >
              <Trash2 size={12}/>
              Clear {triggeredCount} triggered
            </button>
          )}

          {/* Alert cards */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3 opacity-40">
              <BellOff size={36} className="text-gray-600"/>
              <p className="font-black text-white text-sm uppercase tracking-widest">No alerts</p>
              <p className="text-xs text-gray-600">
                {filter === 'all' ? 'Create your first price alert above' : `No ${filter} alerts`}
              </p>
            </div>
          ) : (
            filtered.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onRemove={removeAlert}
                onToggle={toggleAlert}
                onReset={resetAlert}
              />
            ))
          )}

          {/* How it works */}
          {alerts.length === 0 && !showForm && (
            <div className="p-4 rounded-2xl bg-white/2 border border-white/5 mt-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Info size={12} className="text-neo-neon"/>
                How Price Alerts Work
              </p>
              <div className="space-y-2.5">
                {[
                  { icon: '🔍', text: 'Run a property valuation in any mode' },
                  { icon: '🔔', text: 'Set a target price, condition, and area' },
                  { icon: '⚡', text: 'Get notified when the AI detects a match' },
                  { icon: '📊', text: 'Alerts check on every new valuation you run' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-[11px] text-gray-500">
                    <span>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceAlertPanel;
