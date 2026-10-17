import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Wrench,
  LineChart,
  GitCompare,
  FileText,
  ArrowRight,
  Radio,
  Layers,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Activity,
    title: 'Live Vibration & Temp Monitoring',
    desc: 'Real-time dual telemetry tracking RMS velocity in mm/s and motor surface/bearing temperature in °C.',
    accent: 'border-l-industrial-accent',
  },
  {
    icon: ShieldCheck,
    title: 'Motor Health Score',
    desc: 'Explainable 0–100 health index calculated using ISO 10816 standards with transparent penalty deductions.',
    accent: 'border-l-industrial-healthy',
  },
  {
    icon: AlertTriangle,
    title: 'Possible Fault Detection',
    desc: 'Automated rule-based diagnosis flagging Bearing Degradation, Imbalance, Overheating, or Loose Foundation.',
    accent: 'border-l-industrial-warning',
  },
  {
    icon: Wrench,
    title: 'Maintenance Priorities & Actions',
    desc: 'Prioritized urgency ratings (Low, Medium, High) with actionable prescriptive engineering recommendations.',
    accent: 'border-l-industrial-secondary',
  },
  {
    icon: LineChart,
    title: 'Live Charts and Alerts',
    desc: 'Responsive Recharts waveforms with rolling buffers and automated threshold-limit violation warnings.',
    accent: 'border-l-industrial-accent',
  },
  {
    icon: GitCompare,
    title: 'History & Delta Comparison',
    desc: 'Side-by-side comparative analysis between baseline and subsequent tests with degradation conclusions.',
    accent: 'border-l-industrial-secondary',
  },
  {
    icon: FileText,
    title: 'Certified Test Reports',
    desc: 'Comprehensive ISO-aligned records with print-optimized layouts, operator sign-offs, and specifications.',
    accent: 'border-l-industrial-healthy',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Motor Sensors / Simulation',
    desc: 'Physical MPU6050/thermistor on ESP32 or backend 5-state simulation engine.',
    icon: Radio,
  },
  {
    step: '02',
    title: 'Data Collection',
    desc: 'Wi-Fi MQTT ingestion and persistent PostgreSQL storage with parameter validation.',
    icon: Layers,
  },
  {
    step: '03',
    title: 'Health Analysis',
    desc: 'Centralized algorithmic ISO 10816 evaluation and penalty breakdown.',
    icon: ShieldCheck,
  },
  {
    step: '04',
    title: 'Dashboard Display',
    desc: 'Real-time WebSocket streaming with dual-axis charts and circular gauges.',
    icon: Activity,
  },
  {
    step: '05',
    title: 'Maintenance Action',
    desc: 'Immediate fault notification, priority tagging, and prescriptive repair guidance.',
    icon: Wrench,
  },
];

export default function LandingFeatures() {
  const { user } = useAuth();

  return (
    <section className="py-16 px-4 sm:px-8 max-w-6xl mx-auto border-t border-industrial-border/60">
      {/* Key Features Grid */}
      <div id="features" className="mb-20">
        <div className="text-center mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-industrial-accent">
            Core Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Engineered for Industrial Diagnostics
          </h2>
          <p className="text-xs font-mono text-industrial-muted mt-2">
            Integrated instrumentation and diagnostics suite designed for tech expos and operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className={`bg-industrial-card border border-industrial-border border-l-4 ${f.accent} rounded-xl p-5 shadow-lg hover:bg-industrial-cardLight transition`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-lg bg-industrial-bg border border-industrial-border text-industrial-accent">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white font-mono">{f.title}</h3>
                </div>
                <p className="text-xs text-industrial-muted leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* How It Works Workflow */}
      <div id="workflow" className="mb-20">
        <div className="text-center mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-industrial-secondary">
            Process Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            How It Works
          </h2>
          <p className="text-xs font-mono text-industrial-muted mt-2">
            From sensor acquisition to actionable maintenance prescription in milliseconds
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {STEPS.map((s, idx) => {
            const StepIcon = s.icon;
            return (
              <div
                key={idx}
                className="bg-industrial-card border border-industrial-border rounded-xl p-4 shadow-lg flex flex-col justify-between relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold font-mono text-industrial-accent">{s.step}</span>
                    <StepIcon className="w-4 h-4 text-industrial-muted" />
                  </div>
                  <h4 className="text-xs font-bold text-white font-mono mb-2">{s.title}</h4>
                  <p className="text-[11px] text-industrial-muted leading-relaxed">{s.desc}</p>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-industrial-muted">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Call to Action Enclosure */}
      <div className="bg-gradient-to-r from-industrial-card to-industrial-cardLight border border-industrial-border rounded-2xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ready to Monitor Industrial Motors?
          </h2>
          <p className="text-xs sm:text-sm text-industrial-muted leading-relaxed font-mono">
            Launch Simulation Mode immediately or connect physical ESP32 sensors over MQTT to begin real-time predictive vibration analysis.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 bg-industrial-secondary hover:bg-teal-800 text-white font-bold rounded-xl text-sm font-mono tracking-wider uppercase transition shadow-lg shadow-teal-900/15 flex items-center justify-center gap-2"
              >
                <span>Access Engineering Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-3.5 bg-industrial-secondary hover:bg-teal-800 text-white font-bold rounded-xl text-sm font-mono tracking-wider uppercase transition shadow-lg shadow-teal-900/15"
                >
                  Create Operator Account
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-3.5 bg-industrial-bg hover:bg-industrial-card border border-industrial-border text-white font-semibold rounded-xl text-sm font-mono tracking-wider transition"
                >
                  Sign In to Console
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
