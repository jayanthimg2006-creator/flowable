import React, { useState } from 'react';
import {
  Settings,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  Key,
  ExternalLink,
  Radio,
  Database,
  Brain,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

export default function SettingsStatus({ systemStatus, onRefresh }) {
  const [copiedText, setCopiedText] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const omi = systemStatus?.integrations?.omi || {};
  const qdrant = systemStatus?.integrations?.qdrant || {};
  const lyzr = systemStatus?.integrations?.lyzr || {};
  const publicConfig = systemStatus?.public_config || {};

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefresh) await onRefresh();
    setRefreshing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Integration Status & Setup Guide
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Check the live health of Omi, Qdrant, and Lyzr. Learn how to configure credentials
            locally or on your deployment host.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Re-check Connectivity</span>
        </button>
      </div>

      {/* Security Guarantee Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3.5">
        <Shield className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-emerald-900">
          <strong className="font-bold">Zero-Secret Exposure Architecture: </strong>
          Your actual API keys and tokens are strictly kept in the server environment (
          <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-semibold">.env</code>)
          and are never delivered to the client browser.
        </div>
      </div>

      {/* Integration Status Breakdown */}
      <div className="space-y-4">
        {/* 1. Omi Integration */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">1. Omi Voice Capture</h2>
                <span className="text-xs text-slate-500 font-medium">Webhook Ingestion Mechanism</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold px-2.5 py-1 rounded-full">
                Endpoints Active
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  omi.connected
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {omi.connected ? 'Webhooks Received' : 'Awaiting First Webhook'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-600">Conversation Webhook URL:</span>
              <div className="flex items-center gap-2 font-mono">
                <code className="text-emerald-700">POST /omi/conversation</code>
                <button
                  onClick={() => handleCopy('/omi/conversation', 'omi_conv')}
                  className="text-slate-400 hover:text-slate-700"
                  title="Copy path"
                >
                  {copiedText === 'omi_conv' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-600">Realtime Stream Webhook URL:</span>
              <div className="flex items-center gap-2 font-mono">
                <code className="text-emerald-700">POST /omi/realtime</code>
                <button
                  onClick={() => handleCopy('/omi/realtime', 'omi_real')}
                  className="text-slate-400 hover:text-slate-700"
                  title="Copy path"
                >
                  {copiedText === 'omi_real' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-600">Total Transcripts Processed:</span>
              <span className="font-bold text-slate-900">{omi.total_transcripts_stored || 0}</span>
            </div>
          </div>

          {/* Omi Setup Instructions */}
          <div className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">How to Configure Omi Webhook:</h3>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
              <li>
                For local development, expose your local port 8000 using ngrok:
                <div className="bg-slate-900 text-slate-100 p-2 rounded-lg font-mono text-[11px] my-1 flex items-center justify-between">
                  <code>ngrok http 8000</code>
                  <button
                    onClick={() => handleCopy('ngrok http 8000', 'ngrok')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedText === 'ngrok' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </li>
              <li>
                In the Omi app or developer portal, enter your public URL followed by{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">/omi/conversation</code> (e.g.,{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">https://xxxx.ngrok-free.app/omi/conversation</code>).
              </li>
              <li>Speak into your Omi wearable. Transcripts will automatically stream and store into Qdrant!</li>
            </ol>
          </div>
        </div>

        {/* 2. Qdrant Cloud Integration */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">2. Qdrant Persistent Memory</h2>
                <span className="text-xs text-slate-500 font-medium">Cluster: flowable-memory</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  qdrant.configured
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {qdrant.configured ? 'Configured in .env' : 'Missing in .env'}
              </span>

              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  qdrant.connected
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                {qdrant.connected ? 'Cluster Connected' : 'Not Connected'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-600">Status Message:</span>
              <span className="font-medium text-slate-900">{qdrant.message || 'Ready'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-600">Collection Name:</span>
              <span className="font-mono font-bold text-slate-800">
                {qdrant.collection_name || 'flowable_memory'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-600">Embedding Vector Dimension:</span>
              <span className="font-mono text-slate-800">384 (FastEmbed BAAI/bge-small-en-v1.5)</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-600">Total Stored Points:</span>
              <span className="font-bold text-slate-900">{qdrant.points_count || 0}</span>
            </div>
          </div>

          {/* Qdrant Setup Instructions */}
          <div className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">How to Configure Qdrant Cloud:</h3>
            <ol className="list-decimal list-inside space-y-1 pl-1 leading-relaxed">
              <li>Open your Qdrant Cloud dashboard and select your cluster: <span className="font-semibold">flowable-memory</span>.</li>
              <li>Copy your cluster endpoint URL and API Key.</li>
              <li>
                In your local <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-semibold">.env</code> file, set:
                <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono text-[11px] my-1 space-y-1">
                  <div>QDRANT_URL=https://your-cluster-id.us-east4-0.gcp.cloud.qdrant.io:6333</div>
                  <div>QDRANT_API_KEY=your_actual_qdrant_api_key</div>
                </div>
              </li>
              <li>Click "Re-check Connectivity" above to verify the connection.</li>
            </ol>
          </div>
        </div>

        {/* 3. Lyzr Integration */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">3. Lyzr Agent Studio</h2>
                <span className="text-xs text-slate-500 font-medium">v3 Inference Chat API</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  lyzr.configured
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {lyzr.configured ? 'Configured in .env' : 'Missing in .env'}
              </span>

              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  lyzr.connected
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                {lyzr.connected ? 'Agent Reachable' : 'Not Connected'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-600">Status Message:</span>
              <span className="font-medium text-slate-900">{lyzr.message || 'Ready'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-600">Inference Endpoint:</span>
              <code className="text-purple-700 font-mono">
                https://agent-prod.studio.lyzr.ai/v3/inference/chat/
              </code>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-600">Agent ID:</span>
              <span className="font-mono text-slate-800">
                {publicConfig.lyzr?.agent_id_set ? 'Set in .env' : 'Not configured'}
              </span>
            </div>
          </div>

          {/* Lyzr Setup Instructions */}
          <div className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">How to Configure Lyzr Agent Studio:</h3>
            <ol className="list-decimal list-inside space-y-1 pl-1 leading-relaxed">
              <li>Log in to <span className="font-semibold">Lyzr Agent Studio</span> (studio.lyzr.ai).</li>
              <li>Copy your API Key and your deployed Agent ID.</li>
              <li>
                In your local <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-semibold">.env</code> file, set:
                <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono text-[11px] my-1 space-y-1">
                  <div>LYZR_API_KEY=your_actual_lyzr_api_key</div>
                  <div>LYZR_AGENT_ID=your_actual_agent_id</div>
                </div>
              </li>
              <li>Click "Re-check Connectivity" above to verify reasoning!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
