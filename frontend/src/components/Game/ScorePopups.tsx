import React, { useState, useEffect, useRef } from 'react';
import { scorePopupEvents } from '../../utils/scorePopupEvents';
import type { PopupEvent } from '../../utils/scorePopupEvents';

interface Popup extends PopupEvent {
  id: number;
  xOffset: number;
  yBase: number;
}

let _id = 0;

export const ScorePopups: React.FC = () => {
  const [popups, setPopups] = useState<Popup[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    return scorePopupEvents.subscribe(e => {
      const id = _id++;
      const xOffset = (Math.random() - 0.5) * 60; // ±30px
      const yBase = 30 + Math.random() * 15;       // 30–45% from top
      setPopups(p => [...p, { id, xOffset, yBase, ...e }]);
      const t = setTimeout(() => setPopups(p => p.filter(x => x.id !== id)), 1100);
      timers.current.set(id, t);
    });
  }, []);

  // Cleanup timers on unmount
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  return (
    <>
      <style>{`
        @keyframes scoreFloat {
          0%   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          15%  { opacity: 1; transform: translateX(-50%) translateY(-12px) scale(1.15); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-75px) scale(0.85); }
        }
      `}</style>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {popups.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              top: `${p.yBase}%`,
              left: `calc(50% + ${p.xOffset}px)`,
              color: p.color,
              fontWeight: 900,
              fontFamily: 'monospace',
              fontSize: p.big ? '2rem' : '1.3rem',
              textShadow: `0 0 12px ${p.color}, 0 2px 4px rgba(0,0,0,0.8)`,
              animation: 'scoreFloat 1.1s ease-out forwards',
              whiteSpace: 'nowrap',
              letterSpacing: '0.05em',
            }}
          >
            {p.text}
          </div>
        ))}
      </div>
    </>
  );
};
