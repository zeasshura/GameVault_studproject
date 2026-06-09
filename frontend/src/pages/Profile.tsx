import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { User, Library, MessageSquare } from 'lucide-react';
import { collectionsApi } from '../api/collections';
import { useAuthStore } from '../store/auth';
import type { Collection, Review } from '../types';
import apiClient from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

import UserInfo from './Profile/UserInfo';
import UserCollections from './Profile/UserCollections';
import UserReviews from './Profile/UserReviews';
import UserSettings from './Profile/UserSettings';

type ProfileTab = 'collections' | 'reviews' | 'settings';

const Profile: React.FC = () => {
  const { user: currentUser, setUser: setCurrentUser } = useAuthStore();
  const { id } = useParams<{ id?: string }>();
  
  const isOwnProfile = !id || (currentUser && String(currentUser.id) === id);

  const [user, setUserState] = useState<any>(isOwnProfile ? currentUser : null);
  const [tab, setTab] = useState<ProfileTab>('collections');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingCols, setLoadingCols] = useState(true);
  const [loadingRevs, setLoadingRevs] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(!isOwnProfile);

  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(user?.bio ?? '');
  const [savingBio, setSavingBio] = useState(false);

  const [settingsLogin, setSettingsLogin] = useState('');
  const [settingsPassword, setSettingsPassword] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  const handleRemoveGame = async (collectionId: number, gameId: number) => {
    if (!window.confirm('Удалить игру из коллекции?')) return;
    try {
      await collectionsApi.removeGameFromCollection(collectionId, gameId);
      setCollections(prev => prev.map(c => {
        if (c.id === collectionId) {
          return { ...c, games: c.games.filter(g => g.id !== gameId) };
        }
        return c;
      }));
    } catch (e) {
      console.error(e);
      alert('Не удалось удалить игру из коллекции');
    }
  };

  useEffect(() => {
    if (isOwnProfile) {
      setUserState(currentUser);
    }
  }, [currentUser, isOwnProfile]);

  useEffect(() => {
    if (user) {
      setBioInput(user.bio ?? '');
      setSettingsLogin(user.username ?? '');
    }
  }, [user]);

  useEffect(() => {
    document.title = `${user?.username ?? 'Профиль'} — GameVault`;
  }, [user]);

  const fetchCollections = useCallback(async () => {
    if (!isOwnProfile) return;
    setLoadingCols(true);
    try {
      const data = await collectionsApi.getCollections();
      setCollections(data);
    } catch {
      setCollections([]);
    } finally {
      setLoadingCols(false);
    }
  }, [isOwnProfile]);

  const fetchReviews = useCallback(async () => {
    if (!isOwnProfile) return;
    setLoadingRevs(true);
    try {
      const response = await apiClient.get<Review[]>('/reviews/my/');
      setReviews(response.data);
    } catch {
      setReviews([]);
    } finally {
      setLoadingRevs(false);
    }
  }, [isOwnProfile]);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      if (isOwnProfile) {
        return;
      }
      setLoadingProfile(true);
      try {
        const response = await apiClient.get<any>(`/auth/users/${id}/`);
        setUserState(response.data.user);
        setCollections(response.data.collections);
        setReviews(response.data.reviews);
      } catch {
        setUserState(null);
        setCollections([]);
        setReviews([]);
      } finally {
        setLoadingProfile(false);
        setLoadingCols(false);
        setLoadingRevs(false);
      }
    };
    fetchPublicProfile();
  }, [id, isOwnProfile]);

  useEffect(() => {
    if (isOwnProfile) {
      fetchCollections();
      fetchReviews();
    }
  }, [isOwnProfile, fetchCollections, fetchReviews]);

  const handleSaveBio = async () => {
    if (!isOwnProfile) return;
    setSavingBio(true);
    try {
      const response = await apiClient.patch<any>('/auth/me/', { bio: bioInput });
      if (response.data && user) {
        const updatedUser = { ...user, bio: response.data?.bio };
        setUserState(updatedUser);
        if (setCurrentUser) {
          setCurrentUser(updatedUser);
        }
      }
      setEditingBio(false);
    } catch {
    } finally {
      setSavingBio(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile) return;
    setSavingSettings(true);
    setSettingsMsg('');
    try {
      const payload: any = {};
      if (settingsLogin && settingsLogin !== user?.username) {
        payload.username = settingsLogin;
      }
      if (settingsPassword) {
        payload.password = settingsPassword;
      }
      
      if (Object.keys(payload).length > 0) {
        const response = await apiClient.patch<any>('/auth/me/', payload);
        if (response.data && user) {
          const updatedUser = { ...user, username: response.data?.username };
          setUserState(updatedUser);
          if (setCurrentUser) {
            setCurrentUser(updatedUser);
          }
        }
        setSettingsMsg('Настройки успешно сохранены!');
        setSettingsPassword('');
      } else {
        setSettingsMsg('Нет изменений для сохранения.');
      }
    } catch (e: any) {
      setSettingsMsg(e.response?.data?.username?.[0] || e.response?.data?.password?.[0] || 'Ошибка при сохранении настроек');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen pt-14 pb-16 flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-14 pb-16 text-center" style={{ background: 'var(--bg)' }}>
        <div className="section-container">
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>Пользователь не найден</h1>
          <Link to="/" className="btn-primary">На главную</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-14 pb-16" style={{ background: 'var(--bg)' }}>
      <div className="section-container py-8">
        <UserInfo
          user={user}
          isOwnProfile={isOwnProfile}
          collectionsCount={collections.length}
          reviewsCount={reviews.length}
          editingBio={editingBio}
          setEditingBio={setEditingBio}
          bioInput={bioInput}
          setBioInput={setBioInput}
          savingBio={savingBio}
          handleSaveBio={handleSaveBio}
        />

        <div className="flex gap-1 mb-6 rounded-xl p-1 w-fit" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          {[
            { id: 'collections' as ProfileTab, label: 'Коллекции', icon: <Library className="w-4 h-4" /> },
            { id: 'reviews' as ProfileTab, label: 'Рецензии', icon: <MessageSquare className="w-4 h-4" /> },
            ...(isOwnProfile ? [{ id: 'settings' as ProfileTab, label: 'Настройки', icon: <User className="w-4 h-4" /> }] : []),
          ].map((t) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200`}
              style={tab === t.id
                ? { background: 'var(--accent)', color: '#000' }
                : { color: 'var(--text-muted)' }
              }
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'collections' && (
          <UserCollections
            collections={collections}
            loadingCols={loadingCols}
            isOwnProfile={isOwnProfile}
            handleRemoveGame={handleRemoveGame}
          />
        )}

        {tab === 'reviews' && (
          <UserReviews
            reviews={reviews}
            loadingRevs={loadingRevs}
            isOwnProfile={isOwnProfile}
          />
        )}

        {tab === 'settings' && isOwnProfile && (
          <UserSettings
            settingsLogin={settingsLogin}
            setSettingsLogin={setSettingsLogin}
            settingsPassword={settingsPassword}
            setSettingsPassword={setSettingsPassword}
            settingsMsg={settingsMsg}
            savingSettings={savingSettings}
            handleSaveSettings={handleSaveSettings}
          />
        )}
      </div>
    </div>
  );
};

export default Profile;
