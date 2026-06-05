import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  Upload,
  List,
  Import,
  Trash2,
  Pencil,
  Check,
  X,
  FileUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { gamesApi } from '../api/games';
import type { Game, Genre, Platform, GameFormData, RawgGame, ImportReport } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

type AdminTab = 'add' | 'rawg' | 'csv' | 'list';

const AdminPanel: React.FC = () => {
  const [tab, setTab] = useState<AdminTab>('add');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  useEffect(() => {
    document.title = 'Панель администратора — GameVault';
    const fetchMeta = async () => {
      try {
        const [g, p] = await Promise.all([gamesApi.getGenres(), gamesApi.getPlatforms()]);
        setGenres(g);
        setPlatforms(p);
      } catch {}
    };
    fetchMeta();
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="section-container">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-1">
            Панель администратора
          </h1>
          <p className="text-gray-500">Управление играми и контентом</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-8 glass rounded-2xl p-1.5 w-fit">
          {[
            { id: 'add' as AdminTab, label: 'Добавить игру', icon: <Plus className="w-4 h-4" /> },
            { id: 'rawg' as AdminTab, label: 'Импорт RAWG', icon: <Import className="w-4 h-4" /> },
            { id: 'csv' as AdminTab, label: 'Загрузить CSV', icon: <FileUp className="w-4 h-4" /> },
            { id: 'list' as AdminTab, label: 'Список игр', icon: <List className="w-4 h-4" /> },
          ].map((t) => (
            <button
              key={t.id}
              id={`admin-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${tab === t.id
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                  : 'text-gray-400 hover:text-gray-200'
                }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {tab === 'add' && <AddGameTab genres={genres} platforms={platforms} />}
          {tab === 'rawg' && <RawgImportTab />}
          {tab === 'csv' && <CsvUploadTab />}
          {tab === 'list' && <GameListTab genres={genres} platforms={platforms} />}
        </div>
      </div>
    </div>
  );
};

// ── Add Game Tab ──────────────────────────────────────────────
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

        {/* Genres */}
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

        {/* Platforms */}
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

// ── RAWG Import Tab ───────────────────────────────────────────
const RawgImportTab: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RawgGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);
  const [importedIds, setImportedIds] = useState<number[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const data = await gamesApi.searchRawg(query);
      setResults(data);
      if (data.length === 0) setError('Ничего не найдено');
    } catch {
      setError('Ошибка при поиске');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (rawgId: number) => {
    setImporting(rawgId);
    try {
      await gamesApi.importRawg(rawgId);
      setImportedIds((prev) => [...prev, rawgId]);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Ошибка при импорте');
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="glass rounded-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Import className="w-5 h-5 text-primary-400" />
          Импорт из RAWG
        </h2>

        <form onSubmit={handleSearch} className="flex gap-3 mb-6" id="rawg-search-form">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              id="rawg-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Название игры в RAWG..."
              className="input-field pl-11"
            />
          </div>
          <button
            type="submit"
            id="rawg-search-btn"
            disabled={loading || !query.trim()}
            className="btn-primary disabled:opacity-60"
          >
            {loading ? <LoadingSpinner size="sm" /> : <Search className="w-4 h-4" />}
            Найти
          </button>
        </form>

        {error && (
          <div className="text-amber-400 text-sm mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="flex flex-col gap-3">
            {results.map((game) => {
              const isImported = importedIds.includes(game.rawg_id);
              const isImporting = importing === game.rawg_id;
              return (
                <div
                  key={game.rawg_id}
                  id={`rawg-result-${game.rawg_id}`}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-primary-500/30 transition-all"
                >
                  {game.cover_url && (
                    <img
                      src={game.cover_url}
                      alt={game.title}
                      className="w-16 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{game.title}</p>
                    <p className="text-xs text-gray-500">
                      {game.release_date ?? 'Дата неизвестна'} • ⭐ {game.avg_rating.toFixed(1)}
                    </p>
                  </div>
                  <button
                    id={`import-rawg-${game.rawg_id}`}
                    onClick={() => handleImport(game.rawg_id)}
                    disabled={isImported || isImporting}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${isImported
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                        : 'btn-primary py-2'
                      }`}
                  >
                    {isImporting ? (
                      <LoadingSpinner size="sm" />
                    ) : isImported ? (
                      <><Check className="w-4 h-4" /> Добавлено</>
                    ) : (
                      <><Plus className="w-4 h-4" /> Импорт</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ── CSV Upload Tab ────────────────────────────────────────────
const CsvUploadTab: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setReport(null);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const result = await gamesApi.uploadCsv(formData);
      setReport(result);
    } catch {
      setError('Ошибка при загрузке файла');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="glass rounded-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary-400" />
          Загрузка CSV / XML
        </h2>

        <form onSubmit={handleUpload} className="space-y-5" id="csv-upload-form">
          <div>
            <label htmlFor="csv-file-input" className="block text-sm font-medium text-gray-300 mb-3">
              Выберите файл
            </label>
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                file
                  ? 'border-primary-500/50 bg-primary-500/5'
                  : 'border-white/10 hover:border-primary-500/30'
              }`}
            >
              <input
                id="csv-file-input"
                type="file"
                accept=".csv,.xml"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <label htmlFor="csv-file-input" className="cursor-pointer">
                <FileUp className={`w-10 h-10 mx-auto mb-3 ${file ? 'text-primary-400' : 'text-gray-600'}`} />
                {file ? (
                  <>
                    <p className="text-primary-300 font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 font-medium">Перетащите файл или нажмите</p>
                    <p className="text-xs text-gray-600 mt-1">CSV или XML, до 10 MB</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            id="csv-upload-btn"
            disabled={!file || loading}
            className="btn-primary w-full disabled:opacity-60"
          >
            {loading ? <LoadingSpinner size="sm" /> : <Upload className="w-4 h-4" />}
            Загрузить
          </button>
        </form>

        {/* Report */}
        {report && (
          <div className="mt-6 p-5 bg-dark-50/50 rounded-xl border border-white/10 animate-fade-in">
            <h3 className="font-semibold text-white mb-3">Отчёт об импорте</h3>
            <div className="flex gap-4 mb-3">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="font-bold">{report.success_count}</span>
                <span className="text-sm">успешно</span>
              </div>
              {report.error_count > 0 && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-bold">{report.error_count}</span>
                  <span className="text-sm">с ошибками</span>
                </div>
              )}
            </div>
            {report.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-2">Ошибки:</p>
                <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                  {report.errors.map((err, i) => (
                    <li key={i} className="text-xs text-red-400 bg-red-500/5 rounded px-2 py-1">
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Game List Tab ─────────────────────────────────────────────
interface GameListTabProps {
  genres: Genre[];
  platforms: Platform[];
}

const GameListTab: React.FC<GameListTabProps> = ({ genres, platforms }) => {
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

          {/* Pagination controls */}
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

      {/* Edit Modal */}
      {editingGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingGame(null)} />
          <div className="relative glass rounded-3xl w-full max-w-lg animate-slide-up shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
            {/* Header — всегда виден */}
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

            {/* Scrollable content */}
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

            {/* Footer с кнопками — всегда виден */}
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

export default AdminPanel;
