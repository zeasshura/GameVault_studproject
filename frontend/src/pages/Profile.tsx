import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { User, Mail, BookOpen, Star, Pencil, Check, X, Library, MessageSquare } from 'lucide-react';
import { collectionsApi } from '../api/collections';
import { reviewsApi } from '../api/reviews';
import { useAuthStore } from '../store/auth';
import type { Collection, Review } from '../types';
import apiClient from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import RatingStars from '../components/RatingStars';

type ProfileTab = 'collections' | 'reviews';

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

  // Bio editing
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(user?.bio ?? '');
  const [savingBio, setSavingBio] = useState(false);

  useEffect(() => {
    if (isOwnProfile) {
      setUserState(currentUser);
    }
  }, [currentUser, isOwnProfile]);

  useEffect(() => {
    if (user) {
      setBioInput(user.bio ?? '');
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

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? 'U';

  if (loadingProfile) {
    return (
      <div className="min-h-screen pt-20 pb-16 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-20 pb-16 text-center">
        <div className="section-container">
          <h1 className="text-2xl font-bold text-white mb-4">Пользователь не найден</h1>
          <Link to="/" className="btn-primary">На главную</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="section-container">
        {/* ── Profile Header ─────────────────────────── */}
        <div className="glass rounded-3xl p-8 mb-8 animate-slide-up">
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
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-primary-500/30">
                  {initials}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black text-white">{user?.username}</h1>
                {user?.role === 'admin' && (
                  <span className="chip bg-primary-500/20 text-primary-300 border border-primary-500/30 text-xs">
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
                      className="p-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white transition-colors"
                    >
                      {savingBio ? <LoadingSpinner size="sm" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      id="cancel-bio-btn"
                      onClick={() => { setEditingBio(false); setBioInput(user?.bio ?? ''); }}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 group">
                  <p className="text-gray-400 text-sm flex-1">
                    {user?.bio ?? (
                      <span className="text-gray-600 italic">Добавьте описание профиля...</span>
                    )}
                  </p>
                  {isOwnProfile && (
                    <button
                      id="edit-bio-btn"
                      onClick={() => { setEditingBio(true); setBioInput(user?.bio ?? ''); }}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-primary-400 hover:bg-primary-500/10 transition-all opacity-0 group-hover:opacity-100"
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
                <div className="text-2xl font-black text-white">{collections.length}</div>
                <div className="text-xs text-gray-500">Коллекций</div>
              </div>
              <div>
                <div className="text-2xl font-black text-white">{reviews.length}</div>
                <div className="text-xs text-gray-500">Рецензий</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────── */}
        <div className="flex gap-1 mb-6 glass rounded-2xl p-1.5 w-fit">
          {[
            { id: 'collections' as ProfileTab, label: 'Коллекции', icon: <Library className="w-4 h-4" /> },
            { id: 'reviews' as ProfileTab, label: 'Рецензии', icon: <MessageSquare className="w-4 h-4" /> },
          ].map((t) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${tab === t.id
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                  : 'text-gray-400 hover:text-gray-200'
                }`}
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
                  <div key={col.id} className="glass rounded-2xl p-6" id={`collection-${col.id}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <BookOpen className="w-5 h-5 text-primary-400" />
                      <h3 className="text-lg font-bold text-white">{col.name}</h3>
                      <span className="chip bg-white/5 text-gray-500 border border-white/10 text-xs">
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
                            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-dark-100 border border-white/10 group-hover:border-primary-500/50 transition-all">
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
                            </div>
                            <p className="text-xs text-gray-500 mt-1 truncate group-hover:text-primary-300 transition-colors">
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
                  <div key={review.id} className="glass rounded-2xl p-5" id={`my-review-${review.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-bold text-yellow-400">{review.score}/10</span>
                        <RatingStars rating={review.score} size="sm" />
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{review.text}</p>
                    <div className="mt-3">
                      <Link
                        to={`/games/${review.game}`}
                        className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
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
      </div>
    </div>
  );
};

export default Profile;
