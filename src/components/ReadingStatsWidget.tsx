import React from 'react';
import { Flame, Clock, BookCheck, Award } from 'lucide-react';
import { useStore } from '../store';

export const ReadingStatsWidget: React.FC = () => {
  const { readingStats, completedBooks } = useStore();

  const streak = readingStats?.streak || 0;
  const totalMinutes = readingStats?.totalMinutes || 0;
  const completedCount = Object.values(completedBooks).filter(Boolean).length;

  const formatReadingTime = (mins: number) => {
    if (mins < 60) return `${mins} phút`;
    const hrs = (mins / 60).toFixed(1);
    return `${hrs} giờ`;
  };

  return (
    <div className="bg-[#F1E9DA] rounded-[24px] p-5 sm:p-6 border border-[#EFE6D8] shadow-xs space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg text-[#3D2B1F] flex items-center gap-2">
          <Award className="w-5 h-5 text-[#E8604F]" /> Thống kê đọc cá nhân
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B5645] bg-white/80 px-2.5 py-0.5 rounded-full shadow-xs">
          Hôm nay
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Streak */}
        <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border border-[#EFE6D8] shadow-chip flex flex-col items-center justify-center text-center space-y-1">
          <div className="p-2 rounded-full bg-[#E8604F]/10 text-[#E8604F]">
            <Flame className="w-5 h-5 fill-[#E8604F]" />
          </div>
          <span className="font-display font-bold text-xl sm:text-2xl text-[#3D2B1F]">{streak}</span>
          <span className="text-[10px] font-bold text-[#6B5645] uppercase tracking-wider">Ngày Streak 🔥</span>
        </div>

        {/* Time spent */}
        <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border border-[#EFE6D8] shadow-chip flex flex-col items-center justify-center text-center space-y-1">
          <div className="p-2 rounded-full bg-[#4A7FC1]/10 text-[#4A7FC1]">
            <Clock className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-base sm:text-lg text-[#3D2B1F] truncate">{formatReadingTime(totalMinutes)}</span>
          <span className="text-[10px] font-bold text-[#6B5645] uppercase tracking-wider">Đã đọc ⏱️</span>
        </div>

        {/* Completed Books */}
        <div className="bg-white/90 backdrop-blur-xs p-3.5 rounded-2xl border border-[#EFE6D8] shadow-chip flex flex-col items-center justify-center text-center space-y-1">
          <div className="p-2 rounded-full bg-[#7BAA5C]/10 text-[#7BAA5C]">
            <BookCheck className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl sm:text-2xl text-[#3D2B1F]">{completedCount}</span>
          <span className="text-[10px] font-bold text-[#6B5645] uppercase tracking-wider">Đã xong 📚</span>
        </div>
      </div>
    </div>
  );
};

export default ReadingStatsWidget;
