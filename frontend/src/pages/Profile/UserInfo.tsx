import React from 'react';
import { Mail, Pencil, Check, X } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

interface UserInfoProps {
  user: any;
  isOwnProfile: boolean;
  collectionsCount: number;
  reviewsCount: number;
  editingBio: boolean;
  setEditingBio: (val: boolean) => void;
  bioInput: string;
  setBioInput: (val: string) => void;
  savingBio: boolean;
  handleSaveBio: () => void;
}

const UserInfo: React.FC<UserInfoProps> = ({
  user,
  isOwnProfile,
  collectionsCount,
  reviewsCount,
  editingBio,
  setEditingBio,
  bioInput,
  setBioInput,
  savingBio,
  handleSaveBio,
}) => {
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <div className="rounded-xl p-6 mb-6 animate-slide-up" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
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

        <div className="flex sm:flex-col gap-6 sm:gap-4 text-center sm:text-right">
          <div>
            <div className="text-2xl font-black" style={{ color: 'var(--text)' }}>{collectionsCount}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Коллекций</div>
          </div>
          <div>
            <div className="text-2xl font-black" style={{ color: 'var(--text)' }}>{reviewsCount}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Рецензий</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
