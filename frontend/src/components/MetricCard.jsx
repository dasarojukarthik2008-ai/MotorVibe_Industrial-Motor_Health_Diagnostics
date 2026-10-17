import React from 'react';

export default function MetricCard({
  title,
  value,
  unit = '',
  icon: Icon,
  subtitle,
  variant = 'cyan', // 'cyan', 'teal', 'healthy', 'warning', 'critical'
}) {
  const styles = {
    cyan: { card: 'border-t-cyan-500 from-white to-cyan-50/70', icon: 'text-cyan-800 bg-cyan-100' },
    teal: { card: 'border-t-teal-600 from-white to-teal-50/70', icon: 'text-teal-800 bg-teal-100' },
    healthy: { card: 'border-t-green-600 from-white to-green-50/70', icon: 'text-green-800 bg-green-100' },
    warning: { card: 'border-t-amber-600 from-white to-amber-50/70', icon: 'text-amber-800 bg-amber-100' },
    critical: { card: 'border-t-red-600 from-white to-red-50/70', icon: 'text-red-800 bg-red-100' },
  }[variant] || { card: 'border-t-cyan-500 from-white to-cyan-50/70', icon: 'text-cyan-800 bg-cyan-100' };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-industrial-border border-t-[3px] bg-gradient-to-br ${styles.card} p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-industrial-muted">{title}</span>
        {Icon && <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}><Icon className="h-5 w-5" /></span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold font-mono tracking-tight text-industrial-text">{value}</span>
        {unit && <span className="text-[10px] font-bold tracking-wider text-industrial-muted font-mono">{unit}</span>}
      </div>
      {subtitle && (
        <div className="mt-4 flex items-center gap-1.5 border-t border-industrial-border/70 pt-3 text-xs font-medium text-industrial-muted">
          {subtitle}
        </div>
      )}
    </div>
  );
}
