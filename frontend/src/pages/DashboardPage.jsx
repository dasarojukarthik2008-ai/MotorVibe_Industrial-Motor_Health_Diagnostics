import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Wrench,
  LineChart,
  GitCompare,
  FileText,
} from 'lucide-react';

const capabilities = [
  {
    icon: Activity,
    title: 'Live Vibration & Temp Monitoring',
    description: 'Track vibration velocity in mm/s and motor surface or bearing temperature in °C.',
    accent: 'border-l-cyan-600',
    to: '/tests/new',
  },
  {
    icon: ShieldCheck,
    title: 'Motor Health Score',
    description: 'Understand the 0–100 health index, based on ISO 10816 standards and clear deductions.',
    accent: 'border-l-green-600',
    to: '/tests/new',
  },
  {
    icon: AlertTriangle,
    title: 'Possible Fault Detection',
    description: 'Identify bearing degradation, imbalance, overheating, and loose foundations.',
    accent: 'border-l-amber-600',
    to: '/tests/new',
  },
  {
    icon: Wrench,
    title: 'Maintenance Priorities & Actions',
    description: 'Get prioritized urgency ratings and practical engineering recommendations.',
    accent: 'border-l-teal-700',
    to: '/tests/new',
  },
  {
    icon: LineChart,
    title: 'Live Charts and Alerts',
    description: 'Follow telemetry waveforms and receive warnings when readings cross configured limits.',
    accent: 'border-l-cyan-600',
    to: '/tests/new',
  },
  {
    icon: GitCompare,
    title: 'History & Delta Comparison',
    description: 'Compare a baseline with later inspections and review changes in motor condition.',
    accent: 'border-l-teal-700',
    to: '/compare',
  },
  {
    icon: FileText,
    title: 'Certified Test Reports',
    description: 'Create ISO-aligned records with print-ready layouts, operator sign-offs, and specifications.',
    accent: 'border-l-green-600',
    to: '/reports',
  },
];

export default function DashboardPage() {
  return (
    <section className="mx-auto max-w-6xl py-2 sm:py-5">
      <header className="mb-9 text-center sm:mb-12">
        <span className="text-xs font-mono uppercase tracking-[0.18em] text-industrial-accent">
          Core capabilities
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-industrial-text sm:text-4xl">
          Engineered for Industrial Diagnostics
        </h1>
        <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-industrial-muted sm:text-base">
          Integrated instrumentation and diagnostics for motor condition monitoring and maintenance.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map(({ icon: Icon, title, description, accent, to }) => (
          <Link
            key={title}
            to={to}
            className={`group min-h-48 rounded-2xl border border-industrial-border border-l-4 ${accent} bg-white p-5 shadow-[0_8px_18px_-14px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-offset-4 sm:p-6`}
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-industrial-border bg-industrial-bg text-industrial-accent transition group-hover:bg-cyan-50">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="text-sm font-bold leading-5 text-industrial-text sm:text-base">
                {title}
              </h2>
            </div>
            <p className="text-sm leading-6 text-industrial-muted">{description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
