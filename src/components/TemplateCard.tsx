'use client';
import type { Template } from '../lib/templates';

interface Props {
  template: Template;
  onSelect: (template: Template) => void;
  disabled: boolean;
}

export default function TemplateCard({ template, onSelect, disabled }: Props) {
  return (
    <div
      onClick={() => !disabled && onSelect(template)}
      className={`rounded-xl border border-zinc-200 overflow-hidden bg-white dark:bg-zinc-900 dark:border-zinc-800 transition-all ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-lg cursor-pointer hover:-translate-y-0.5'
      }`}
    >
      {/* Preview */}
      {template.type === 'chart' ? (
        /* Bar chart race preview */
        <div className="h-36 flex flex-col justify-center px-4 gap-1.5 bg-zinc-950">
          {[
            { w: '88%', label: '1' },
            { w: '74%', label: '2' },
            { w: '65%', label: '3' },
            { w: '54%', label: '4' },
            { w: '44%', label: '5' },
            { w: '35%', label: '6' },
          ].map((bar, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="text-[9px] text-zinc-500 w-3 text-right shrink-0">{bar.label}</div>
              <div
                className="h-2.5 rounded-sm shrink-0"
                style={{
                  width: bar.w,
                  backgroundColor: template.accentColor,
                  opacity: 1 - i * 0.12,
                }}
              />
            </div>
          ))}
        </div>
      ) : template.type === 'line-chart' ? (
        /* Line chart preview */
        <div className="h-36 flex items-center justify-center bg-zinc-950 px-4 py-3">
          <svg viewBox="0 0 220 80" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            {[20, 40, 60].map((y) => (
              <line key={y} x1="0" y1={y} x2="220" y2={y} stroke="#3f3f46" strokeWidth="0.5" />
            ))}
            {/* Line 1 */}
            <polyline
              points="0,60 40,45 80,30 120,38 160,15 200,22 220,18"
              fill="none"
              stroke={template.accentColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Line 2 */}
            <polyline
              points="0,70 40,62 80,55 120,58 160,42 200,50 220,44"
              fill="none"
              stroke={template.accentColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.5"
            />
            {/* Dots on line 1 */}
            {[[0,60],[80,30],[160,15],[220,18]].map(([x,y], i) => (
              <circle key={i} cx={x} cy={y} r="2.5" fill={template.accentColor} />
            ))}
          </svg>
        </div>
      ) : (
        /* Slide preview */
        <div className="h-36 flex overflow-hidden">
          {/* Left accent panel */}
          <div
            className="w-[42%] flex items-center justify-center relative flex-shrink-0"
            style={{ background: template.accentColor + '18' }}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{ background: template.accentColor }}
            />
            <svg
              className="w-8 h-8"
              style={{ color: template.accentColor, opacity: 0.4 }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>

          {/* Right content panel */}
          <div className="flex-1 bg-white dark:bg-zinc-900 flex flex-col justify-center px-4 gap-2.5">
            <div className="h-2 rounded-full bg-zinc-800 dark:bg-zinc-200" style={{ width: '82%' }} />
            <div className="h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" style={{ width: '72%' }} />
            <div className="h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" style={{ width: '60%' }} />
            <div className="h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" style={{ width: '68%' }} />
          </div>
        </div>
      )}

      {/* Card info */}
      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{template.name}</h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
            style={{ background: template.accentColor + '18', color: template.accentColor }}
          >
            {template.mood}
          </span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">{template.description}</p>
        <button
          onClick={(e) => { e.stopPropagation(); if (!disabled) onSelect(template); }}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-1.5 text-sm py-2 rounded-lg font-semibold transition-all text-white disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
          style={{ background: disabled ? '#9ca3af' : template.accentColor }}
        >
          Use Template
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
