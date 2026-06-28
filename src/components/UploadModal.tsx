import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Folder, Plus, Loader2, Check, AlertCircle, FileText } from 'lucide-react';
import { getFolders, uploadChapter, DriveFile } from '../lib/drive';
import { useStore } from '../store';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBookName?: string;
  onUploadSuccess: () => void;
}

export default function UploadModal({ isOpen, onClose, initialBookName, onUploadSuccess }: UploadModalProps) {
  const { token, folderId } = useStore();
  const [existingBooks, setExistingBooks] = useState<DriveFile[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  
  // Selection states
  const [selectedBookOption, setSelectedBookOption] = useState<string>('');
  const [newBookName, setNewBookName] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  
  // Files to upload
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Upload status states
  const [uploadProgress, setUploadProgress] = useState<{ [fileName: string]: 'pending' | 'uploading' | 'success' | 'error' }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadExistingBooks();
      // Reset statuses
      setFiles([]);
      setUploadProgress({});
      setIsUploading(false);
      setGeneralError('');
      
      if (initialBookName) {
        setSelectedBookOption(initialBookName);
        setIsCreatingNew(false);
      } else {
        setSelectedBookOption('');
        setIsCreatingNew(true); // Default to create new if no initial book
      }
    }
  }, [isOpen, initialBookName]);

  const loadExistingBooks = async () => {
    try {
      setLoadingBooks(true);
      const folders = await getFolders(token, folderId);
      setExistingBooks(folders);
      
      // If we have folders and didn't specify an initial book name, select the first folder
      if (folders.length > 0 && !initialBookName) {
        setSelectedBookOption('__root__');
        setIsCreatingNew(false);
      } else if (folders.length === 0) {
        setIsCreatingNew(true);
      }
    } catch (err) {
      console.error('Failed to load books for dropdown', err);
    } finally {
      setLoadingBooks(false);
    }
  };

  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedBookOption(val);
    if (val === '__new__') {
      setIsCreatingNew(true);
    } else {
      setIsCreatingNew(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    // Filter supported file extensions
    const supportedExtensions = ['.txt', '.docx', '.html', '.htm'];
    const filtered = newFiles.filter(file => {
      const nameLower = file.name.toLowerCase();
      return supportedExtensions.some(ext => nameLower.endsWith(ext));
    });

    if (filtered.length !== newFiles.length) {
      setGeneralError('Một số file bị bỏ qua do không đúng định dạng. Chỉ hỗ trợ .txt, .docx, .html');
    } else {
      setGeneralError('');
    }

    setFiles(prev => {
      // Avoid duplicate names in the current upload queue
      const existingNames = new Set(prev.map(f => f.name));
      const duplicatesRemoved = filtered.filter(f => !existingNames.has(f.name));
      return [...prev, ...duplicatesRemoved];
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async () => {
    setGeneralError('');
    let targetBook = isCreatingNew ? newBookName.trim() : selectedBookOption;
    if (targetBook === '__root__') {
      targetBook = '';
    }
    
    if (files.length === 0) {
      setGeneralError('Vui lòng chọn ít nhất một tệp tin chương để tải lên.');
      return;
    }

    setIsUploading(true);
    
    // Initialize file statuses to pending
    const initialStatus: typeof uploadProgress = {};
    files.forEach(f => {
      initialStatus[f.name] = 'pending';
    });
    setUploadProgress(initialStatus);

    let hasSuccess = false;

    // Upload sequentially to preserve S3 order / prevent spikes
    for (const file of files) {
      setUploadProgress(prev => ({ ...prev, [file.name]: 'uploading' }));
      try {
        await uploadChapter(targetBook, file);
        setUploadProgress(prev => ({ ...prev, [file.name]: 'success' }));
        hasSuccess = true;
      } catch (err: any) {
        console.error(`Failed to upload ${file.name}`, err);
        setUploadProgress(prev => ({ ...prev, [file.name]: 'error' }));
      }
    }

    setIsUploading(false);

    if (hasSuccess) {
      onUploadSuccess();
      // Keep modal open briefly or let user close when done, 
      // let's give them a button to clear or complete.
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] border border-gray-100 dark:border-gray-800 transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {initialBookName ? `Thêm chương vào "${initialBookName}"` : 'Tải lên truyện mới'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            disabled={isUploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
          {generalError && (
            <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm flex items-start gap-2 border border-red-100 dark:border-red-950">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Book Selector */}
          {!initialBookName && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Thư mục sách (Novel Folder)
              </label>
              
              <div className="flex gap-2">
                <select
                  value={isCreatingNew ? '__new__' : selectedBookOption}
                  onChange={handleOptionChange}
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  disabled={isUploading || loadingBooks}
                >
                  {loadingBooks ? (
                    <option>Đang tải danh sách sách...</option>
                  ) : (
                    <>
                      <option value="__root__">Tải lên như một truyện/tệp độc lập</option>
                      {existingBooks.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                      <option value="__new__">+ Tạo thư mục sách mới...</option>
                    </>
                  )}
                </select>
              </div>

              {isCreatingNew && (
                <div className="space-y-1.5 animate-slide-up">
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
                    <Plus className="w-3.5 h-3.5" /> Nhập tên bộ truyện mới:
                  </div>
                  <input
                    type="text"
                    value={newBookName}
                    onChange={(e) => setNewBookName(e.target.value)}
                    placeholder="Ví dụ: Thần Điêu Hiệp Lữ, Harry Potter..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    disabled={isUploading}
                    maxLength={60}
                  />
                </div>
              )}
            </div>
          )}

          {/* Drag & Drop Area */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Chọn tệp chương truyện
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' 
                  : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 bg-gray-50/50 dark:bg-gray-800/10'
              } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.docx,.html,.htm"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              <Upload className="w-10 h-10 text-gray-400 dark:text-gray-600 mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Kéo & thả các chương truyện vào đây, hoặc <span className="text-blue-600 dark:text-blue-400 underline">chọn tệp</span>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Hỗ trợ định dạng: .TXT, .DOCX, .HTML (Có thể chọn nhiều tệp)
              </p>
            </div>
          </div>

          {/* Files List & Upload Progress */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Danh sách tệp ({files.length})
                </span>
                {!isUploading && (
                  <button 
                    onClick={() => setFiles([])} 
                    className="text-xs text-red-500 hover:underline"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
              <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                {files.map((file, idx) => {
                  const status = uploadProgress[file.name] || 'pending';
                  return (
                    <div key={file.name} className="px-4 py-2.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-3">
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 truncate font-medium">{file.name}</span>
                        <span className="text-xs text-gray-400 shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      
                      <div className="flex items-center shrink-0">
                        {status === 'pending' && !isUploading && (
                          <button 
                            onClick={() => removeFile(idx)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        {status === 'pending' && isUploading && (
                          <span className="text-xs text-gray-400">Đang chờ...</span>
                        )}
                        {status === 'uploading' && (
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                        )}
                        {status === 'success' && (
                          <span className="text-green-500 flex items-center gap-1 font-semibold text-xs">
                            <Check className="w-4 h-4" /> Thành công
                          </span>
                        )}
                        {status === 'error' && (
                          <span className="text-red-500 flex items-center gap-1 font-semibold text-xs">
                            <AlertCircle className="w-4 h-4" /> Lỗi
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-850/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm transition-colors"
            disabled={isUploading}
          >
            Đóng
          </button>
          <button
            onClick={handleUploadSubmit}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors shadow flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isUploading || files.length === 0}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tải lên...
              </>
            ) : (
              'Bắt đầu tải lên'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
