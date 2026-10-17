import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlayCircle,
  History,
  GitCompare,
  FileText,
  X,
  Factory,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'New Motor Test', path: '/tests/new', icon: PlayCircle },
  { name: 'Test History', path: '/history', icon: History },
  { name: 'Comparison', path: '/compare', icon: GitCompare },
  { name: 'Reports', path: '/reports', icon: FileText },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-industrial-border shadow-xl shadow-slate-900/5 transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between no-print`}
      >
        <div>
          {/* Mobile Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-industrial-border lg:hidden">
            <span className="font-bold text-industrial-text text-base">Navigation</span>
            <button
              onClick={onClose}
              aria-label="Close navigation menu"
              className="p-1 rounded-lg text-industrial-muted hover:text-industrial-text hover:bg-industrial-cardLight"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <div className="mb-2 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-industrial-muted">
              Plant operations
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 border-l-2 px-3.5 py-2.5 rounded-r-xl font-medium text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-cyan-50 text-cyan-900 border-l-industrial-accent font-semibold'
                        : 'border-l-transparent text-industrial-muted hover:text-industrial-text hover:bg-industrial-cardLight'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* System Specs Box */}
        <div className="m-4 space-y-2 rounded-2xl border border-industrial-border bg-industrial-bg p-4 text-xs font-mono text-industrial-muted">
          <div className="flex items-center gap-2 text-industrial-text font-semibold">
            <Factory className="h-4 w-4 text-industrial-secondary" />
            <span>MOTORVIBE CORE</span>
          </div>
          <div className="border-t border-industrial-border pt-2">Multi-source telemetry</div>
          <div>EMQX / MQTT integration</div>
          <div>ISO 10816 analysis</div>
        </div>
      </aside>
    </>
  );
}
