import React from 'react';
import { CheckCircle2, Bookmark, BookOpen } from 'lucide-react';

export interface BookCoverCardProps {
  id: string;
  title: string;
  author?: string;
  isCompleted?: boolean;
  coverImage?: string;
  onClick?: () => void;
  onToggleCompleted?: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Generate dynamic illustration colors for book covers matching the Cozy Shelf palette
const getCoverStyle = (name: string) => {
  const themes = [
    { bg: 'from-[#E8604F] via-[#F28B7D] to-[#EDB65B]', accent: '#FFFFFF', pattern: 'bg-radial-gradient' },
    { bg: 'from-[#4A7FC1] via-[#6B9BD9] to-[#8D7FC4]', accent: '#FFFFFF', pattern: 'bg-pattern-dots' },
    { bg: 'from-[#7BAA5C] via-[#9BC57E] to-[#4FA6A8]', accent: '#FFFFFF', pattern: 'bg-pattern-waves' },
    { bg: 'from-[#8D7FC4] via-[#A798DD] to-[#E8604F]', accent: '#FFFFFF', pattern: 'bg-pattern-[#FBF6EC]' },
    { bg: 'from-[#3D2B1F] via-[#6B5645] to-[#B54B3C]', accent: '#EDB65B', pattern: 'bg-pattern-wood' },
    { bg: 'from-[#4FA6A8] via-[#6EC5C7] to-[#4A7FC1]', accent: '#FFFFFF', pattern: 'bg-pattern-sea' },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return themes[Math.abs(hash) % themes.length];
};

export const BookCoverCard: React.FC<BookCoverCardProps> = ({
  title,
  author = 'Sách sưu tầm',
  isCompleted = false,
  coverImage,
  onClick,
  onToggleCompleted,
  size = 'md',
  className = ''
}) => {
  const coverTheme = getCoverStyle(title);

  // Size variations
  const sizeClasses = {
    sm: 'w-[110px]',
    md: 'w-[140px] sm:w-[150px]',
    lg: 'w-[160px] sm:w-[180px]',
  }[size];

  const aspectHeight = {
    sm: 'h-[150px]',
    md: 'h-[190px] sm:h-[200px]',
    lg: 'h-[220px] sm:h-[240px]',
  }[size];

  return (
    <div 
      onClick={onClick}
      className={`group flex flex-col cursor-pointer shrink-0 transition-transform duration-200 hover:-translate-y-1 ${sizeClasses} ${className}`}
    >
      {/* Book Container with Page Edge & Bookmark Ribbon */}
      <div className="relative w-full">
        {/* Main Book Cover */}
        <div 
          className={`relative w-full ${aspectHeight} rounded-t-[20px] rounded-b-[6px] shadow-book overflow-hidden bg-gradient-to-br ${coverTheme.bg} p-3 flex flex-col justify-between transition-all duration-300 group-hover:shadow-2xl`}
        >
          {/* Decorative Spine Shadow */}
          <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/25 to-transparent z-10 pointer-events-none" />

          {/* Top Info & Completion Toggle Badge */}
          <div className="relative z-20 flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/20 text-white backdrop-blur-xs">
              Ebook
            </span>
            {onToggleCompleted && (
              <button
                onClick={onToggleCompleted}
                title={isCompleted ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành'}
                className="p-1 rounded-full bg-white/90 text-[#3D2B1F] shadow-sm hover:scale-110 active:scale-95 transition-all"
              >
                <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'text-emerald-600 fill-emerald-100' : 'text-gray-400'}`} />
              </button>
            )}
          </div>

          {/* Book Title Illustration Center (if no external image) */}
          {coverImage ? (
            <img 
              src={coverImage} 
              alt={title} 
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="relative z-20 my-auto text-center px-1">
              <div className="w-9 h-9 mx-auto mb-1.5 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/30">
                <BookOpen className="w-5 h-5 drop-shadow-sm" />
              </div>
              <p className="font-display font-bold text-white text-xs sm:text-sm line-clamp-3 leading-snug drop-shadow-sm">
                {title}
              </p>
            </div>
          )}

          {/* Signature Amber Bookmark Ribbon Tab (Clipped on Bottom-Right) */}
          <div className="absolute bottom-[-2px] right-3 z-30 flex flex-col items-center drop-shadow-md transition-transform duration-200 group-hover:translate-y-1">
            <div className="w-4 h-6 bg-[#EDB65B] rounded-t-[3px] shadow-sm relative">
              {/* Ribbon Cut Notch at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#EDB65B] clip-path-ribbon" />
            </div>
          </div>
        </div>

        {/* Signature Peeking Page-Stack Edge (#F5EFE3) */}
        <div className="w-[96%] mx-auto h-2 bg-[#F5EFE3] rounded-b-[8px] border-x border-b border-[#E4D9C8] shadow-xs flex items-center justify-center">
          <div className="w-3/4 h-[1px] bg-[#EFE6D8]" />
        </div>
      </div>

      {/* Book Metadata below cover */}
      <div className="mt-3 space-y-0.5 px-0.5">
        <h3 className="font-sans font-bold text-sm text-[#3D2B1F] line-clamp-2 leading-tight group-hover:text-[#E8604F] transition-colors">
          {title}
        </h3>
        <p className="font-sans font-medium text-xs text-[#B54B3C] truncate">
          {author}
        </p>
      </div>
    </div>
  );
};

export default BookCoverCard;
