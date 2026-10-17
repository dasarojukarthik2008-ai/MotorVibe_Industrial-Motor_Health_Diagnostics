import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { testsApi } from '../services/api';
import MetricCard from '../components/MetricCard';
import TelemetryChart from '../components/TelemetryChart';
import StatusBadge from '../components/StatusBadge';
import HealthGauge from '../components/HealthGauge';
import {
  ArrowLeft,
  Printer,
  Activity,
  Thermometer,
  Clock,
  Layers,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function TestDetailsPage() {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTestDetails() {
      try {
        setLoading(true);
        setError('');
        const [testRes, telRes] = await Promise.all([
          testsApi.getById(id),
          testsApi.getTelemetry(id),
        ]);
        if (testRes.success) setTest(testRes.test);
        if (telRes.success) setTelemetry(telRes.telemetry);
      } catch (err) {
        setError(err.message || 'Failed to load test details.');
      } finally {
        setLoading(false);
      }
    }
    loadTestDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] font-mono text-sm text-industrial-muted gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-industrial-accent" />
        <span>Loading test evaluation #{id}...</span>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="p-6 bg-rose-950/40 border border-rose-500/40 rounded-2xl text-rose-300 text-sm flex items-center gap-3">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <span>{error || 'Test record not found.'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-industrial-border pb-5 no-print">
        <div className="flex items-center gap-3">
          <Link
            to="/history"
            className="p-2 bg-industrial-card hover:bg-industrial-cardLight border border-industrial-border rounded-xl text-industrial-muted hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Test Report #{test.id}:</span>
              <span className="text-industrial-accent font-mono">{test.motor_code}</span>
            </h1>
            <p className="text-xs font-mono text-industrial-muted mt-0.5">
              {test.motor_name} • Recorded on {new Date(test.started_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-industrial-card hover:bg-industrial-cardLight border border-industrial-border rounded-xl text-xs font-mono text-white transition"
          >
            <Printer className="w-4 h-4 text-industrial-accent" />
            Print Report
          </button>
          <StatusBadge status={test.health_status} size="lg" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Avg Vibration"
          value={test.average_vibration}
          unit="mm/s"
          icon={Activity}
          variant="cyan"
          subtitle={`Maximum Peak: ${test.maximum_vibration} mm/s`}
        />
        <MetricCard
          title="Avg Temperature"
          value={test.average_temperature}
          unit="°C"
          icon={Thermometer}
          variant="warning"
          subtitle={`Maximum Peak: ${test.maximum_temperature} °C`}
        />
        <MetricCard
          title="Test Duration"
          value={test.duration_seconds}
          unit="sec"
          icon={Clock}
          variant="teal"
          subtitle={`Total Telemetry Readings: ${test.reading_count}`}
        />
        <MetricCard
          title="Operating Mode"
          value={test.mode.toUpperCase()}
          unit=""
          icon={Layers}
          variant="cyan"
          subtitle={`Condition Profile: ${test.test_condition}`}
        />
      </div>

      {/* Health Score & Diagnostics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <HealthGauge
            score={test.health_score}
            status={test.health_status}
            priority={test.priority}
            breakdown={{
              vibrationPenalty: Math.max(0, Math.round((100 - Number(test.health_score)) * 0.6 * 10) / 10),
              temperaturePenalty: Math.max(0, Math.round((100 - Number(test.health_score)) * 0.4 * 10) / 10),
            }}
          />

          <div className="bg-industrial-card border border-industrial-border rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-industrial-muted border-b border-industrial-border pb-2">
              Diagnostics Summary
            </h3>
            <div>
              <span className="text-[11px] font-mono text-industrial-muted uppercase block">Identified Condition</span>
              <span className="text-base font-bold text-rose-400">{test.possible_fault}</span>
            </div>
            <div className="bg-industrial-bg p-3.5 rounded-xl border border-industrial-border">
              <span className="text-[10px] font-mono text-industrial-muted uppercase block mb-1">
                Engineering Recommendation
              </span>
              <p className="text-xs text-industrial-text font-medium leading-relaxed">{test.recommendation}</p>
            </div>
          </div>
        </div>

        {/* Full Telemetry Chart */}
        <div className="lg:col-span-2 bg-industrial-card border border-industrial-border rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-industrial-border pb-3 mb-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-industrial-muted block">
                Complete Telemetry History
              </span>
              <span className="text-sm font-semibold text-white">
                Vibration & Temperature Trend ({telemetry.length} Recorded Points)
              </span>
            </div>
            <StatusBadge status={test.mode} size="sm" />
          </div>

          <div className="h-80">
            <TelemetryChart data={telemetry} height={320} showLimits={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
