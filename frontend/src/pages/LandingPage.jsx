import React from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingHero from '../components/landing/LandingHero';
import LandingModes from '../components/landing/LandingModes';
import LandingFeatures from '../components/landing/LandingFeatures';
import { Activity } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-industrial-bg text-industrial-text flex flex-col justify-between selection:bg-industrial-accent selection:text-slate-950">
      <div>
        <LandingNavbar />
        <main>
          <LandingHero />
          <LandingModes />
          <LandingFeatures />
        </main>
      </div>

      {/* Industrial Footer */}
      <footer className="border-t border-industrial-border/60 bg-industrial-card py-8 px-4 sm:px-8 text-xs font-mono text-industrial-muted mt-16">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-industrial-accent to-industrial-secondary flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-slate-950 font-black" />
            </div>
            <span className="font-bold text-white">MotorVibe</span>
            <span>— Industrial Motor Vibration & Health Dashboard</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>ISO 10816 Class II/III Standard</span>
            <span>•</span>
            <span>PostgreSQL & MQTT Telemetry</span>
            <span>•</span>
            <span>KL University Expo Project</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
