import React from 'react';
import {
  Brain,
  MessageSquare,
  Database,
  Activity,
  Settings,
  Radio,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, systemStatus }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Brain },
    { id: 'ask', label: 'Ask FlowAble', icon: MessageSquare },
    { id: 'memory', label: 'Memory', icon: Database },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings & Status', icon: Settings },
  ];

  const omiConnected = systemStatus?.integrations?.omi?.connected;
  const qdrantConnected = systemStatus?.integrations?.qdrant?.connected;
  const lyzrConnected = systemStatus?.integrations?.lyzr?.connected;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none"
              aria-label="FlowAble home"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
                  Flow<span className="text-emerald-600">Able</span>
                </span>
                <span className="text-xs text-slate-500 font-medium tracking-wide">
                  Voice Memory & Adaptive Assistant
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Quick Integration Status Badges */}
          <div className="flex items-center gap-2">
            {/* Omi badge */}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                omiConnected
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
              title={omiConnected ? 'Omi webhooks active' : 'Omi listener ready (no webhooks received yet)'}
            >
              <span className={`w-2 h-2 rounded-full ${omiConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="hidden sm:inline">Omi:</span>
              <span>{omiConnected ? 'Active' : 'Ready'}</span>
            </div>

            {/* Qdrant badge */}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                qdrantConnected
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-700 border border-slate-300'
              }`}
              title={qdrantConnected ? 'Connected to Qdrant Cloud' : 'Qdrant offline or unconfigured'}
            >
              <span className={`w-2 h-2 rounded-full ${qdrantConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span className="hidden sm:inline">Qdrant:</span>
              <span>{qdrantConnected ? 'Connected' : 'Offline'}</span>
            </div>

            {/* Lyzr badge */}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                lyzrConnected
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-700 border border-slate-300'
              }`}
              title={lyzrConnected ? 'Lyzr Agent Studio active' : 'Lyzr offline or unconfigured'}
            >
              <span className={`w-2 h-2 rounded-full ${lyzrConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span className="hidden sm:inline">Lyzr:</span>
              <span>{lyzrConnected ? 'Active' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
