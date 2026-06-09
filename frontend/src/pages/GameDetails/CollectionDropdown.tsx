import React, { useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { collectionsApi } from '../../api/collections';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { Game, Collection } from '../../types';

const COLLECTION_NAMES = ['Играю', 'Прошёл', 'Хочу сыграть', 'Брошено'];

interface CollectionDropdownProps {
  game: Game;
  collections: Collection[];
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
}

const CollectionDropdown: React.FC<CollectionDropdownProps> = ({ game, collections, setCollections }) => {
  const [collectionDropdown, setCollectionDropdown] = useState(false);
  const [addingToCollection, setAddingToCollection] = useState(false);
  const [collectionMsg, setCollectionMsg] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');

  const handleAddToCollection = async (collectionId: number, name: string) => {
    setAddingToCollection(true); setCollectionDropdown(false);
    try {
      await collectionsApi.addGameToCollection(collectionId, game.id);
      setCollectionMsg(`Добавлено в «${name}»`);
    } catch { setCollectionMsg('Ошибка при добавлении'); }
    finally { setAddingToCollection(false); setTimeout(() => setCollectionMsg(''), 3000); }
  };

  const createAndAddToCollection = async (name: string) => {
    setAddingToCollection(true); setCollectionDropdown(false);
    try {
      const col = await collectionsApi.createCollection(name);
      await collectionsApi.addGameToCollection(col.id, game.id);
      setCollections(prev => [...prev, col]);
      setCollectionMsg(`Добавлено в «${name}»`);
    } catch { setCollectionMsg('Ошибка'); }
    finally { setAddingToCollection(false); setTimeout(() => setCollectionMsg(''), 3000); }
  };

  return (
    <>
      <div className="relative inline-block">
        <button
          id="add-to-collection-btn"
          onClick={() => setCollectionDropdown(p => !p)}
          disabled={addingToCollection}
          className="btn-primary"
        >
          {addingToCollection ? <LoadingSpinner size="sm" /> : <Plus className="w-4 h-4" />}
          В коллекцию
          <ChevronDown className={`w-4 h-4 transition-transform ${collectionDropdown ? 'rotate-180' : ''}`} />
        </button>

        {collectionDropdown && (
          <div
            className="absolute top-full left-0 mt-1 w-52 rounded-xl overflow-hidden z-50 animate-fade-in"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {collections.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                  Мои коллекции
                </div>
                {collections.map((col) => (
                  <button
                    key={col.id}
                    id={`add-to-collection-${col.id}`}
                    onClick={() => handleAddToCollection(col.id, col.name)}
                    className="w-full text-left px-4 py-2 text-sm transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    {col.name}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid var(--border)' }} />
              </>
            )}
            <div className="px-3 py-1.5 text-xs uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
              Создать коллекцию
            </div>
            {COLLECTION_NAMES.map((name) => (
              <button
                key={name}
                id={`create-collection-${name}`}
                onClick={() => createAndAddToCollection(name)}
                className="w-full text-left px-4 py-2 text-sm transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                + {name}
              </button>
            ))}
            <div className="p-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Своя коллекция..."
                  className="w-full text-sm px-2 py-1.5 rounded outline-none"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCollectionName.trim()) {
                      createAndAddToCollection(newCollectionName.trim());
                      setNewCollectionName('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (newCollectionName.trim()) {
                      createAndAddToCollection(newCollectionName.trim());
                      setNewCollectionName('');
                    }
                  }}
                  className="px-2 rounded flex items-center justify-center transition-colors"
                  style={{ background: 'var(--accent)', color: 'black' }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {collectionMsg && (
        <p className="mt-2 text-sm animate-fade-in" style={{ color: 'var(--accent)' }}>{collectionMsg}</p>
      )}
    </>
  );
};

export default CollectionDropdown;
