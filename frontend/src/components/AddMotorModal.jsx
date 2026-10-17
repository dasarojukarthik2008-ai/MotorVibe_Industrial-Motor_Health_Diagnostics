import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { motorsApi } from '../services/api';

export default function AddMotorModal({ isOpen, onClose, onCreated }) {
  const [motorCode, setMotorCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!motorCode.trim() || !name.trim()) {
      setError('Motor Code and Name are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await motorsApi.create({
        motor_code: motorCode.trim(),
        name: name.trim(),
        description: description.trim(),
      });
      if (res.success) {
        onCreated(res.motor);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to register motor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-industrial-card border border-industrial-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-industrial-border pb-4 mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-industrial-accent" />
            Register Industrial Motor
          </h3>
          <button
            onClick={onClose}
            className="text-industrial-muted hover:text-white p-1 rounded-lg hover:bg-industrial-cardLight transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/50 border border-rose-500/50 rounded-lg text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-industrial-muted mb-1">
              Motor Code / Asset ID
            </label>
            <input
              type="text"
              placeholder="e.g. MTR-204"
              value={motorCode}
              onChange={(e) => setMotorCode(e.target.value)}
              className="w-full bg-industrial-bg border border-industrial-border rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-industrial-accent"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-industrial-muted mb-1">
              Motor Description Name
            </label>
            <input
              type="text"
              placeholder="e.g. Exhaust Fan Blower Motor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-industrial-bg border border-industrial-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-industrial-accent"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-industrial-muted mb-1">
              Technical Specifications / Notes
            </label>
            <textarea
              rows="3"
              placeholder="e.g. 3-phase induction, 30 kW, 1480 RPM, Drive End Bearing 6308"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-industrial-bg border border-industrial-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-industrial-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-industrial-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-mono text-industrial-muted hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-industrial-secondary hover:bg-teal-800 text-white font-semibold rounded-lg text-xs font-mono flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Save Motor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
