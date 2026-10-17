import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import { dashboardApi } from '../services/api';
import { LogOut, UserRound, Activity, Database, Radio, Menu, Wifi } from 'lucide-react';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mqttStatus, setMqttStatus] = useState(false);
  const [dbStatus, setDbStatus] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    setSocketConnected(socket.connected);

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    const onMqttStatus = (data) => setMqttStatus(data.connected);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('mqtt_status', onMqttStatus);

    // Initial check
    dashboardApi.getHardwareStatus()
      .then((res) => {
        if (res.success) setMqttStatus(res.status.brokerConnected);
      })
      .catch(() => setMqttStatus(false));

    dashboardApi.getHealth()
      .then((res) => setDbStatus(res.database === 'connected'))
      .catch(() => setDbStatus(false));

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('mqtt_status', onMqttStatus);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="min-h-16 bg-white/95 border-b border-industrial-border backdrop-blur-md px-4 lg:px-6 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 z-30 sticky top-0 no-print">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 text-industrial-muted hover:text-industrial-text rounded-lg hover:bg-industrial-cardLight transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-industrial-accent group-hover:bg-cyan-100 transition">
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-industrial-text text-base">Motor<span className="text-industrial-accent">Vibe</span></span>
            <span className="hidden sm:inline-flex text-[9px] font-semibold tracking-wider text-industrial-secondary uppercase bg-teal-50 px-2 py-1 rounded-full border border-teal-100">
              Industrial · v1.0
            </span>
          </div>
        </Link>
      </div>

      {/* System Status Indicators */}
      <div className="order-3 flex w-full items-center justify-center gap-1.5 text-[10px] font-mono sm:gap-2 md:order-none md:w-auto">
        <StatusPill icon={Database} label="PG" value={dbStatus ? 'ONLINE' : 'OFFLINE'} active={dbStatus} />
        <StatusPill icon={Radio} label="MQTT" value={mqttStatus ? 'CONNECTED' : 'STANDBY'} active={mqttStatus} />
        <StatusPill icon={Wifi} label="WS" value={socketConnected ? 'STREAMING' : 'IDLE'} active={socketConnected} />
      </div>

      {/* User Actions */}
      <div className="ml-auto flex items-center gap-2">
        <div className="flex max-w-36 items-center gap-2 rounded-xl border border-industrial-border bg-industrial-bg px-2.5 py-1.5 font-mono text-xs text-industrial-muted sm:max-w-48 sm:px-3">
          <UserRound className="w-4 h-4 shrink-0 text-industrial-accent" />
          <span className="truncate text-industrial-text font-medium">{user?.username || 'Operator'}</span>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          className="p-2 text-industrial-muted hover:text-industrial-critical hover:bg-rose-50 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

function StatusPill({ icon: Icon, label, value, active }) {
  const stateClass = active
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
    : 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 sm:gap-1.5 sm:px-2.5 ${stateClass}`} title={`${label}: ${value}`} aria-label={`${label}: ${value}`}>
      <Icon className="h-3 w-3 shrink-0" />
      <span className="font-bold">{label}</span>
      <span className="hidden lg:inline">{value}</span>
    </div>
  );
}
