"use client";

import { LEVELS } from "@/lib/xp";

export default function LevelUpModal({ level, onClose }: { level: number; onClose: () => void }) {
  const l = LEVELS.find((x) => x.level === level) ?? LEVELS[0];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="absolute text-2xl animate-confetti-fall"
            style={{
              right: `${(i * 7) % 100}%`,
              top: `-10vh`,
              animationDelay: `${i * 0.05}s`,
            }}
          >
            {["🎉", "✨", "⭐", "🏆"][i % 4]}
          </span>
        ))}
      </div>
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm mx-4">
        <div className="text-7xl mb-3">{l.icon}</div>
        <div className="text-3xl font-bold text-primary mb-1">עלית רמה!</div>
        <div className="text-xl text-accent font-semibold mb-4">{l.name}</div>
        <button
          onClick={onClose}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-light"
        >
          המשך
        </button>
      </div>
    </div>
  );
}
