import React from 'react';
import { BookOpen } from 'lucide-react';

interface GameAboutProps {
  description: string | null;
}

const GameAbout: React.FC<GameAboutProps> = ({ description }) => {
  if (!description) return null;

  return (
    <section className="section-container mt-8 mb-8">
      <div
        className="rounded-xl p-6"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <BookOpen className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          Описание
        </h2>
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      </div>
    </section>
  );
};

export default GameAbout;
