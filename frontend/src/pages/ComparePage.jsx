import React, { useState, useEffect, useCallback } from 'react';
import { testsApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { GitCompare, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

export default function ComparePage() {
  const [allTests, setAllTests] = useState([]);
  const [firstId, setFirstId] = useState('');
  const [secondId, setSecondId] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    testsApi.getAll().then((res) => {
      if (res.success && res.tests) {
        setAllTests(res.tests);
        if (res.tests.length >= 2) {
          setFirstId(res.tests[1].id.toString());
          setSecondId(res.tests[0].id.toString());
        }
      }
    });
  }, []);

  const handleCompare = useCallback(async () => {
    if (!firstId || !secondId) {
      setError('Please select two distinct tests to compare.');
      return;
    }
    if (firstId === secondId) {
      setError('Please select two different tests.');
      return;
    }

    try {
      setError('');
      const res = await testsApi.compare(firstId, secondId);
      if (res.success) {
        setComparisonData(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to compare tests.');
    }
  }, [firstId, secondId]);

  useEffect(() => {
    if (firstId && secondId && firstId !== secondId) {
      handleCompare();
    }
  }, [firstId, secondId, handleCompare]);

  const { firstTest, secondTest, comparison } = comparisonData || {};

  return (
    <div className="space-y-6">
      <div className="border-b border-industrial-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <GitCompare className="w-6 h-6 text-industrial-accent" />
          Comparative Motor Test Diagnostics
        </h1>
        <p className="text-xs font-mono text-industrial-muted mt-1">
          Perform delta evaluation between baseline and subsequent test runs to track degradation
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Selector Controls */}
      <div className="bg-industrial-card border border-industrial-border rounded-2xl p-5 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <label className="block text-xs font-mono uppercase text-industrial-muted mb-2">
              Baseline / Initial Test (Test 1)
            </label>
            <select
              value={firstId}
              onChange={(e) => setFirstId(e.target.value)}
              className="w-full bg-industrial-bg border border-industrial-border rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-industrial-accent"
            >
              <option value="">Select Baseline Test</option>
              {allTests.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.id} • {t.motor_code} ({t.test_condition}) — {new Date(t.started_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-industrial-muted mb-2">
              Subsequent / Target Test (Test 2)
            </label>
            <select
              value={secondId}
              onChange={(e) => setSecondId(e.target.value)}
              className="w-full bg-industrial-bg border border-industrial-border rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-industrial-accent"
            >
              <option value="">Select Target Test</option>
              {allTests.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.id} • {t.motor_code} ({t.test_condition}) — {new Date(t.started_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Comparison Results */}
      {comparison && firstTest && secondTest && (
        <div className="space-y-6">
          {/* Rule-Based Conclusion Banner */}
          <div
            className={`p-5 rounded-2xl border flex items-center gap-4 ${
              comparison.conclusion === 'Improving'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : comparison.conclusion === 'Deteriorating'
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}
          >
            <div className="p-3 rounded-xl bg-industrial-bg/80 shrink-0">
              {comparison.conclusion === 'Improving' ? (
                <TrendingUp className="w-8 h-8 text-emerald-400" />
              ) : comparison.conclusion === 'Deteriorating' ? (
                <TrendingDown className="w-8 h-8 text-rose-400" />
              ) : (
                <Minus className="w-8 h-8 text-amber-400" />
              )}
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-widest font-bold">
                Automated Diagnosis Conclusion
              </div>
              <div className="text-xl font-extrabold">{comparison.conclusion}</div>
              <p className="text-xs font-mono mt-1 opacity-90">{comparison.reason}</p>
            </div>
          </div>

          {/* Side-by-side Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Test 1 Card */}
            <div className="bg-industrial-card border border-industrial-border rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-industrial-border pb-3">
                <div>
                  <span className="text-xs font-mono uppercase text-industrial-muted">Baseline (Test 1)</span>
                  <div className="text-base font-bold text-white">#{firstTest.id} • {firstTest.motor_code}</div>
                </div>
                <StatusBadge status={firstTest.health_status} size="sm" />
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex justify-between py-1.5 border-b border-industrial-border/50">
                  <span className="text-industrial-muted">Health Score:</span>
                  <span className="text-white font-bold">{firstTest.health_score} / 100</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-industrial-border/50">
                  <span className="text-industrial-muted">Avg Vibration:</span>
                  <span className="text-cyan-400 font-bold">{firstTest.average_vibration} mm/s</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-industrial-border/50">
                  <span className="text-industrial-muted">Max Vibration:</span>
                  <span className="text-cyan-400 font-bold">{firstTest.maximum_vibration} mm/s</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-industrial-border/50">
                  <span className="text-industrial-muted">Avg Temperature:</span>
                  <span className="text-amber-400 font-bold">{firstTest.average_temperature} °C</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-industrial-border/50">
                  <span className="text-industrial-muted">Condition Profile:</span>
                  <span className="text-white">{firstTest.test_condition}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-industrial-muted">Priority:</span>
                  <StatusBadge status={firstTest.priority} size="sm" />
                </div>
              </div>
            </div>

            {/* Test 2 Card with Deltas */}
            <div className="bg-industrial-card border border-industrial-border rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-industrial-border pb-3">
                <div>
                  <span className="text-xs font-mono uppercase text-industrial-muted">Target (Test 2)</span>
                  <div className="text-base font-bold text-white">#{secondTest.id} • {secondTest.motor_code}</div>
                </div>
                <StatusBadge status={secondTest.health_status} size="sm" />
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex justify-between py-1.5 border-b border-industrial-border/50">
                  <span className="text-industrial-muted">Health Score:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{secondTest.health_score} / 100</span>
                    <span className={`text-[11px] font-bold ${comparison.deltaScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ({comparison.deltaScore >= 0 ? `+${comparison.deltaScore}` : comparison.deltaScore})
                    </span>
                  </div>
                </div>

                <div className="flex justify-between py-1.5 border-b border-industrial-border/50">
                  <span className="text-industrial-muted">Avg Vibration:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">{secondTest.average_vibration} mm/s</span>
                    <span className={`text-[11px] font-bold ${comparison.deltaAvgVib <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ({comparison.deltaAvgVib > 0 ? `+${comparison.deltaAvgVib}` : comparison.deltaAvgVib})
                    </span>
                  </div>
                </div>

                <div className="flex justify-between py-1.5 border-b border-industrial-border/50">
                  <span className="text-industrial-muted">Max Vibration:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">{secondTest.maximum_vibration} mm/s</span>
                    <span className={`text-[11px] font-bold ${comparison.deltaMaxVib <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ({comparison.deltaMaxVib > 0 ? `+${comparison.deltaMaxVib}` : comparison.deltaMaxVib})
                    </span>
                  </div>
                </div>

                <div className="flex justify-between py-1.5 border-b border-industrial-border/50">
                  <span className="text-industrial-muted">Avg Temperature:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">{secondTest.average_temperature} °C</span>
                    <span className={`text-[11px] font-bold ${comparison.deltaAvgTemp <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ({comparison.deltaAvgTemp > 0 ? `+${comparison.deltaAvgTemp}` : comparison.deltaAvgTemp})
                    </span>
                  </div>
                </div>

                <div className="flex justify-between py-1.5 border-b border-industrial-border/50">
                  <span className="text-industrial-muted">Condition Profile:</span>
                  <span className="text-white">{secondTest.test_condition}</span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-industrial-muted">Priority:</span>
                  <StatusBadge status={secondTest.priority} size="sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
