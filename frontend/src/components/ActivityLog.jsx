import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Info,
  Radio,
  Database,
  Brain,
  ShieldCheck,
} from 'lucide-react';
import { fetchActivity } from '../api';

export default function ActivityLog() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await fetchActivity(50);
      setEvents(data.events || []);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // Poll every 5 seconds for live activity
    const interval = setInterval(loadEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const getEventIcon = (type) => {
    switch (type) {
      case 'omi_webhook':
      case 'omi_realtime':
        return <Radio className="w-4 h-4 text-emerald-600" />;
      case 'memory_stored':
      case 'memory_deleted':
      case 'semantic_search':
        return <Database className="w-4 h-4 text-blue-600" />;
      case 'lyzr_reasoning':
        return <Brain className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Success</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Processing</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3 text-red-600" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
            <Info className="w-3 h-3 text-slate-500" />
            <span>Info</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pipeline Activity
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Real-time workflow execution log showing verified Omi webhooks, Qdrant vector
            indexing, and Lyzr Agent Studio inferences.
          </p>
        </div>

        <button
          onClick={loadEvents}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Privacy Notice Banner */}
      <div className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-3.5 text-xs flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span>
          <strong className="font-semibold">Privacy First:</strong> Execution logs only track
          operational metadata, elapsed times, and system statuses. Private transcript contents
          and secret credentials are never stored in activity logs.
        </span>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {events.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p>No activity recorded yet in this session.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((evt) => (
              <div key={evt.id} className="p-4 sm:p-5 hover:bg-slate-50 transition flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getEventIcon(evt.event_type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                      {evt.event_type.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(evt.status)}
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-slate-800 break-words">
                    {evt.message}
                  </p>

                  {/* Metadata preview if available */}
                  {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                    <div className="mt-2 text-xs font-mono text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 overflow-x-auto">
                      {JSON.stringify(evt.metadata)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
