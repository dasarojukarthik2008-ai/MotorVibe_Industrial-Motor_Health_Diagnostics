import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { testsApi, motorsApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import {
  History,
  Search,
  Eye,
  RefreshCw,
  GitCompare,
  PlayCircle,
  AlertCircle,
  Calendar,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const [tests, setTests] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [motors, setMotors] = useState([]);

  // Filter States
  const [selectedMotor, setSelectedMotor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  // Pagination & Loading States
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await testsApi.getAll({
        motorId: selectedMotor,
        status: selectedStatus,
        mode: selectedMode,
        dateFrom,
        dateTo,
        search,
      });
      if (res.success) {
        setTests(res.tests || []);
        setTotalCount(res.totalCount !== undefined ? res.totalCount : (res.tests || []).length);
        setCurrentPage(1);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve test history from database.');
      setTests([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [selectedMotor, selectedStatus, selectedMode, dateFrom, dateTo, search]);

  useEffect(() => {
    motorsApi.getAll().then((res) => {
      if (res.success) setMotors(res.motors || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleResetFilters = () => {
    setSelectedMotor('');
    setSelectedStatus('');
    setSelectedMode('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
  };

  const hasActiveFilters = Boolean(selectedMotor || selectedStatus || selectedMode || dateFrom || dateTo || search);

  // Client-side pagination over fetched database records
  const totalPages = Math.max(1, Math.ceil(tests.length / PAGE_SIZE));
  const paginatedTests = tests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-industrial-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <History className="w-6 h-6 text-industrial-accent" />
              Complete Motor Test History
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-industrial-card border border-industrial-border text-industrial-accent font-semibold">
              {totalCount} Total Saved Tests
            </span>
          </div>
          <p className="text-xs font-mono text-industrial-muted mt-1">
            Authoritative PostgreSQL repository of all historical condition evaluations & telemetry metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/tests/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-industrial-secondary hover:bg-teal-800 text-white font-bold text-xs font-mono rounded-xl transition shadow-sm shadow-teal-900/15"
          >
            <PlayCircle className="w-4 h-4" />
            New Test
          </Link>
          <Link
            to="/compare"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-industrial-card hover:bg-industrial-cardLight border border-industrial-border text-white text-xs font-mono rounded-xl transition"
          >
            <GitCompare className="w-4 h-4 text-industrial-secondary" />
            Compare
          </Link>
          <button
            onClick={fetchTests}
            className="p-2 text-industrial-muted hover:text-white bg-industrial-card border border-industrial-border rounded-xl hover:bg-industrial-cardLight transition"
            title="Reload from PostgreSQL"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Database Error Alert */}
      {error && (
        <div className="p-4 bg-rose-950/50 border border-rose-500/50 rounded-2xl text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>Database Error: {error}</span>
          </div>
          <button
            onClick={fetchTests}
            className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800 text-white rounded-lg text-xs font-mono transition"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Comprehensive Filter Toolbar */}
      <div className="bg-industrial-card border border-industrial-border rounded-2xl p-4 shadow-lg space-y-3 font-mono text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Keyword Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-3.5 h-3.5 text-industrial-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search code, name, fault..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-industrial-bg border border-industrial-border rounded-xl pl-8 pr-3 py-2 text-white focus:outline-none focus:border-industrial-accent"
            />
          </div>

          {/* Motor Filter */}
          <select
            value={selectedMotor}
            onChange={(e) => setSelectedMotor(e.target.value)}
            className="bg-industrial-bg border border-industrial-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-industrial-accent"
          >
            <option value="">All Motors</option>
            {motors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.motor_code} — {m.name}
              </option>
            ))}
          </select>

          {/* Testing Mode */}
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="bg-industrial-bg border border-industrial-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-industrial-accent"
          >
            <option value="">All Modes</option>
            <option value="simulation">Simulation</option>
            <option value="hardware">Hardware ESP32</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-industrial-bg border border-industrial-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-industrial-accent"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="stopped">Stopped</option>
            <option value="running">Running</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters ? (
            <button
              onClick={handleResetFilters}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-industrial-bg hover:bg-industrial-cardLight border border-industrial-border text-industrial-muted hover:text-white rounded-xl transition"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          ) : (
            <div className="flex items-center justify-center text-[11px] text-industrial-muted">
              Filter Active: None
            </div>
          )}
        </div>

        {/* Date Range Sub-row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-industrial-border/50 text-[11px] text-industrial-muted">
          <span className="flex items-center gap-1 text-white font-medium">
            <Calendar className="w-3.5 h-3.5 text-industrial-accent" />
            Date Range:
          </span>
          <div className="flex items-center gap-2">
            <span>From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-industrial-bg border border-industrial-border rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-industrial-accent"
            />
          </div>
          <div className="flex items-center gap-2">
            <span>To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-industrial-bg border border-industrial-border rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-industrial-accent"
            />
          </div>
          <div className="ml-auto text-industrial-muted">
            Showing {paginatedTests.length} of {tests.length} tests (Newest first)
          </div>
        </div>
      </div>

      {/* Desktop History Table */}
      <div className="bg-industrial-card border border-industrial-border rounded-2xl shadow-lg overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-industrial-border bg-industrial-cardLight/50 text-industrial-muted uppercase">
                <th className="py-3 px-4">Test ID / Motor</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Mode & Profile</th>
                <th className="py-3 px-4">Vibration (Avg / Max)</th>
                <th className="py-3 px-4">Temp (Avg / Max)</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Diagnostics & Priority</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-border/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-industrial-muted">
                    <RefreshCw className="w-6 h-6 animate-spin text-industrial-accent mx-auto mb-2" />
                    <span>Querying PostgreSQL database records...</span>
                  </td>
                </tr>
              ) : tests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-industrial-bg border border-industrial-border flex items-center justify-center text-industrial-muted">
                        <History className="w-6 h-6" />
                      </div>
                      <div className="text-white font-bold text-sm">
                        {hasActiveFilters ? 'No tests match the current filter criteria' : 'No saved motor tests found'}
                      </div>
                      <p className="text-industrial-muted text-xs max-w-sm">
                        {hasActiveFilters
                          ? 'Try resetting the filters or clearing the search query to see other test records.'
                          : 'Execute your first condition assessment in Simulation or Hardware mode.'}
                      </p>
                      {hasActiveFilters ? (
                        <button
                          onClick={handleResetFilters}
                          className="mt-1 px-4 py-2 bg-industrial-bg hover:bg-industrial-cardLight border border-industrial-border text-white text-xs rounded-xl"
                        >
                          Clear All Filters
                        </button>
                      ) : (
                        <Link
                          to="/tests/new"
                          className="mt-1 px-5 py-2.5 bg-industrial-secondary hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition shadow-sm"
                        >
                          Start New Motor Test
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTests.map((t) => (
                  <tr key={t.id} className="hover:bg-industrial-cardLight transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">#{t.id} • {t.motor_code}</div>
                      <div className="text-[11px] text-industrial-muted font-sans truncate max-w-[150px]">
                        {t.motor_name}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-industrial-muted">
                      {new Date(t.started_at).toLocaleDateString()}
                      <span className="block text-[10px]">{new Date(t.started_at).toLocaleTimeString()}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <StatusBadge status={t.mode} size="sm" />
                      </div>
                      <span className="text-[11px] text-industrial-muted">{t.test_condition}</span>
                    </td>
                    <td className="py-3 px-4 text-cyan-400">
                      {t.average_vibration} / <span className="font-bold">{t.maximum_vibration}</span> mm/s
                    </td>
                    <td className="py-3 px-4 text-amber-400">
                      {t.average_temperature}° / <span className="font-bold">{t.maximum_temperature}°</span> C
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      <span className="text-sm">{t.health_score}</span>
                      <span className="text-industrial-muted text-[10px]">/100</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-rose-300 text-[11px] truncate max-w-[160px]">
                        {t.possible_fault}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <StatusBadge status={t.health_status} size="sm" />
                        <span className="text-[10px] text-industrial-muted">Pri: {t.priority}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/history/${t.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-industrial-bg hover:bg-industrial-cardLight border border-industrial-border text-industrial-accent hover:text-cyan-300 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {tests.length > PAGE_SIZE && (
          <div className="p-4 border-t border-industrial-border bg-industrial-cardLight/30 flex items-center justify-between text-xs font-mono">
            <span className="text-industrial-muted">
              Page {currentPage} of {totalPages} ({tests.length} Total Saved Tests)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-industrial-bg border border-industrial-border text-white disabled:opacity-40 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-industrial-bg border border-industrial-border text-white disabled:opacity-40 transition flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Responsive Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-industrial-muted">
            Loading test records...
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-industrial-card border border-industrial-border rounded-xl p-6 text-center space-y-3">
            <div className="text-white font-bold text-sm">No saved tests found</div>
            <Link
              to="/tests/new"
              className="inline-block px-4 py-2 bg-industrial-secondary text-white font-bold text-xs rounded-xl"
            >
              Start New Test
            </Link>
          </div>
        ) : (
          paginatedTests.map((t) => (
            <div key={t.id} className="bg-industrial-card border border-industrial-border rounded-xl p-4 space-y-3 font-mono text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-bold text-white text-sm">#{t.id} • {t.motor_code}</span>
                  <span className="block text-industrial-muted font-sans text-xs">{t.motor_name}</span>
                </div>
                <StatusBadge status={t.health_status} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-2 bg-industrial-bg p-2.5 rounded-lg border border-industrial-border">
                <div>
                  <span className="text-[10px] text-industrial-muted block">Vibration Peak</span>
                  <span className="text-cyan-400 font-bold">{t.maximum_vibration} mm/s</span>
                </div>
                <div>
                  <span className="text-[10px] text-industrial-muted block">Temp Peak</span>
                  <span className="text-amber-400 font-bold">{t.maximum_temperature} °C</span>
                </div>
                <div>
                  <span className="text-[10px] text-industrial-muted block">Health Score</span>
                  <span className="text-white font-bold">{t.health_score}/100</span>
                </div>
                <div>
                  <span className="text-[10px] text-industrial-muted block">Mode</span>
                  <span className="text-industrial-accent uppercase">{t.mode}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-industrial-border">
                <span className="text-[10px] text-industrial-muted">
                  {new Date(t.started_at).toLocaleString()}
                </span>
                <Link
                  to={`/history/${t.id}`}
                  className="text-industrial-accent font-semibold flex items-center gap-1"
                >
                  Inspect →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
