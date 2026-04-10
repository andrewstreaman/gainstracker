import { useState } from 'react';
import { Link } from 'react-router-dom';

function AccordionItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        <span className="font-medium text-gray-200">{title}</span>
        <span className="text-gray-400 text-xl leading-none">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-5 py-4 bg-gray-800/60 border-t border-gray-700 text-sm text-gray-400">
          {children}
        </div>
      )}
    </div>
  );
}

const FEATURES = [
  { icon: '⚖️', label: 'Weight Tracking' },
  { icon: '🏋️', label: 'Exercise Logs' },
  { icon: '🥗', label: 'Nutrition' },
  { icon: '📈', label: 'Progress Charts' },
  { icon: '🎯', label: 'Smart Goals' },
  { icon: '🏆', label: 'Challenges' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-20 h-20 rounded-2xl bg-brand-600 flex items-center justify-center mb-6 shadow-lg shadow-brand-900/50">
          <svg viewBox="0 0 512 512" className="w-12 h-12">
            <rect x="42" y="210" width="44" height="92" rx="14" fill="white"/>
            <rect x="98" y="188" width="52" height="136" rx="14" fill="white"/>
            <rect x="150" y="236" width="212" height="40" rx="10" fill="white"/>
            <rect x="362" y="188" width="52" height="136" rx="14" fill="white"/>
            <rect x="426" y="210" width="44" height="92" rx="14" fill="white"/>
          </svg>
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-4 tracking-tight">
          Gains<span className="text-brand-400">Tracker</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-sm mb-10 leading-relaxed">
          Log your weight, exercise, and nutrition. Track your progress. Compete with friends. Hit your goals.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mb-12">
          <Link
            to="/register"
            className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl py-3.5 text-center transition-colors shadow-lg shadow-brand-900/40"
          >
            Get Started Free
          </Link>
          <Link
            to="/login"
            className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 font-bold rounded-xl py-3.5 text-center transition-colors"
          >
            Sign In
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
          {FEATURES.map(({ icon, label }) => (
            <div key={label} className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <p className="text-xs text-gray-400 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Install instructions */}
      <div className="px-6 pb-12 w-full max-w-lg mx-auto">
        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold text-center mb-4">
          Install on your phone
        </p>
        <div className="space-y-2">
          <AccordionItem title="📱 iPhone / iPad (iOS)">
            <ol className="list-decimal list-inside space-y-2.5">
              <li>Open this page in <strong className="text-gray-200">Safari</strong> (not Chrome)</li>
              <li>
                Tap the <strong className="text-gray-200">Share</strong> button{' '}
                <span className="inline-block bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded">
                  ⎋
                </span>{' '}
                at the bottom of the screen
              </li>
              <li>Scroll down and tap <strong className="text-gray-200">Add to Home Screen</strong></li>
              <li>Tap <strong className="text-gray-200">Add</strong> in the top-right corner</li>
            </ol>
            <p className="mt-3 text-gray-500 text-xs">
              The app will appear on your home screen and open full-screen like a native app.
            </p>
          </AccordionItem>

          <AccordionItem title="🤖 Android (Chrome)">
            <ol className="list-decimal list-inside space-y-2.5">
              <li>Open this page in <strong className="text-gray-200">Chrome</strong></li>
              <li>
                Tap the <strong className="text-gray-200">three-dot menu</strong>{' '}
                <span className="inline-block bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded font-mono">
                  ⋮
                </span>{' '}
                in the top-right corner
              </li>
              <li>
                Tap <strong className="text-gray-200">Add to Home Screen</strong> or{' '}
                <strong className="text-gray-200">Install app</strong>
              </li>
              <li>Tap <strong className="text-gray-200">Add</strong> or <strong className="text-gray-200">Install</strong></li>
            </ol>
            <p className="mt-3 text-gray-500 text-xs">
              Chrome may also show an install banner automatically at the bottom of the screen.
            </p>
          </AccordionItem>
        </div>
      </div>
    </div>
  );
}
