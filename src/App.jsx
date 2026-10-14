import React, { useState, useEffect } from 'react';
import AccessibilityToolbar from './components/AccessibilityToolbar';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import AskFlowable from './components/AskFlowable';
import MemoryExplorer from './components/MemoryExplorer';
import ActivityLog from './components/ActivityLog';
import SettingsStatus from './components/SettingsStatus';
import { fetchStatus, fetchStats } from './api';
import { Heart, Github, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [initialPrompt, setInitialPrompt] = useState('');
  const [systemStatus, setSystemStatus] = useState(null);
  const [stats, setStats] = useState({ points_count: 0, total_webhooks: 0 });

  const refreshSystemData = async () => {
    try {
      const [statusData, statsData] = await Promise.all([
        fetchStatus().catch(() => null),
        fetchStats().catch(() => ({ points_count: 0, total_webhooks: 0 })),
      ]);
      if (statusData) setSystemStatus(statusData);
      if (statsData) setStats(statsData);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    refreshSystemData();
    const interval = setInterval(refreshSystemData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigateTab = (tabId, promptText = '') => {
    if (promptText) setInitialPrompt(promptText);
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Accessibility Bar */}
      <AccessibilityToolbar />

      {/* Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(t) => handleNavigateTab(t)}
        systemStatus={systemStatus}
      />

      {/* Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            systemStatus={systemStatus}
            stats={stats}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {activeTab === 'ask' && (
          <AskFlowable
            initialPrompt={initialPrompt}
            onAskSuccess={refreshSystemData}
          />
        )}

        {activeTab === 'memory' && (
          <MemoryExplorer onMemoryChange={refreshSystemData} />
        )}

        {activeTab === 'activity' && <ActivityLog />}

        {activeTab === 'settings' && (
          <SettingsStatus
            systemStatus={systemStatus}
            onRefresh={refreshSystemData}
          />
        )}
      </main>

      {/* Accessible Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">FlowAble</span>
            <span>—</span>
            <span>Stop Prompting, Solo Agents Hackathon</span>
            <span className="hidden sm:inline bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
              Track 4: Accessibility & Adaptive Assistants
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <span className="flex items-center gap-1 font-medium">
              Powered by Omi + Qdrant + Lyzr
            </span>
            <span>•</span>
            <a
              href="https://github.com/jayanthimg2006-creator/flowable"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-slate-900 font-semibold transition"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
