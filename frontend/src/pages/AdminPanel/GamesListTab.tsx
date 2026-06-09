import React, { useEffect, useState, useCallback } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { gamesApi } from '../../api/games';
import type { Game, Genre, Platform, GameFormData } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

interface GamesListTabProps {
  genres: Genre[];
  platforms: Platform[];
}

const GamesListTab: React.FC<GamesListTabProps> = ({ genres, platforms }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editForm, setEditForm] = useState<Partial<GameFormData>>({});
  const [saving, setSaving] = useState(false);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const data = await gamesApi.getGames({ page, ordering: '-id' });
      setGames(data.results);
      setTotal(data.count);
    } catch {
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Удалить игру «${title}»?`)) return;
    try {
      await gamesApi.deleteGame(id);
      fetchGames();
    } catch {}
  };

  const handleEdit = (game: Game) => {
    setEditingGame(game);
    setEditForm({
      title: game.title,
      description: game.description,
      release_date: game.release_date ?? '',
      cover_url: game.cover_url ?? '',
      genres: game.genres.map((g) => g.id),
      platforms: game.platforms.map((p) => p.id),
    });
  };

  const handleSave = async () => {
    if (!editingGame) return;
    setSaving(true);
    try {
      await gamesApi.updateGame(editingGame.id, editForm as GameFormData);
      setEditingGame(null);
      fetchGames();
    } catch {} finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">
        Игры ({total})
      </h2>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" id="admin-games-table">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-4 text-gray-400 font-semibold">Обложка</th>
                    <th className="text-left px-6 py-4 text-gray-400 font-semibold">Название</th>
                    <th className="text-left px-6 py-4 text-gray-400 font-semibold hidden md:table-cell">Жанры</th>
                    <th className="text-left px-6 py-4 text-gray-400 font-semibold hidden lg:table-cell">Рейтинг</th>
                    <th className="text-right px-6 py-4 text-gray-400 font-semibold">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => (
                    <tr
                      key={game.id}
                      id={`admin-game-row-${game.id}`}
                      className="border-b border-white/5 hover:bg-white/3 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <div className="w-10 h-14 rounded-lg overflow-hidden bg-dark-100">
                          {game.cover_url ? (
                            <img src={game.cover_url} alt={game.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">🎮</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <p className="font-medium text-white truncate max-w-[200px]">{game.title}</p>
                        <p className="text-xs text-gray-500">{game.release_date ?? '—'}</p>
                      </td>
                      <td className="px-6 py-3 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {game.genres.slice(0, 2).map((g) => (
                            <span key={g.id} className="chip-primary text-[10px] py-0.5">{g.name}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-3 hidden lg:table-cell">
                        <span className="text-yellow-400 font-bold">
                          {game.avg_rating > 0 ? game.avg_rating.toFixed(1) : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            id={`edit-game-${game.id}`}
                            onClick={() => handleEdit(game)}
                            className="p-2 rounded-lg text-gray-400 hover:text-primary-300 hover:bg-primary-500/10 transition-colors"
                            aria-label="Редактировать"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            id={`delete-game-${game.id}`}
                            onClick={() => handleDelete(game.id, game.title)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            aria-label="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {total > 20 && (
            <div className="flex gap-2 justify-center">
              <button
                id="admin-list-prev"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
              >
                ← Назад
              </button>
              <span className="px-4 py-2 text-sm text-gray-400">
                Стр. {page} / {Math.ceil(total / 20)}
              </span>
              <button
                id="admin-list-next"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / 20)}
                className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
              >
                Далее →
              </button>
            </div>
          )}
        </>
      )}

      {editingGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingGame(null)} />
          <div className="relative glass rounded-3xl w-full max-w-lg animate-slide-up shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
            <div className="flex items-center justify-between p-8 pb-4 flex-shrink-0">
              <h3 className="text-lg font-bold text-white">Редактировать игру</h3>
              <button
                id="close-edit-modal"
                onClick={() => setEditingGame(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-8 pb-2 flex-1 space-y-4">
              <div>
                <label htmlFor="edit-title" className="block text-sm text-gray-400 mb-2">Название</label>
                <input
                  id="edit-title"
                  type="text"
                  value={editForm.title ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="edit-desc" className="block text-sm text-gray-400 mb-2">Описание</label>
                <textarea
                  id="edit-desc"
                  value={editForm.description ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-date" className="block text-sm text-gray-400 mb-2">Дата выхода</label>
                  <input
                    id="edit-date"
                    type="date"
                    value={editForm.release_date ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, release_date: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="edit-cover" className="block text-sm text-gray-400 mb-2">URL обложки</label>
                  <input
                    id="edit-cover"
                    type="url"
                    value={editForm.cover_url ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, cover_url: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Жанры</label>
                <div className="flex flex-wrap gap-2">
                  {genres.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      id={`edit-genre-${g.id}`}
                      onClick={() =>
                        setEditForm((f) => ({
                          ...f,
                          genres: f.genres?.includes(g.id)
                            ? f.genres.filter((x) => x !== g.id)
                            : [...(f.genres ?? []), g.id],
                        }))
                      }
                      className={`chip text-xs transition-all ${
                        editForm.genres?.includes(g.id)
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
                <label className="block text-sm text-gray-400 mb-2">Платформы</label>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      id={`edit-platform-${p.id}`}
                      onClick={() =>
                        setEditForm((f) => ({
                          ...f,
                          platforms: f.platforms?.includes(p.id)
                            ? f.platforms.filter((x) => x !== p.id)
                            : [...(f.platforms ?? []), p.id],
                        }))
                      }
                      className={`chip text-xs transition-all ${
                        editForm.platforms?.includes(p.id)
                          ? 'bg-accent-500/40 text-accent-200 border border-accent-400'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-accent-500/20'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-8 pt-4 flex-shrink-0">
              <button
                id="save-edit-game-btn"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1 disabled:opacity-60"
              >
                {saving ? <LoadingSpinner size="sm" /> : <Check className="w-4 h-4" />}
                Сохранить
              </button>
              <button
                onClick={() => setEditingGame(null)}
                className="btn-secondary"
                id="cancel-edit-game-btn"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesListTab;
