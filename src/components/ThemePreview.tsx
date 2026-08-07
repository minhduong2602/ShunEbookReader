import React from 'react';
import { CustomTheme } from '../store';

interface Props {
  theme: CustomTheme;
  isActive?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  size?: 'sm' | 'md';
}

export const ThemePreview: React.FC<Props> = ({ theme, isActive, onSelect, onDelete, size = 'md' }) => {
  const isSmall = size === 'sm';

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
        isActive ? 'border-[#E8604F] shadow-chip' : 'border-transparent shadow-chip hover:border-[#E4D9C8]'
      } ${isSmall ? 'w-24' : 'w-36'}`}
      style={{ backgroundColor: theme.bg }}
    >
      {/* Surface card mockup */}
      <div className={`m-2 rounded-xl p-2 ${isSmall ? 'space-y-1' : 'space-y-1.5'}`} style={{ backgroundColor: theme.surface }}>
        <div className="rounded-full h-2" style={{ backgroundColor: theme.text, opacity: 0.7, width: '70%' }} />
        <div className="rounded-full h-1.5" style={{ backgroundColor: theme.text, opacity: 0.3, width: '100%' }} />
        <div className="rounded-full h-1.5" style={{ backgroundColor: theme.text, opacity: 0.3, width: '85%' }} />
        <div className="rounded-full h-4 mt-1 flex items-center justify-center" style={{ backgroundColor: theme.accent, width: '60%' }}>
          <div className="rounded-full h-1" style={{ backgroundColor: '#fff', width: '50%', opacity: 0.9 }} />
        </div>
      </div>

      <div
        className={`px-2 pb-2 text-center font-bold truncate ${isSmall ? 'text-[9px]' : 'text-[10px]'}`}
        style={{ color: theme.text }}
      >
        {theme.name}
      </div>

      {isActive && (
        <div className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-[#E8604F] border-2 border-white" />
      )}

      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/30 text-white flex items-center justify-center text-[10px] font-bold opacity-0 hover:opacity-100 transition-opacity"
          title="Xóa theme"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default ThemePreview;
