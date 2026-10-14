import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Volume2,
  VolumeX,
  CheckSquare,
  Square,
  Clock,
  Layers,
  AlertCircle,
  HelpCircle,
  Mic,
  MicOff,
  Copy,
  Check,
  Send,
} from 'lucide-react';
import { askQuestion } from '../api';

export default function AskFlowable({ initialPrompt = '', onAskSuccess }) {
  const [question, setQuestion] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checklistState, setChecklistState] = useState({});
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (initialPrompt) {
      setQuestion(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanQ = question.trim();
    if (!cleanQ) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setChecklistState({});
    if (isSpeaking && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      const data = await askQuestion(cleanQ);
      setResult(data);
      if (onAskSuccess) onAskSuccess();
    } catch (err) {
      setError(err.message || 'Failed to get answer from FlowAble');
    } finally {
      setLoading(false);
    }
  };

  // Text-To-Speech for cognitive & visual accessibility
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      if (!result?.answer) return;
      const utterance = new SpeechSynthesisUtterance(result.answer);
      utterance.rate = 0.95; // Slightly slower, easy to understand
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Browser speech recognition for voice asking
  const handleToggleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. You can type your question above.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuestion(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const toggleChecklistItem = (idx) => {
    setChecklistState((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleCopyAnswer = () => {
    if (!result?.answer) return;
    navigator.clipboard.writeText(result.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title & Introduction */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Ask FlowAble
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-1">
          Ask about your past spoken instructions, conversations, or tasks. FlowAble retrieves
          factual memories from Qdrant and grounds reasoning with Lyzr Agent Studio.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <label htmlFor="question-input" className="block text-sm font-bold text-slate-800 mb-2">
          Your Question or Memory Request:
        </label>
        
        <div className="relative">
          <textarea
            id="question-input"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What did the doctor tell me to bring to the appointment? Where are my glasses? What were my project steps?"
            className="w-full rounded-xl border border-slate-300 p-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition resize-none"
            disabled={loading}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={handleToggleVoiceInput}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
              isListening
                ? 'bg-red-100 text-red-700 border border-red-300 animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Speak your question using microphone"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-600" />}
            <span>{isListening ? 'Listening...' : 'Voice Input'}</span>
          </button>

          {/* Ask Button */}
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-md shadow-emerald-600/20 disabled:shadow-none"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Retrieving & Reasoning...</span>
              </>
            ) : (
              <>
                <span>Ask FlowAble</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold">Error: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg" />
            <div className="h-5 bg-slate-200 rounded w-1/3" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-5/6" />
            <div className="h-4 bg-slate-100 rounded w-4/6" />
          </div>
          <div className="h-10 bg-slate-50 rounded-xl w-1/4 mt-4" />
        </div>
      )}

      {/* Answer & Result Panel */}
      {result && (
        <div aria-live="polite" className="space-y-6">
          {/* Main Answer Card */}
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 sm:p-8 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">
                    FlowAble Assistant Answer
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">
                    Grounded with Lyzr Agent Studio & Qdrant Cloud
                  </span>
                </div>
              </div>

              {/* Action Buttons: Text to Speech & Copy */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleSpeech}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isSpeaking
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  aria-label={isSpeaking ? 'Stop reading aloud' : 'Read answer aloud'}
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4 text-amber-700" /> : <Volume2 className="w-4 h-4 text-emerald-700" />}
                  <span>{isSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
                </button>

                <button
                  onClick={handleCopyAnswer}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  aria-label="Copy answer to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Answer Text */}
            <div className="text-slate-800 text-base sm:text-lg leading-relaxed whitespace-pre-line font-medium mb-6">
              {result.answer}
            </div>

            {/* Interactive Step-by-Step Checklist for Cognitive Assistance */}
            {result.action_steps && result.action_steps.length > 0 && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5 mb-6">
                <h3 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-700" />
                  <span>Adaptive Action Checklist (Click to Mark Done):</span>
                </h3>
                <div className="space-y-2">
                  {result.action_steps.map((step, idx) => {
                    const isChecked = Boolean(checklistState[idx]);
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleChecklistItem(idx)}
                        className={`w-full text-left p-3 rounded-lg border transition flex items-start gap-3 ${
                          isChecked
                            ? 'bg-emerald-100/60 border-emerald-300 text-emerald-950 line-through opacity-75'
                            : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-800 shadow-sm'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                        )}
                        <span className="text-sm font-medium">{step}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Warning note if unconfigured */}
            {result.warning && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3.5 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Notice: {result.warning}. Configure API keys in .env for full inference.</span>
              </div>
            )}
          </div>

          {/* Retrieved Memory Evidence / Sources Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Retrieved Memory Sources ({result.retrieved_memories?.length || 0})</span>
              </h3>
              <span className="text-xs text-slate-500">
                Retrieved from Qdrant Cloud via 384-dim semantic search
              </span>
            </div>

            {result.retrieved_memories && result.retrieved_memories.length > 0 ? (
              <div className="space-y-3">
                {result.retrieved_memories.map((mem, i) => (
                  <div
                    key={mem.id || i}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-sm text-slate-800">
                        {mem.title || `Memory #${i + 1}`}
                      </span>
                      <div className="flex items-center gap-2 text-xs">
                        {mem.score && (
                          <span className="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                            Similarity: {Math.round(mem.score * 100)}%
                          </span>
                        )}
                        {mem.timestamp && (
                          <span className="text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(mem.timestamp).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed font-mono bg-white p-3 rounded-lg border border-slate-100">
                      {mem.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>No matching past memories were found in Qdrant for this specific question.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
