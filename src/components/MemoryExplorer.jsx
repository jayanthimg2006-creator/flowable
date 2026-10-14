import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Plus,
  Trash2,
  Clock,
  Tag,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Radio,
  FileText,
  X,
  Send,
} from 'lucide-react';
import {
  fetchMemories,
  searchMemories,
  deleteMemory,
  createManualMemory,
  sendOmiWebhook,
} from '../api';

export default function MemoryExplorer({ onMemoryChange }) {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState('simple'); // 'simple' or 'omi_webhook'
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // New Memory Form State
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newActionItems, setNewActionItems] = useState('');
  const [saving, setSaving] = useState(false);

  const loadMemories = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const data = await fetchMemories(30);
      setMemories(data.memories || []);
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to load memories from backend.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setIsSearching(false);
      loadMemories();
      return;
    }

    setLoading(true);
    setIsSearching(true);
    try {
      const data = await searchMemories(searchQuery.trim(), 15);
      setMemories(data.results || []);
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to search memories.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    loadMemories();
  };

  const handleCreateMemory = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;

    setSaving(true);
    try {
      if (modalMode === 'simple') {
        const actionItemsList = newActionItems
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);

        await createManualMemory({
          title: newTitle || 'Voice Note',
          text: newText,
          category: newCategory,
          actionItems: actionItemsList,
        });
      } else {
        // Send actual Omi Conversation webhook payload!
        const omiPayload = {
          id: `mem_omi_${Date.now()}`,
          created_at: new Date().toISOString(),
          structured: {
            title: newTitle || 'Spoken Instruction',
            overview: newText.slice(0, 100),
            action_items: newActionItems
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean),
            category: newCategory,
          },
          transcript_segments: [
            {
              speaker: 'User',
              text: newText,
              start: 0.0,
              end: 5.0,
            },
          ],
        };
        await sendOmiWebhook(omiPayload);
      }

      setStatusMsg({
        type: 'success',
        text: 'Successfully stored memory vector into Qdrant collection.',
      });
      setShowAddModal(false);
      setNewTitle('');
      setNewText('');
      setNewActionItems('');
      loadMemories();
      if (onMemoryChange) onMemoryChange();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to create memory.' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      await deleteMemory(deleteCandidate.id);
      setStatusMsg({ type: 'success', text: 'Memory successfully deleted from Qdrant.' });
      setDeleteCandidate(null);
      loadMemories();
      if (onMemoryChange) onMemoryChange();
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to delete memory.' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Persistent Vector Memory
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Browse and search memories stored in Qdrant Cloud collection{' '}
            <code className="text-emerald-700 font-mono font-bold">flowable_memory</code>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadMemories}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
            title="Refresh memory list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-600/20 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Simulate / Add Memory</span>
          </button>
        </div>
      </div>

      {/* Status notification */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Semantic Search Bar */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm flex items-center gap-2">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Semantic vector search (e.g., 'doctor instructions', 'house keys', 'shopping')..."
          className="w-full text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none py-1"
        />
        {isSearching && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
          >
            Clear
          </button>
        )}
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl transition"
        >
          Search
        </button>
      </form>

      {/* Memories List */}
      <div className="space-y-4">
        {loading && (
          <div className="text-center py-12 text-slate-500 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
            <span>Accessing Qdrant Cloud collection...</span>
          </div>
        )}

        {!loading && memories.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {isSearching ? 'No Matching Memories Found' : 'No Memories in Qdrant Yet'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              {isSearching
                ? 'Try a different keyword or question, or clear the search to view all memories.'
                : 'Connect your Omi wearable webhook or click "Simulate / Add Memory" above to store your first voice instruction.'}
            </p>
          </div>
        )}

        {!loading &&
          memories.map((mem) => (
            <div
              key={mem.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-base">{mem.title}</span>
                  {mem.category && (
                    <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                      {mem.category}
                    </span>
                  )}
                  {mem.score && (
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                      Match: {Math.round(mem.score * 100)}%
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {mem.timestamp ? new Date(mem.timestamp).toLocaleString() : 'Saved'}
                  </span>

                  <button
                    onClick={() => setDeleteCandidate(mem)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Delete memory record"
                    aria-label={`Delete memory ${mem.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Transcript Text */}
              <div className="text-sm text-slate-700 font-medium whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                {mem.text}
              </div>

              {/* Action Items if present */}
              {mem.action_items && mem.action_items.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs font-bold text-slate-500 mr-1">Action Items:</span>
                  {mem.action_items.map((item, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-[11px] text-slate-400 font-mono truncate pt-1 border-t border-slate-100">
                Point ID: {mem.id}
              </div>
            </div>
          ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Confirm Memory Deletion</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to permanently remove this memory from your Qdrant cluster?
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono">
              "{deleteCandidate.title}"
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white"
              >
                {deleting ? 'Deleting...' : 'Delete Memory'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Simulate Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">Add or Simulate Voice Memory</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setModalMode('simple')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  modalMode === 'simple' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Standard Memory Input
              </button>
              <button
                type="button"
                onClick={() => setModalMode('omi_webhook')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  modalMode === 'omi_webhook' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'
                }`}
              >
                Simulate Omi Webhook Payload
              </button>
            </div>

            <form onSubmit={handleCreateMemory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Title / Subject:
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Doctor Instructions, Grocery List, Meeting Notes"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Spoken Conversation / Transcript:
                </label>
                <textarea
                  rows={4}
                  required
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="e.g. Remember to take your heart medication with breakfast at 8:00 AM, and drink a full glass of water."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-sm text-slate-900"
                  >
                    <option value="health">Health & Medical</option>
                    <option value="daily_tasks">Daily Tasks & Routine</option>
                    <option value="work">Work & Projects</option>
                    <option value="shopping">Shopping & Errands</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Action Items (One per line):
                  </label>
                  <textarea
                    rows={2}
                    value={newActionItems}
                    onChange={(e) => setNewActionItems(e.target.value)}
                    placeholder="Take medication&#10;Drink glass of water"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newText.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-slate-300"
                >
                  <Send className="w-4 h-4" />
                  <span>{saving ? 'Embedding & Saving...' : 'Save to Qdrant'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
