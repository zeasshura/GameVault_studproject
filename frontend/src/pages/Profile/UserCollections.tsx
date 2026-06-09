import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, X, Library } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { Collection } from '../../types';

interface UserCollectionsProps {
  collections: Collection[];
  loadingCols: boolean;
  isOwnProfile: boolean;
  handleRemoveGame: (collectionId: number, gameId: number) => void;
}

const UserCollections: React.FC<UserCollectionsProps> = ({
  collections,
  loadingCols,
  isOwnProfile,
  handleRemoveGame,
}) => {
  return (
    <div className="animate-fade-in">
      {loadingCols ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : collections.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Library className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="mb-4">
            {isOwnProfile ? 'У вас пока нет коллекций' : 'У этого пользователя нет коллекций'}
          </p>
          {isOwnProfile && (
            <Link to="/games" className="btn-primary" id="browse-games-link">
              Перейти в каталог
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {collections.map((col) => (
            <div key={col.id} className="rounded-xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} id={`collection-${col.id}`}>
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{col.name}</h3>
                <span className="chip text-xs" style={{ background: 'var(--bg-card)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
                  {col.games.length} {col.games.length === 1 ? 'игра' : 'игр'}
                </span>
              </div>

              {col.games.length === 0 ? (
                <p className="text-gray-600 text-sm">Коллекция пуста</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-3">
                  {col.games.map((game) => (
                    <Link
                      key={game.id}
                      to={`/games/${game.id}`}
                      className="group"
                      id={`col-game-${game.id}`}
                    >
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden transition-all" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        {game.cover_url ? (
                          <img
                            src={game.cover_url}
                            alt={game.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🎮
                          </div>
                        )}
                        {isOwnProfile && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveGame(col.id, game.id);
                            }}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                            style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}
                            title="Удалить из коллекции"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
                        {game.title}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserCollections;
