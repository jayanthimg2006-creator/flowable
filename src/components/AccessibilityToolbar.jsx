import React, { useState, useEffect } from 'react';
import { Type, Eye, Volume2, Check } from 'lucide-react';

export default function AccessibilityToolbar() {
  const [textSize, setTextSize] = useState('normal'); // 'normal', 'large', 'xlarge'
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('text-normal', 'text-large', 'text-xlarge');
    html.classList.add(`text-${textSize}`);
  }, [textSize]);

  useEffect(() => {
    const html = document.documentElement;
    if (highContrast) {
      html.classList.add('high-contrast');
    } else {
      html.classList.remove('high-contrast');
    }
  }, [highContrast]);

  return (
    <aside
      aria-label="Accessibility options"
      className="bg-slate-900 text-white px-4 py-2 text-xs md:text-sm border-b border-slate-800 flex flex-wrap items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2 text-slate-300">
        <span className="font-semibold text-emerald-400">Adaptive Mode:</span>
        <span>Cognitive & Visual Accessibility Enabled</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Text Size Scale */}
        <div className="flex items-center gap-1.5" role="group" aria-label="Font size controls">
          <Type className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-slate-400 mr-1">Font:</span>
          <button
            onClick={() => setTextSize('normal')}
            className={`px-2 py-0.5 rounded font-medium transition ${
              textSize === 'normal'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            aria-pressed={textSize === 'normal'}
            aria-label="Normal text size"
          >
            Normal
          </button>
          <button
            onClick={() => setTextSize('large')}
            className={`px-2 py-0.5 rounded font-medium transition text-base ${
              textSize === 'large'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            aria-pressed={textSize === 'large'}
            aria-label="Large text size"
          >
            Large
          </button>
          <button
            onClick={() => setTextSize('xlarge')}
            className={`px-2 py-0.5 rounded font-medium transition text-lg ${
              textSize === 'xlarge'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            aria-pressed={textSize === 'xlarge'}
            aria-label="Extra large text size"
          >
            XL
          </button>
        </div>

        {/* High Contrast Toggle */}
        <button
          onClick={() => setHighContrast(!highContrast)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition font-medium ${
            highContrast
              ? 'bg-amber-400 text-slate-950 font-bold'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          aria-pressed={highContrast}
          aria-label="Toggle high contrast display mode"
        >
          <Eye className="w-4 h-4" aria-hidden="true" />
          <span>High Contrast</span>
          {highContrast && <Check className="w-3.5 h-3.5 ml-0.5" />}
        </button>
      </div>
    </aside>
  );
}
