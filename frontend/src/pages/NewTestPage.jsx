import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motorsApi, testsApi, dashboardApi } from '../services/api';
import { getSocket } from '../services/socket';
import MetricCard from '../components/MetricCard';
import TelemetryChart from '../components/TelemetryChart';
import HealthGauge from '../components/HealthGauge';
import AddMotorModal from '../components/AddMotorModal';
import {
  Play,
  Square,
  CheckCircle,
  Plus,
  Cpu,
  Radio,
  Clock,
  AlertTriangle,
  Info,
  Layers,
  Thermometer,
  Activity,
} from 'lucide-react';

const CONDITIONS = [
  { id: 'Normal', label: 'Normal', desc: 'Nominal vibration and thermal stability' },
  { id: 'Bearing Fault', label: 'Bearing Fault', desc: 'Progressively rising vibration and heat' },
  { id: 'Imbalance', label: 'Imbalance', desc: 'Strong oscillatory vibration swings' },
  { id: 'Overheating', label: 'Overheating', desc: 'Accelerating thermal gradient' },
  { id: 'Loose Mounting', label: 'Loose Mounting', desc: 'Elevated base vibration with intermittent shock spikes' },
];

export default function NewTestPage() {
  const navigate = useNavigate();
  const [motors, setMotors] = useState([]);
  const [selectedMotorId, setSelectedMotorId] = useState('');
  const [mode, setMode] = useState('simulation'); // 'simulation' | 'hardware'
  const [testCondition, setTestCondition] = useState('Normal');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Active Test State
  const [activeTest, setActiveTest] = useState(null);
  const [testStatus, setTestStatus] = useState('idle'); // 'idle' | 'running' | 'stopped' | 'completed'
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [currentMetrics, setCurrentMetrics] = useState({
    vibration: 0,
    temperature: 0,
    avgVibration: 0,
    maxVibration: 0,
    avgTemperature: 0,
    maxTemperature: 0,
    readingCount: 0,
    durationSeconds: 0,
  });
  const [analysis, setAnalysis] = useState({
    healthScore: 100,
    healthStatus: 'Healthy',
    possibleFault: 'No Major Issue Detected',
    priority: 'Low',
    recommendation: 'Continue routine monitoring.',
    alerts: [],
    breakdown: { vibrationPenalty: 0, temperaturePenalty: 0 },
  });

  // Hardware Status State
  const [hwStatus, setHwStatus] = useState({
    brokerConnected: false,
    lastReadingTimestamp: null,
    readingsReceivedCount: 0,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load user's registered motors
  const loadMotors = useCallback(async () => {
    try {
      const res = await motorsApi.getAll();
      if (res.success && res.motors) {
        setMotors(res.motors);
        if (res.motors.length > 0 && !selectedMotorId) {
          setSelectedMotorId(res.motors[0].id.toString());
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load motors.');
    }
  }, [selectedMotorId]);

  useEffect(() => {
    loadMotors();
  }, [loadMotors]);

  // Poll hardware status if hardware mode is active
  useEffect(() => {
    let interval = null;
    const fetchHw = async () => {
      try {
        const res = await dashboardApi.getHardwareStatus(selectedMotorId);
        if (res.success) {
          setHwStatus(res.status);
        }
      } catch (_e) {
        // ignore
      }
    };

    fetchHw();
    if (mode === 'hardware') {
      interval = setInterval(fetchHw, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, selectedMotorId]);

  // Socket listener for live telemetry
  useEffect(() => {
    const socket = getSocket();

    const handleTelemetry = (data) => {
      if (!data) return;
      if (activeTest && data.testId !== activeTest.id) return;

      const reading = {
        timestamp: data.timestamp,
        vibration: data.vibration,
        temperature: data.temperature,
      };

      setTelemetryHistory((prev) => {
        const updated = [...prev, reading];
        return updated.slice(-40); // Rolling 40 points window
      });

      if (data.stats) {
        setCurrentMetrics({
          vibration: data.vibration,
          temperature: data.temperature,
          avgVibration: data.stats.avgVibration,
          maxVibration: data.stats.maxVibration,
          avgTemperature: data.stats.avgTemperature,
          maxTemperature: data.stats.maxTemperature,
          readingCount: data.stats.readingCount,
          durationSeconds: data.stats.durationSeconds,
        });
      }

      if (data.analysis) {
        setAnalysis(data.analysis);
      }
    };

    const handleStatusChange = (data) => {
      if (activeTest && data.testId === activeTest.id) {
        setTestStatus(data.status);
      }
    };

    socket.on('telemetry_reading', handleTelemetry);
    socket.on('test_status_change', handleStatusChange);

    return () => {
      socket.off('telemetry_reading', handleTelemetry);
      socket.off('test_status_change', handleStatusChange);
    };
  }, [activeTest]);

  // Start Test
  const handleStart = async () => {
    if (!selectedMotorId) {
      setError('Please select or register a motor before starting.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setTelemetryHistory([]);
      const res = await testsApi.start({
        motorId: parseInt(selectedMotorId, 10),
        mode,
        testCondition: mode === 'simulation' ? testCondition : 'Hardware Telemetry',
      });

      if (res.success) {
        setActiveTest(res.test);
        setTestStatus('running');
        const socket = getSocket();
        socket.emit('join_test', res.test.id);
      }
    } catch (err) {
      setError(err.message || 'Failed to start test.');
    } finally {
      setLoading(false);
    }
  };

  // Stop Test
  const handleStop = async () => {
    if (!activeTest) return;
    try {
      setLoading(true);
      const res = await testsApi.stop(activeTest.id);
      if (res.success) {
        setTestStatus('stopped');
      }
    } catch (err) {
      setError(err.message || 'Failed to stop test.');
    } finally {
      setLoading(false);
    }
  };

  // Finish and Save Test
  const handleFinish = async () => {
    if (!activeTest) return;
    try {
      setLoading(true);
      const res = await testsApi.finish(activeTest.id);
      if (res.success) {
        setTestStatus('completed');
        navigate(`/history/${activeTest.id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to finalize test.');
    } finally {
      setLoading(false);
    }
  };

  const selectedMotor = motors.find((m) => m.id.toString() === selectedMotorId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-industrial-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Play className="w-6 h-6 text-industrial-accent" />
            Industrial Motor Diagnostic Test
          </h1>
          <p className="text-xs font-mono text-industrial-muted mt-1">
            Execute real-time condition evaluations via Simulation or ESP32 MQTT Telemetry
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {testStatus === 'running' ? (
            <button
              onClick={handleStop}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl text-xs font-mono tracking-wider uppercase transition shadow-lg shadow-rose-600/20 disabled:opacity-50"
            >
              <Square className="w-4 h-4" />
              Stop Test
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={loading || !selectedMotorId}
              className="flex items-center gap-2 px-6 py-2.5 bg-industrial-secondary hover:bg-teal-800 text-white font-bold rounded-xl text-xs font-mono tracking-wider uppercase transition shadow-sm shadow-teal-900/15 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Test
            </button>
          )}

          {(testStatus === 'stopped' || testStatus === 'running') && (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs font-mono tracking-wider uppercase transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Finish & Save
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Configuration Panel */}
      <div className="bg-industrial-card border border-industrial-border rounded-2xl p-5 shadow-lg space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Motor Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-industrial-muted">
                1. Select Motor Asset
              </label>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-xs font-mono text-industrial-accent hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Quick Add
              </button>
            </div>
            <select
              value={selectedMotorId}
              onChange={(e) => setSelectedMotorId(e.target.value)}
              disabled={testStatus === 'running'}
              className="w-full bg-industrial-bg border border-industrial-border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-industrial-accent disabled:opacity-60"
            >
              {motors.length === 0 ? (
                <option value="">No motors registered yet</option>
              ) : (
                motors.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.motor_code}] {m.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 2. Mode Selection Toggle */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-industrial-muted mb-2">
              2. Testing Mode
            </label>
            <div className="grid grid-cols-2 gap-2 bg-industrial-bg p-1 rounded-xl border border-industrial-border">
              <button
                type="button"
                onClick={() => setMode('simulation')}
                disabled={testStatus === 'running'}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono font-semibold transition ${
                  mode === 'simulation'
                    ? 'bg-cyan-50 text-cyan-900 shadow-sm'
                    : 'text-industrial-muted hover:text-white'
                }`}
              >
                <Cpu className="w-4 h-4" />
                Simulation
              </button>
              <button
                type="button"
                onClick={() => setMode('hardware')}
                disabled={testStatus === 'running'}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono font-semibold transition ${
                  mode === 'hardware'
                    ? 'bg-industrial-secondary text-slate-950 shadow'
                    : 'text-industrial-muted hover:text-white'
                }`}
              >
                <Radio className="w-4 h-4" />
                Hardware ESP32
              </button>
            </div>
          </div>

          {/* 3. Condition or Hardware Telemetry State */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-industrial-muted mb-2">
              3. Condition Profile / Gateway
            </label>
            {mode === 'simulation' ? (
              <select
                value={testCondition}
                onChange={(e) => setTestCondition(e.target.value)}
                disabled={testStatus === 'running'}
                className="w-full bg-industrial-bg border border-industrial-border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-industrial-accent disabled:opacity-60"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} — {c.desc}
                  </option>
                ))}
              </select>
            ) : (
              <div className="bg-industrial-bg border border-industrial-border rounded-xl px-3.5 py-2 text-xs font-mono flex items-center justify-between">
                <div>
                  <span className="text-industrial-muted block">MQTT Status:</span>
                  <span className={hwStatus.brokerConnected ? 'text-teal-400 font-bold' : 'text-slate-400'}>
                    {hwStatus.brokerConnected ? 'Broker Online' : 'Waiting for Broker'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-industrial-muted block">Telemetry Pkts:</span>
                  <span className="text-white font-bold">{hwStatus.readingsReceivedCount}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hardware Mode Info Banner if Hardware Mode is Selected */}
        {mode === 'hardware' && (
          <div className="p-3.5 bg-teal-950/30 border border-teal-500/30 rounded-xl text-xs font-mono text-teal-300 flex items-start gap-3">
            <Info className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white mb-0.5">Hardware Mode: Genuine ESP32 Telemetry Path</div>
              <p className="text-teal-300/80">
                Listening for messages on topic{' '}
                <code className="bg-industrial-bg px-1.5 py-0.5 rounded border border-teal-500/30 text-teal-200">
                  motorvibe/{selectedMotor?.motor_code || '+'}/telemetry
                </code>
                . When sensors transmit valid JSON telemetry via Wi-Fi and MQTT, live telemetry and health diagnosis stream here automatically.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Live Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Instant Vibration"
          value={currentMetrics.vibration.toFixed(2)}
          unit="mm/s"
          icon={Activity}
          variant="cyan"
          subtitle={`Peak: ${currentMetrics.maxVibration.toFixed(2)} • Avg: ${currentMetrics.avgVibration.toFixed(2)}`}
        />
        <MetricCard
          title="Instant Temperature"
          value={currentMetrics.temperature.toFixed(1)}
          unit="°C"
          icon={Thermometer}
          variant="warning"
          subtitle={`Peak: ${currentMetrics.maxTemperature.toFixed(1)}° • Avg: ${currentMetrics.avgTemperature.toFixed(1)}°`}
        />
        <MetricCard
          title="Elapsed Duration"
          value={currentMetrics.durationSeconds}
          unit="sec"
          icon={Clock}
          variant="teal"
          subtitle={`Total Telemetry Readings: ${currentMetrics.readingCount}`}
        />
        <MetricCard
          title="Test Operational Status"
          value={testStatus.toUpperCase()}
          unit=""
          icon={Layers}
          variant={testStatus === 'running' ? 'healthy' : 'cyan'}
          subtitle={activeTest ? `Active Test ID: #${activeTest.id}` : 'Ready to start'}
        />
      </div>

      {/* Charts & Health Score Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Recharts Stream */}
        <div className="lg:col-span-2 bg-industrial-card border border-industrial-border rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-industrial-border pb-3 mb-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-industrial-muted block">
                Live Sensor Dynamics
              </span>
              <span className="text-sm font-semibold text-white">
                Rolling Telemetry Stream ({telemetryHistory.length} Points)
              </span>
            </div>
            {testStatus === 'running' && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-full animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                LIVE STREAM
              </span>
            )}
          </div>

          <div className="h-72">
            <TelemetryChart data={telemetryHistory} height={280} showLimits={true} />
          </div>
        </div>

        {/* Health Score Gauge & Fault Analysis */}
        <div className="lg:col-span-1 space-y-6">
          <HealthGauge
            score={analysis.healthScore}
            status={analysis.healthStatus}
            priority={analysis.priority}
            breakdown={analysis.breakdown}
          />

          {/* Fault & Recommendation Box */}
          <div className="bg-industrial-card border border-industrial-border rounded-2xl p-5 shadow-lg space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-industrial-muted border-b border-industrial-border pb-2">
              Automated Diagnostics
            </div>

            <div>
              <span className="text-[11px] font-mono text-industrial-muted block uppercase">Preliminary Fault</span>
              <span className="text-base font-bold text-rose-400">{analysis.possibleFault}</span>
            </div>

            <div className="bg-industrial-bg p-3 rounded-xl border border-industrial-border">
              <span className="text-[10px] font-mono text-industrial-muted block uppercase mb-1">
                Recommended Maintenance Action
              </span>
              <p className="text-xs text-industrial-text font-medium">{analysis.recommendation}</p>
            </div>
          </div>
        </div>
      </div>

      <AddMotorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={(newMotor) => {
          setMotors((prev) => [newMotor, ...prev]);
          setSelectedMotorId(newMotor.id.toString());
        }}
      />
    </div>
  );
}
