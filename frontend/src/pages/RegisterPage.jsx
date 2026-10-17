import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim() || !formData.email.trim() || !formData.password) {
      setError('All fields are required.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-industrial-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-industrial-card border border-industrial-border rounded-2xl p-8 shadow-2xl relative">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-industrial-accent to-industrial-secondary flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-3">
            <Activity className="w-7 h-7 text-slate-950 font-black" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Motor<span className="text-industrial-accent">Vibe</span></h1>
          <p className="text-xs font-mono text-industrial-muted mt-1 uppercase tracking-wider">
            Operator Registration
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-mono uppercase text-industrial-muted mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Alex Henderson"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-industrial-bg border border-industrial-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-industrial-accent font-sans transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-industrial-muted mb-1">Username</label>
            <input
              type="text"
              name="username"
              placeholder="operator_01"
              value={formData.username}
              onChange={handleChange}
              className="w-full bg-industrial-bg border border-industrial-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-industrial-accent font-mono transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-industrial-muted mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="operator@plant.internal"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-industrial-bg border border-industrial-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-industrial-accent font-mono transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-industrial-muted mb-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-industrial-bg border border-industrial-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-industrial-accent font-mono transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-industrial-muted mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Repeat password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full bg-industrial-bg border border-industrial-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-industrial-accent font-mono transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 bg-industrial-secondary hover:bg-teal-800 text-white font-bold rounded-xl text-sm font-mono tracking-wider uppercase transition shadow-sm shadow-teal-900/15 disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Create Operator Account'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-industrial-border text-center text-xs text-industrial-muted">
          <span>Already registered? </span>
          <Link to="/login" className="text-industrial-accent hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
