import React from 'react';
import StatusBadge from './StatusBadge';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

export default function HealthGauge({ score = 100, status = 'Healthy', priority = 'Low', breakdown }) {
  const numScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));

  const strokeColor = numScore >= 80
    ? '#166534'
    : numScore >= 50
    ? '#92400E'
    : '#B91C1C';

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (numScore / 100) * circumference;

  return (
    <div className="bg-industrial-card border border-industrial-border rounded-xl p-5 shadow-lg flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-industrial-border pb-3">
        <div className="flex items-center gap-2">
          {numScore >= 80 ? (
            <ShieldCheck className="w-5 h-5 text-industrial-healthy" />
          ) : numScore >= 50 ? (
            <AlertTriangle className="w-5 h-5 text-industrial-warning" />
          ) : (
            <AlertOctagon className="w-5 h-5 text-industrial-critical" />
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-industrial-muted">
            Motor Health Score
          </span>
        </div>
        <StatusBadge status={status} size="sm" />
      </div>

      <div className="flex items-center justify-around py-4">
        {/* Circular Progress Meter */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke="#D8E0EA"
              strokeWidth="9"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke={strokeColor}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold font-mono text-white">{numScore}</span>
            <span className="text-[10px] uppercase tracking-wider text-industrial-muted">/ 100</span>
          </div>
        </div>

        {/* Explainability Breakdown */}
        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between gap-4 text-industrial-muted">
            <span>Base Nominal:</span>
            <span className="text-white">100.0</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-industrial-muted">
            <span>Vibration Penalty:</span>
            <span className="text-rose-400">-{breakdown?.vibrationPenalty || 0}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-industrial-muted">
            <span>Thermal Penalty:</span>
            <span className="text-rose-400">-{breakdown?.temperaturePenalty || 0}</span>
          </div>
          <div className="pt-2 border-t border-industrial-border/60 flex items-center justify-between gap-4">
            <span className="text-industrial-muted">Priority:</span>
            <StatusBadge status={priority} size="sm" />
          </div>
        </div>
      </div>

      <p className="text-[11px] text-industrial-muted/80 text-center italic border-t border-industrial-border pt-2">
        Preliminary rule-based demonstration index
      </p>
    </div>
  );
}
