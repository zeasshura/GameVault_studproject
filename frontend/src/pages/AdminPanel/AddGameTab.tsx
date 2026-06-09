import React, { useState } from 'react';
import { Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { gamesApi } from '../../api/games';
import type { Genre, Platform, GameFormData } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

interface AddGameTabProps {
  genres: Genre[];
  platforms: Platform[];
}

const AddGameTab: React.FC<AddGameTabProps> = ({ genres, platforms }) => {
  const [form, setForm] = useState<GameFormData>({
    title: '',
    description: '',
    release_date: '',
    cover_url: '',
    genres: [],
    platforms: [],
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Укажите название игры');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const created = await gamesApi.createGame(form);
      setSuccess(`Игра «${created.title}» успешно добавлена!`);
      setForm({ title: '', description: '', release_date: '', cover_url: '', genres: [], platforms: [] });
    } catch {
      setError('Не удалось добавить игру');
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (id: number) =>
    setForm((f) => ({ ...f, genres: f.genres.includes(id) ? f.genres.filter((g) => g !== id) : [...f.genres, id] }));

  const togglePlatform = (id: number) =>
    setForm((f) => ({ ...f, platforms: f.platforms.includes(id) ? f.platforms.filter((p) => p !== id) : [...f.platforms, id] }));

  return (
    <div className="glass rounded-2xl p-8 max-w-2xl">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Plus className="w-5 h-5 text-primary-400" />
        Добавить игру
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5" id="add-game-form">
        <div>
          <label htmlFor="game-title" className="block text-sm font-medium text-gray-300 mb-2">
            Название *
          </label>
          <input
            id="game-title"
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="input-field"
            placeholder="Название игры"
            required
          />
        </div>

        <div>
          <label htmlFor="game-description" className="block text-sm font-medium text-gray-300 mb-2">
            Описание
          </label>
          <textarea
            id="game-description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={4}
            className="input-field resize-none"
            placeholder="Описание игры..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="game-release-date" className="block text-sm font-medium text-gray-300 mb-2">
              Дата выхода
            </label>
            <input
              id="game-release-date"
              type="date"
              value={form.release_date}
              onChange={(e) => setForm((f) => ({ ...f, release_date: e.target.value }))}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="game-cover-url" className="block text-sm font-medium text-gray-300 mb-2">
              URL обложки
            </label>
            <input
              id="game-cover-url"
              type="url"
              value={form.cover_url}
              onChange={(e) => setForm((f) => ({ ...f, cover_url: e.target.value }))}
              className="input-field"
              placeholder="https://..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Жанры</label>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <button
                key={g.id}
                type="button"
                id={`admin-genre-${g.id}`}
                onClick={() => toggleGenre(g.id)}
                className={`chip text-xs transition-all ${
                  form.genres.includes(g.id)
                    ? 'bg-primary-500/40 text-primary-200 border border-primary-400'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-primary-500/20'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Платформы</label>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => (
              <button
                key={p.id}
                type="button"
                id={`admin-platform-${p.id}`}
                onClick={() => togglePlatform(p.id)}
                className={`chip text-xs transition-all ${
                  form.platforms.includes(p.id)
                    ? 'bg-accent-500/40 text-accent-200 border border-accent-400'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-accent-500/20'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {success && (
          <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 animate-fade-in">
            <CheckCircle className="w-4 h-4" />
            {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          type="submit"
          id="add-game-submit"
          disabled={loading}
          className="btn-primary disabled:opacity-60"
        >
          {loading ? <LoadingSpinner size="sm" /> : <Plus className="w-4 h-4" />}
          Добавить игру
        </button>
      </form>
    </div>
  );
};

export default AddGameTab;
