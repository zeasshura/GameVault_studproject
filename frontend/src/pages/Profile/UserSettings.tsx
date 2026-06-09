import React from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';

interface UserSettingsProps {
  settingsLogin: string;
  setSettingsLogin: (val: string) => void;
  settingsPassword: string;
  setSettingsPassword: (val: string) => void;
  settingsMsg: string;
  savingSettings: boolean;
  handleSaveSettings: (e: React.FormEvent) => void;
}

const UserSettings: React.FC<UserSettingsProps> = ({
  settingsLogin,
  setSettingsLogin,
  settingsPassword,
  setSettingsPassword,
  settingsMsg,
  savingSettings,
  handleSaveSettings,
}) => {
  return (
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
  );
};

export default UserSettings;
