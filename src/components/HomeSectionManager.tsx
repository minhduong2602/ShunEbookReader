import React from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { useStore } from '../store';

interface Props {
  onClose: () => void;
}

export const HomeSectionManager: React.FC<Props> = ({ onClose }) => {
  const { homeSections, toggleHomeSection } = useStore();

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#EFE6D8]">
          <h2 className="font-display text-lg font-bold text-[#3D2B1F]">Tuỳ chỉnh Trang chủ</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F0E7D8] text-[#6B5645] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          <p className="text-xs text-[#6B5645] font-medium">Chọn các section bạn muốn hiển thị trên Trang chủ.</p>

          {homeSections.map((section) => (
            <button
              key={section.key}
              onClick={() => toggleHomeSection(section.key)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all cursor-pointer ${
                section.visible
                  ? 'border-[#E8604F]/30 bg-[#E8604F]/5 text-[#3D2B1F]'
                  : 'border-[#EFE6D8] bg-[#F9F5EE] text-[#6B5645]'
              }`}
            >
              <span className="font-semibold text-sm">{section.label}</span>
              {section.visible
                ? <Eye className="w-4 h-4 text-[#E8604F]" />
                : <EyeOff className="w-4 h-4 text-[#ADADAD]" />
              }
            </button>
          ))}
        </div>

        <div className="px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#E8604F] hover:bg-[#D6503F] text-white font-bold rounded-full text-sm shadow-chip transition-all active:scale-95"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeSectionManager;
