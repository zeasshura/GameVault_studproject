import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { User, Mail, BookOpen, Pencil, Check, X, Library, MessageSquare } from 'lucide-react';
import { collectionsApi } from '../api/collections';
import { useAuthStore } from '../store/auth';
import type { Collection, Review } from '../types';
import apiClient from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import RatingStars from '../components/RatingStars';

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

  // Settings
  const [settingsLogin, setSettingsLogin] = useState('');
  const [settingsPassword, setSettingsPassword] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  // Remove game from collection
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
      // ignore
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
        setSettingsPassword(''); // Clear password
      } else {
        setSettingsMsg('Нет изменений для сохранения.');
      }
    } catch (e: any) {
      setSettingsMsg(e.response?.data?.username?.[0] || e.response?.data?.password?.[0] || 'Ошибка при сохранении настроек');
    } finally {
      setSavingSettings(false);
    }
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? 'U';

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
        {/* ── Profile Header ─────────────────────────── */}
        <div className="rounded-xl p-6 mb-6 animate-slide-up" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-primary-500/40"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-black text-3xl font-black" style={{ background: 'var(--accent)' }}>
                  {initials}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>{user?.username}</h1>
                {user?.role === 'admin' && (
                  <span className="chip text-xs" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                    Администратор
                  </span>
                )}
              </div>
              {user?.email && (
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
              )}

              {/* Bio */}
              {editingBio ? (
                <div className="flex gap-2 items-start">
                  <textarea
                    id="bio-input"
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Расскажите о себе..."
                    className="input-field resize-none flex-1 text-sm"
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      id="save-bio-btn"
                      onClick={handleSaveBio}
                      disabled={savingBio}
                      className="p-2 rounded-lg transition-colors"
                      style={{ background: 'var(--accent)', color: '#000' }}
                    >
                      {savingBio ? <LoadingSpinner size="sm" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      id="cancel-bio-btn"
                      onClick={() => { setEditingBio(false); setBioInput(user?.bio ?? ''); }}
                      className="p-2 rounded-lg transition-colors"
                      style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 group">
                  <p className="text-sm flex-1" style={{ color: 'var(--text-muted)' }}>
                    {user?.bio ?? (
                      <span className="italic" style={{ color: 'var(--text-dim)' }}>Добавьте описание профиля...</span>
                    )}
                  </p>
                  {isOwnProfile && (
                    <button
                      id="edit-bio-btn"
                      onClick={() => { setEditingBio(true); setBioInput(user?.bio ?? ''); }}
                      className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      style={{ color: 'var(--text-dim)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
                      aria-label="Редактировать описание"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex sm:flex-col gap-6 sm:gap-4 text-center sm:text-right">
              <div>
                <div className="text-2xl font-black" style={{ color: 'var(--text)' }}>{collections.length}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Коллекций</div>
              </div>
              <div>
                <div className="text-2xl font-black" style={{ color: 'var(--text)' }}>{reviews.length}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Рецензий</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────── */}
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
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

        {/* ── Collections Tab ────────────────────────── */}
        {tab === 'collections' && (
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
        )}

        {/* ── Reviews Tab ───────────────────────────── */}
        {tab === 'reviews' && (
          <div className="animate-fade-in">
            {loadingRevs ? (
              <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="mb-4">
                  {isOwnProfile ? 'У вас пока нет рецензий' : 'У этого пользователя нет рецензий'}
                </p>
                {isOwnProfile && (
                  <Link to="/games" className="btn-primary" id="browse-to-review-link">
                    Перейти в каталог
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} id={`my-review-${review.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded"
                          style={{ background: review.score >= 8 ? '#6dc849' : review.score >= 6 ? '#f5c518' : '#ff6347', color: review.score >= 6 ? '#000' : '#fff' }}
                        >
                          {review.score}/10
                        </span>
                        <RatingStars rating={review.score} size="sm" />
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                        {new Date(review.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>{review.text}</p>
                    <div className="flex flex-wrap gap-3 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Геймплей</span>
                        <span className="text-xs font-bold" style={{ color: review.score_gameplay >= 8 ? '#6dc849' : review.score_gameplay >= 6 ? '#f5c518' : '#ff6347' }}>{review.score_gameplay}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Сюжет</span>
                        <span className="text-xs font-bold" style={{ color: review.score_story >= 8 ? '#6dc849' : review.score_story >= 6 ? '#f5c518' : '#ff6347' }}>{review.score_story}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Графика</span>
                        <span className="text-xs font-bold" style={{ color: review.score_graphics >= 8 ? '#6dc849' : review.score_graphics >= 6 ? '#f5c518' : '#ff6347' }}>{review.score_graphics}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Звук</span>
                        <span className="text-xs font-bold" style={{ color: review.score_sound >= 8 ? '#6dc849' : review.score_sound >= 6 ? '#f5c518' : '#ff6347' }}>{review.score_sound}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Link
                        to={`/games/${review.game}`}
                        className="text-xs font-medium transition-colors"
                        style={{ color: 'var(--accent)' }}
                        id={`review-game-link-${review.id}`}
                      >
                        Перейти к игре →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Settings Tab ──────────────────────────── */}
        {tab === 'settings' && isOwnProfile && (
          <div className="animate-fade-in rounded-xl p-6 max-w-xl mx-auto" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text)' }}>Настройки аккаунта</h2>
            <form onSubmit={handleSaveSettings} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Логин (Имя пользователя)</label>
                <input
                  type="text"
                  value={settingsLogin}
                  onChange={(e) => setSettingsLogin(e.target.value)}
                  className="input-field"
                  placeholder="Новый логин"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Новый пароль</label>
                <input
                  type="password"
                  value={settingsPassword}
                  onChange={(e) => setSettingsPassword(e.target.value)}
                  className="input-field"
                  placeholder="Оставьте пустым, если не хотите менять"
                />
              </div>
              {settingsMsg && (
                <div className="text-sm" style={{ color: settingsMsg.includes('ошибка') || settingsMsg.includes('уже существует') ? 'var(--red)' : 'var(--accent)' }}>
                  {settingsMsg}
                </div>
              )}
              <button
                type="submit"
                disabled={savingSettings}
                className="btn-primary mt-2"
              >
                {savingSettings ? <LoadingSpinner size="sm" /> : null}
                Сохранить настройки
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
