import React from 'react';
import { X, ArrowUpDown, Filter } from 'lucide-react';
import { BookShelf } from '../store';

export type SortOption = 'newest' | 'name' | 'rating';
export type ShelfFilter = BookShelf | 'all';

interface Props {
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  shelfFilter: ShelfFilter;
  onShelfChange: (s: ShelfFilter) => void;
  activeTags: string[];
  allTags: string[];
  onTagToggle: (tag: string) => void;
  onClearFilters: () => void;
}

const SHELF_LABELS: Record<ShelfFilter, string> = {
  all: 'Tất cả',
  reading: '📖 Đang đọc',
  completed: '✅ Đã xong',
  want: '🔖 Muốn đọc',
  dropped: '⏸ Tạm dừng',
};

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Mới nhất',
  name: 'Tên A-Z',
  rating: 'Đánh giá',
};

export const FilterBar: React.FC<Props> = ({
  sort,
  onSortChange,
  shelfFilter,
  onShelfChange,
  activeTags,
  allTags,
  onTagToggle,
  onClearFilters,
}) => {
  const hasActiveFilters = shelfFilter !== 'all' || activeTags.length > 0;
  const shelves: ShelfFilter[] = ['all', 'reading', 'want', 'completed', 'dropped'];
  const sorts: SortOption[] = ['newest', 'name', 'rating'];

  return (
    <div className="space-y-3">
      {/* Row 1: Shelf Filter Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {shelves.map((shelf) => (
          <button
            key={shelf}
            onClick={() => onShelfChange(shelf)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
              shelfFilter === shelf
                ? 'bg-[#E8604F] text-white border-[#E8604F] shadow-chip'
                : 'bg-white text-[#6B5645] border-[#EFE6D8] hover:border-[#E8604F]/40'
            }`}
          >
            {SHELF_LABELS[shelf]}
          </button>
        ))}
      </div>

      {/* Row 2: Sort + active tag chips + clear */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Sort dropdown */}
        <div className="flex bg-[#F0E7D8] p-0.5 rounded-full">
          {sorts.map((s) => (
            <button
              key={s}
              onClick={() => onSortChange(s)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                sort === s ? 'bg-white text-[#E8604F] shadow-chip' : 'text-[#6B5645]'
              }`}
            >
              {SORT_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Active tags */}
        {activeTags.map((tag) => (
          <button
            key={tag}
            onClick={() => onTagToggle(tag)}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-[#8D7FC4]/15 text-[#8D7FC4] border border-[#8D7FC4]/30 hover:bg-[#8D7FC4]/25 transition-colors cursor-pointer"
          >
            #{tag}
            <X className="w-3 h-3" />
          </button>
        ))}

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-[11px] font-bold text-[#B54B3C] hover:underline ml-auto cursor-pointer"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Row 3: Tag cloud (all available tags) */}
      {allTags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagToggle(tag)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                activeTags.includes(tag)
                  ? 'bg-[#8D7FC4] text-white border-[#8D7FC4]'
                  : 'bg-white text-[#6B5645] border-[#EFE6D8] hover:border-[#8D7FC4]/40'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
