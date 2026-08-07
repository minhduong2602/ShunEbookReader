import React from 'react';
import { Sparkles, BookOpen, Layers, Library, Heart, Compass, Bookmark, Headphones } from 'lucide-react';

export interface CategoryItem {
  id: string;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor?: string;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'all', label: 'Tất cả', icon: Library, iconColor: 'text-[#E8604F]' },
  { id: 'fiction', label: 'Fiction', icon: Sparkles, iconColor: 'text-[#8D7FC4]' },
  { id: 'fantasy', label: 'Fantasy', icon: Compass, iconColor: 'text-[#4A7FC1]' },
  { id: 'manga', label: 'Manga', icon: Layers, iconColor: 'text-[#7BAA5C]' },
  { id: 'ebooks', label: 'eBooks', icon: BookOpen, iconColor: 'text-[#4FA6A8]' },
  { id: 'audiobooks', label: 'Audiobooks', icon: Headphones, iconColor: 'text-[#EDB65B]' },
  { id: 'favorites', label: 'Yêu thích', icon: Heart, iconColor: 'text-[#B54B3C]' },
];

interface CategoryRailProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

export const CategoryRail: React.FC<CategoryRailProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2 px-1">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="flex flex-col items-center gap-2 group shrink-0 cursor-pointer outline-none focus:ring-2 focus:ring-[#E8604F]/30 rounded-2xl p-1 transition-transform active:scale-95"
            >
              {/* White Card Chip */}
              <div 
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white flex items-center justify-center shadow-chip border transition-all duration-200 ${
                  isSelected 
                    ? 'border-[#E8604F] ring-2 ring-[#E8604F]/20 shadow-md scale-105' 
                    : 'border-transparent group-hover:border-[#EFE6D8] group-hover:shadow-md'
                }`}
              >
                <div className={`p-2.5 rounded-xl bg-[#FBF6EC] ${cat.iconColor}`}>
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              </div>

              {/* Label */}
              <span 
                className={`text-xs font-semibold tracking-wide transition-colors ${
                  isSelected ? 'text-[#E8604F] font-bold' : 'text-[#6B5645] group-hover:text-[#3D2B1F]'
                }`}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryRail;
