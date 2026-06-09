import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export const SearchBar: React.FC<{ onSearchSubmit?: () => void }> = ({ onSearchSubmit }) => {
  const [searchVal, setSearchVal] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/games?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
      if (onSearchSubmit) onSearchSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="hidden md:flex flex-1 max-w-md relative"
    >
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
        style={{ color: 'var(--text-dim)' }}
      />
      <input
        type="text"
        value={searchVal}
        onChange={(e) => setSearchVal(e.target.value)}
        placeholder="Поиск игр..."
        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none transition-colors"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
      />
    </form>
  );
};
