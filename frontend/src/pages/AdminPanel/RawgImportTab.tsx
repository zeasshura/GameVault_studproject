import React, { useState } from 'react';
import { Search, Import, Check, Plus, AlertCircle } from 'lucide-react';
import { gamesApi } from '../../api/games';
import type { RawgGame } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

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

export default RawgImportTab;
