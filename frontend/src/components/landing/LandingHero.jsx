import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, ShieldCheck, Cpu, Radio, ChevronRight } from 'lucide-react';

export default function LandingHero() {
  const { user } = useAuth();

  return (
    <section className="relative pt-12 pb-20 px-4 sm:px-8 max-w-6xl mx-auto text-center">
      {/* System Status Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-industrial-card border border-industrial-border text-xs font-mono text-industrial-muted mb-6 shadow-inner">
        <ShieldCheck className="h-3.5 w-3.5 text-industrial-secondary" />
        <span className="text-industrial-text font-semibold">ISO 10816 STANDARD</span>
        <span className="text-industrial-border">|</span>
        <span>Predictive Vibration & Thermal Telemetry</span>
      </div>

      {/* Main Heading */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
        Industrial Motor <span className="text-transparent bg-clip-text bg-gradient-to-r from-industrial-accent to-industrial-secondary">Health Monitoring</span>
      </h1>

      {/* Subtitle Description */}
      <p className="mt-6 text-base sm:text-lg text-industrial-muted max-w-2xl mx-auto leading-relaxed">
        Monitor motor vibration and temperature, identify possible faults, and make informed maintenance decisions.
      </p>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        {user ? (
          <Link
            to="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-industrial-secondary hover:bg-teal-800 text-white font-bold rounded-xl text-sm font-mono tracking-wider uppercase transition shadow-lg shadow-teal-900/15"
          >
            <span>Open Engineering Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <>
            <Link
              to="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-industrial-secondary hover:bg-teal-800 text-white font-bold rounded-xl text-sm font-mono tracking-wider uppercase transition shadow-lg shadow-teal-900/15"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-industrial-card hover:bg-industrial-cardLight border border-industrial-border text-white font-semibold rounded-xl text-sm font-mono tracking-wider transition"
            >
              <span>Operator Login</span>
              <ChevronRight className="w-4 h-4 text-industrial-muted" />
            </Link>
          </>
        )}
      </div>

      {/* Quick Spec Highlights */}
      <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left font-mono text-xs">
        <div className="p-4 bg-industrial-card/60 border border-industrial-border rounded-xl flex items-center gap-3">
          <Cpu className="w-5 h-5 text-industrial-accent shrink-0" />
          <div>
            <div className="font-bold text-white">Dual Test Modes</div>
            <div className="text-[11px] text-industrial-muted">Simulation & Hardware ESP32</div>
          </div>
        </div>
        <div className="p-4 bg-industrial-card/60 border border-industrial-border rounded-xl flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-industrial-healthy shrink-0" />
          <div>
            <div className="font-bold text-white">Diagnostic Scoring</div>
            <div className="text-[11px] text-industrial-muted">0–100 Explainable Health Index</div>
          </div>
        </div>
        <div className="p-4 bg-industrial-card/60 border border-industrial-border rounded-xl flex items-center gap-3">
          <Radio className="w-5 h-5 text-industrial-secondary shrink-0" />
          <div>
            <div className="font-bold text-white">MQTT Real-Time Stream</div>
            <div className="text-[11px] text-industrial-muted">Socket.IO Live Waveforms</div>
          </div>
        </div>
      </div>
    </section>
  );
}
