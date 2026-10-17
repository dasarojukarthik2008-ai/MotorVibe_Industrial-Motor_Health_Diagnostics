import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, ArrowRight, LayoutDashboard, User } from 'lucide-react';

export default function LandingNavbar() {
  const { user } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-industrial-card/85 backdrop-blur-md border-b border-industrial-border px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-industrial-accent to-industrial-secondary flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition">
            <Activity className="w-5 h-5 text-slate-950 font-black" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Motor<span className="text-industrial-accent">Vibe</span>
          </span>
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-6 text-xs font-mono text-industrial-muted">
        <a href="#about" className="hover:text-industrial-accent transition">What Is MotorVibe</a>
        <a href="#modes" className="hover:text-industrial-accent transition">Testing Modes</a>
        <a href="#features" className="hover:text-industrial-accent transition">Key Features</a>
        <a href="#workflow" className="hover:text-industrial-accent transition">How It Works</a>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-industrial-secondary hover:bg-teal-800 text-white font-bold rounded-xl text-xs font-mono tracking-wider uppercase transition shadow-sm shadow-teal-900/15"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <>
            <Link
              to="/login"
              className="px-3.5 py-2 text-xs font-mono text-industrial-muted hover:text-white transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-1.5 px-4 py-2 bg-industrial-secondary hover:bg-teal-800 text-white font-bold rounded-xl text-xs font-mono tracking-wider uppercase transition shadow-sm shadow-teal-900/15"
            >
              <User className="w-3.5 h-3.5" />
              <span>Get Started</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
