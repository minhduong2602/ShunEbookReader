import { useEffect, useCallback } from 'react';

export interface ShortcutMap {
  key: string;
  label: string;
  description: string;
  handler: () => void;
  requiresCtrl?: boolean;
}

export const READER_SHORTCUTS: Omit<ShortcutMap, 'handler'>[] = [
  { key: 'F', label: 'F', description: 'Bật/tắt chế độ Focus (ẩn UI)' },
  { key: 'B', label: 'B', description: 'Đánh dấu vị trí đọc' },
  { key: 'ArrowLeft', label: '←', description: 'Cuộn lên trên (chương trước)' },
  { key: 'ArrowRight', label: '→', description: 'Cuộn xuống dưới (chương sau)' },
  { key: 'T', label: 'T', description: 'Chuyển theme tiếp theo' },
  { key: 'Escape', label: 'Esc', description: 'Đóng panel / Thoát Focus Mode' },
];

export const GLOBAL_SHORTCUTS: Omit<ShortcutMap, 'handler'>[] = [
  { key: '/', label: '/', description: 'Tìm kiếm sách' },
  { key: 'u', label: 'U', description: 'Mở modal Upload' },
];

/**
 * Hook quản lý keyboard shortcuts cục bộ.
 * @param shortcuts - Danh sách { key, handler } cần gắn
 * @param active - Có bật shortcuts không (default: true)
 */
export function useKeyboardShortcuts(
  shortcuts: { key: string; requiresCtrl?: boolean; handler: () => void }[],
  active = true
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!active) return;
      // Bỏ qua khi đang focus input / textarea / contenteditable
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;

      for (const shortcut of shortcuts) {
        const keyMatch = e.key === shortcut.key || e.key === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.requiresCtrl ? (e.ctrlKey || e.metaKey) : true;
        if (keyMatch && ctrlMatch) {
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    },
    [shortcuts, active]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
