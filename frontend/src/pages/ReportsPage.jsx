import React, { useState, useEffect } from 'react';
import { testsApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { FileText, Printer } from 'lucide-react';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testsApi.getAll().then((res) => {
      if (res.success && res.tests) {
        setReports(res.tests);
        if (res.tests.length > 0) {
          setSelectedReport(res.tests[0]);
        }
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-industrial-border pb-5 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-industrial-accent" />
            Engineering Test Reports
          </h1>
          <p className="text-xs font-mono text-industrial-muted mt-1">
            Certified ISO 10816-compatible machinery condition records with printable sign-offs
          </p>
        </div>

        {selectedReport && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-industrial-secondary hover:bg-teal-800 text-white font-bold rounded-xl text-xs font-mono uppercase tracking-wider transition shadow-sm shadow-teal-900/15"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="bg-industrial-card border border-industrial-border rounded-2xl p-4 shadow-lg space-y-2.5 no-print">
          <div className="text-xs font-mono uppercase tracking-wider text-industrial-muted border-b border-industrial-border pb-2.5">
            Available Assessment Records ({reports.length})
          </div>

          <div className="max-h-[600px] overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <div className="p-8 text-center text-xs font-mono text-industrial-muted">
                Loading reports repository...
              </div>
            ) : reports.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-industrial-muted">
                No reports generated yet. Run a motor test to generate records.
              </div>
            ) : (
              reports.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`p-3.5 rounded-xl border cursor-pointer font-mono text-xs transition ${
                    selectedReport?.id === r.id
                      ? 'bg-industrial-accent/15 border-industrial-accent text-white shadow'
                      : 'bg-industrial-bg border-industrial-border text-industrial-muted hover:border-industrial-muted hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">#{r.id} • {r.motor_code}</span>
                    <StatusBadge status={r.health_status} size="sm" />
                  </div>
                  <div className="text-[11px] text-industrial-muted font-sans truncate mb-1">
                    {r.motor_name}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-industrial-muted pt-1 border-t border-industrial-border/40">
                    <span>{new Date(r.started_at).toLocaleDateString()}</span>
                    <span>Score: {r.health_score}/100</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Report Preview Document (Print-ready) */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <div className="bg-white text-slate-900 border border-slate-300 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 card-print">
              {/* Formal Report Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                <div>
                  <div className="text-2xl font-black tracking-tight text-slate-900">MOTORVIBE</div>
                  <div className="text-xs uppercase tracking-wider text-slate-600 font-bold mt-0.5">
                    Industrial Motor Vibration & Health Diagnostic Report
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1">
                    Report ID: MV-RPT-{selectedReport.id.toString().padStart(6, '0')} • Standard: ISO 10816-3 Class II
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-slate-600">
                  <div>Date: {new Date(selectedReport.started_at).toLocaleDateString()}</div>
                  <div>Time: {new Date(selectedReport.started_at).toLocaleTimeString()}</div>
                  <div className="mt-1">
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-slate-100 border border-slate-300">
                      {selectedReport.mode} mode
                    </span>
                  </div>
                </div>
              </div>

              {/* Machine Specifications Grid */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  1. Machine Asset Specifications
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Asset Code</span>
                    <span className="font-bold text-slate-900">{selectedReport.motor_code}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Description</span>
                    <span className="font-bold text-slate-900 truncate block">{selectedReport.motor_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Test Condition</span>
                    <span className="font-bold text-slate-900">{selectedReport.test_condition}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Test Duration</span>
                    <span className="font-bold text-slate-900">{selectedReport.duration_seconds} seconds</span>
                  </div>
                </div>
              </div>

              {/* Quantitative Measurements */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  2. Quantitative Sensor Measurements
                </div>
                <table className="w-full text-left text-xs font-mono border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 uppercase">
                    <tr>
                      <th className="py-2.5 px-3 border-b border-slate-200">Parameter</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Average Reading</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Maximum Peak</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Standard Threshold</th>
                      <th className="py-2.5 px-3 border-b border-slate-200">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2 px-3 font-semibold">Vibration Velocity RMS</td>
                      <td className="py-2 px-3">{selectedReport.average_vibration} mm/s</td>
                      <td className="py-2 px-3 font-bold">{selectedReport.maximum_vibration} mm/s</td>
                      <td className="py-2 px-3 text-slate-500">4.50 mm/s Limit</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{selectedReport.health_status}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold">Operational Temperature</td>
                      <td className="py-2 px-3">{selectedReport.average_temperature} °C</td>
                      <td className="py-2 px-3 font-bold">{selectedReport.maximum_temperature} °C</td>
                      <td className="py-2 px-3 text-slate-500">75.0 °C Limit</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{selectedReport.health_status}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Health Score & Diagnostic Conclusion */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  3. Health Score & Diagnostic Conclusion
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <span className="text-slate-500 font-mono text-[11px] block">Overall Machine Health Index</span>
                      <span className="text-2xl font-black text-slate-900">{selectedReport.health_score} / 100</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 font-mono text-[11px] block">Maintenance Priority</span>
                      <span className="text-sm font-bold uppercase text-slate-900">{selectedReport.priority} Priority</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 block">Identified Condition / Fault Indication:</span>
                    <p className="text-slate-700 font-mono text-sm mt-0.5">{selectedReport.possible_fault}</p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 block">Recommended Engineering Action:</span>
                    <p className="text-slate-700 mt-0.5">{selectedReport.recommendation}</p>
                  </div>
                </div>
              </div>

              {/* Sign-off / Disclaimer */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-[11px] font-mono text-slate-600 print-break-inside-avoid">
                <div>
                  <span className="block font-bold uppercase text-slate-800">Operator Sign-off</span>
                  <div className="mt-8 border-b border-slate-400 w-48" />
                  <span className="text-[10px] block mt-1">Authorized Plant Diagnostics Officer</span>
                </div>
                <div className="text-right">
                  <span className="block font-bold uppercase text-slate-800">Expo Verification Stamp</span>
                  <div className="mt-8 border-b border-slate-400 w-48 ml-auto" />
                  <span className="text-[10px] block mt-1">MotorVibe Telemetry Gateway</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs font-mono text-industrial-muted bg-industrial-card border border-industrial-border rounded-2xl">
              Select a test report from the left list to review or print.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
