import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please provide your username/email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(identifier.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-industrial-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-industrial-card border border-industrial-border rounded-2xl p-8 shadow-2xl relative">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-industrial-accent to-industrial-secondary flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-3">
            <Activity className="w-7 h-7 text-slate-950 font-black" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Motor<span className="text-industrial-accent">Vibe</span></h1>
          <p className="text-xs font-mono text-industrial-muted mt-1 uppercase tracking-wider">
            Industrial Telemetry & Diagnostics Gateway
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-industrial-muted mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-industrial-muted absolute left-3 top-3" />
              <input
                type="text"
                placeholder="operator@plant.internal"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-industrial-bg border border-industrial-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-industrial-accent font-mono transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-industrial-muted mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-industrial-muted absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-industrial-bg border border-industrial-border rounded-xl pl-9 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-industrial-accent font-mono transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-3 text-industrial-muted hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-industrial-secondary hover:bg-teal-800 text-white font-bold rounded-xl text-sm font-mono tracking-wider uppercase transition shadow-sm shadow-teal-900/15 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Console'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-industrial-border text-center text-xs text-industrial-muted">
          <span>Need an operator account? </span>
          <Link to="/register" className="text-industrial-accent hover:underline font-medium">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
