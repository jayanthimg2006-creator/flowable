import React from 'react';
import {
  Mic,
  Database,
  Brain,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  HelpCircle,
  Radio,
  FileText,
  AlertCircle,
} from 'lucide-react';

export default function Dashboard({
  systemStatus,
  stats,
  recentActivity,
  onNavigateTab,
}) {
  const omi = systemStatus?.integrations?.omi || {};
  const qdrant = systemStatus?.integrations?.qdrant || {};
  const lyzr = systemStatus?.integrations?.lyzr || {};

  return (
    <div className="space-y-8">
      {/* Welcome & Track 4 Banner */}
      <section className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-4 border border-emerald-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hackathon Track 4: Accessibility & Adaptive Assistants</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Welcome to FlowAble
          </h1>
          <p className="text-slate-200 text-base sm:text-lg leading-relaxed mb-6">
            Your voice-first assistive memory partner. FlowAble captures spoken instructions,
            safely stores them in persistent vector memory, and answers questions with grounded
            clarity, accessible explanations, and step-by-step checklists.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('ask')}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/25"
            >
              <span>Ask FlowAble a Question</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateTab('memory')}
              className="inline-flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-white font-semibold px-4 py-2.5 rounded-xl transition border border-slate-700"
            >
              <span>Explore Saved Memories</span>
            </button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Radio className="w-80 h-80 text-emerald-300" />
        </div>
      </section>

      {/* Integration Status Cards */}
      <section aria-labelledby="integrations-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="integrations-heading" className="text-xl font-bold text-slate-900">
            Required Hackathon Integrations
          </h2>
          <button
            onClick={() => onNavigateTab('settings')}
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View configuration guide</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Omi Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Mic className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    omi.connected
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {omi.connected ? 'Active Webhooks' : 'Webhook Listener Ready'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Omi Voice Capture</h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Captures spoken instructions and wearable audio via webhook endpoints:{' '}
                <code className="text-emerald-700 font-mono">/omi/conversation</code> and{' '}
                <code className="text-emerald-700 font-mono">/omi/realtime</code>.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Total Webhooks:</span>
                <span className="font-semibold text-slate-700">{omi.total_webhooks || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Webhook:</span>
                <span className="font-semibold text-slate-700">
                  {omi.last_webhook_at ? new Date(omi.last_webhook_at).toLocaleTimeString() : 'None yet'}
                </span>
              </div>
            </div>
          </div>

          {/* Qdrant Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    qdrant.connected
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  {qdrant.connected ? 'Connected Cloud' : 'Needs Config in .env'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Qdrant Cloud Memory
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Persistent cluster <span className="font-semibold">flowable-memory</span> storing
                384-dimensional FastEmbed dense vectors with deterministic UUIDv5 idempotency.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Collection:</span>
                <span className="font-semibold text-slate-700 font-mono">
                  {qdrant.collection_name || 'flowable_memory'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Stored Points:</span>
                <span className="font-semibold text-slate-700">{qdrant.points_count || stats.points_count || 0}</span>
              </div>
            </div>
          </div>

          {/* Lyzr Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <Brain className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    lyzr.connected
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  {lyzr.connected ? 'Studio Active' : 'Needs Config in .env'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Lyzr Agent Studio
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Lyzr v3 Chat inference endpoint synthesizing grounded memory answers,
                structured checklists, and plain accessible explanations.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-semibold text-slate-700">
                  {lyzr.connected ? 'Ready for Queries' : 'Awaiting API Keys'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Mode:</span>
                <span className="font-semibold text-slate-700">Adaptive Assistant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real Execution Loop Spotlight */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          The Working End-to-End Execution Loop
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          Every conversation follows a verified, grounded, and privacy-preserving workflow:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 text-emerald-700 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs">
                1
              </span>
              <span>Voice Capture</span>
            </div>
            <p className="text-xs text-slate-600">
              User speaks to Omi. Webhook delivers transcript segments to{' '}
              <code className="text-emerald-800 font-mono">/omi/conversation</code>.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">
                2
              </span>
              <span>Vector Memory</span>
            </div>
            <p className="text-xs text-slate-600">
              FastEmbed generates 384-dim vector. Qdrant Cloud stores point with deterministic UUIDv5.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 text-indigo-700 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs">
                3
              </span>
              <span>Semantic Search</span>
            </div>
            <p className="text-xs text-slate-600">
              User submits a query. Qdrant performs cosine similarity search to retrieve relevant memories.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 text-purple-700 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs">
                4
              </span>
              <span>Lyzr Reasoning</span>
            </div>
            <p className="text-xs text-slate-600">
              Lyzr Agent Studio provides grounded answer, accessible steps, and interactive checklist.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Prompts & Jump Starters */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-600" />
          <span>Try Asking FlowAble (Examples)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            'What instructions did the doctor give me about my appointment?',
            'Where did I put the spare house keys?',
            'What were the steps discussed for finishing the project?',
          ].map((promptText, i) => (
            <button
              key={i}
              onClick={() => onNavigateTab('ask', promptText)}
              className="text-left bg-white p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-sm text-xs sm:text-sm font-medium text-slate-700 hover:text-emerald-900 transition flex items-center justify-between group"
            >
              <span>"{promptText}"</span>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 flex-shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
