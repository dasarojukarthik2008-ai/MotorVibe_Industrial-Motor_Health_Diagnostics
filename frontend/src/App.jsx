import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NewTestPage from './pages/NewTestPage';
import HistoryPage from './pages/HistoryPage';
import TestDetailsPage from './pages/TestDetailsPage';
import ComparePage from './pages/ComparePage';
import ReportsPage from './pages/ReportsPage';
import { RefreshCw } from 'lucide-react';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-industrial-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-industrial-muted font-mono text-sm">
          <RefreshCw className="w-8 h-8 animate-spin text-industrial-accent" />
          <span>Verifying industrial credentials...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Authentication Routes */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      {/* Protected Industrial Engineering Routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tests/new" element={<NewTestPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/history/:id" element={<TestDetailsPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>

      {/* Catch-all redirect to public landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
