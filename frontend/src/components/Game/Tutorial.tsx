import React, { useState, useEffect } from 'react';

const TUTORIAL_KEY = 'mars_tutorial_v1';

interface TutorialProps {
  onDismiss: () => void;
}

const steps = [
  { icon: '←→', label: 'Arrow Keys / Swipe', desc: 'Change lanes' },
  { icon: '↑',  label: 'Up / Space / Swipe Up', desc: 'Jump over obstacles' },
  { icon: '↓',  label: 'Down / Swipe Down', desc: 'Roll under barriers' },
  { icon: '🛡️',  label: 'Shield',    desc: 'Survive one collision' },
  { icon: '🧲',  label: 'Magnet',    desc: 'Auto-collect nearby coins' },
  { icon: '⚡',  label: 'Invincible', desc: 'Phase through everything' },
  { icon: '⭐',  label: 'Star',      desc: 'Worth 5 coins!' },
];

export const Tutorial: React.FC<TutorialProps> = ({ onDismiss }) => {
  const [step, setStep] = useState(0);

  // Auto-advance every 2.5 s
  useEffect(() => {
    const t = setTimeout(() => {
      if (step < steps.length - 1) setStep(s => s + 1);
      else handleDone();
    }, 2500);
    return () => clearTimeout(t);
  }, [step]);

  const handleDone = () => {
    try { localStorage.setItem(TUTORIAL_KEY, '1'); } catch { /* ignore */ }
    onDismiss();
  };

  const cur = steps[step];

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto"
      onClick={() => {
        if (step < steps.length - 1) setStep(s => s + 1);
        else handleDone();
      }}
    >
      <div className="bg-slate-800 rounded-3xl p-8 mx-6 max-w-sm w-full border border-cyan-500/40 shadow-2xl text-center">
        <p className="text-cyan-400 text-xs font-bold tracking-widest mb-6 uppercase">
          HOW TO PLAY
        </p>

        {/* Icon */}
        <div className="text-6xl mb-4 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)] select-none">
          {cur.icon}
        </div>

        <h3 className="text-white font-black text-xl mb-1">{cur.label}</h3>
        <p className="text-slate-300 text-sm mb-6">{cur.desc}</p>

        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? 'bg-cyan-400 w-4' : 'bg-slate-600'
              }`}
            />
          ))}
        </div>

        <p className="text-slate-500 text-xs">Tap to continue</p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); handleDone(); }}
        className="mt-6 text-slate-400 hover:text-white text-sm underline transition-colors"
      >
        Skip tutorial
      </button>
    </div>
  );
};

export const shouldShowTutorial = (): boolean => {
  try { return !localStorage.getItem(TUTORIAL_KEY); } catch { return false; }
};
