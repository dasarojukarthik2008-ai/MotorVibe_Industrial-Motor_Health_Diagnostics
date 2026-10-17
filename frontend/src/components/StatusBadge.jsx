import React from 'react';

export default function StatusBadge({ status, size = 'md' }) {
  const s = String(status || '').toLowerCase();

  let colorClasses = 'bg-sky-50 text-sky-900 border-sky-200';

  if (s === 'healthy' || s === 'normal' || s === 'low' || s === 'completed' || s === 'online' || s === 'connected') {
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (s === 'warning' || s === 'medium' || s === 'stopped') {
    colorClasses = 'bg-amber-50 text-amber-900 border-amber-200';
  } else if (s === 'critical' || s === 'high' || s === 'error') {
    colorClasses = 'bg-rose-50 text-rose-800 border-rose-200';
  } else if (s === 'simulation') {
    colorClasses = 'bg-cyan-50 text-cyan-900 border-cyan-200';
  } else if (s === 'hardware') {
    colorClasses = 'bg-teal-50 text-teal-900 border-teal-200';
  } else if (s === 'running') {
    colorClasses = 'bg-sky-50 text-sky-900 border-sky-200';
  }

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : size === 'lg'
    ? 'text-sm px-3.5 py-1.5 font-semibold'
    : 'text-xs px-2.5 py-1 font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border uppercase tracking-wider font-mono ${sizeClasses} ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status || 'Unknown'}
    </span>
  );
}
