import React, { useEffect, useState } from 'react';
import { Plus, Import, FileUp, List } from 'lucide-react';
import { gamesApi } from '../api/games';
import type { Genre, Platform } from '../types';

import AddGameTab from './AdminPanel/AddGameTab';
import RawgImportTab from './AdminPanel/RawgImportTab';
import CsvUploadTab from './AdminPanel/CsvUploadTab';
import GamesListTab from './AdminPanel/GamesListTab';

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

        <div className="animate-fade-in">
          {tab === 'add' && <AddGameTab genres={genres} platforms={platforms} />}
          {tab === 'rawg' && <RawgImportTab />}
          {tab === 'csv' && <CsvUploadTab />}
          {tab === 'list' && <GamesListTab genres={genres} platforms={platforms} />}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
