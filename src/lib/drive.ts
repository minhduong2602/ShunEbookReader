import { get, set } from 'idb-keyval';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  updatedAt?: number;
}

export async function getSyncVersion(token: string | null): Promise<number> {
  try {
    const res = await fetch('/api/sync/version');
    if (!res.ok) return 0;
    const data = await res.json();
    return data.version || 0;
  } catch (err) {
    console.error('Failed to get sync version', err);
    return 0;
  }
}

export async function getSyncState(token: string | null, version?: number): Promise<any | null> {
  try {
    const url = version ? `/api/sync?v=${version}` : '/api/sync';
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Failed to get sync state', err);
    return null;
  }
}

export async function saveSyncState(token: string | null, state: any): Promise<void> {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(state),
    });
    if (!res.ok) {
      throw new Error('Failed to save sync state');
    }
  } catch (err) {
    console.error('Failed to save sync state', err);
  }
}

export async function patchSyncState(token: string | null, patch: any): Promise<{version: number} | null> {
  try {
    const res = await fetch('/api/sync', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      throw new Error('Failed to patch sync state');
    }
    return await res.json();
  } catch (err) {
    console.error('Failed to patch sync state', err);
    return null;
  }
}

export async function getFolders(token: string | null, parentId: string | null): Promise<DriveFile[]> {
  try {
    const res = await fetch('/api/books');
    if (!res.ok) {
      throw new Error('Failed to fetch folders');
    }
    return await res.json();
  } catch (err) {
    console.error('Failed to get books', err);
    throw err;
  }
}

export async function getFiles(token: string | null, parentId: string | null): Promise<DriveFile[]> {
  try {
    // parentId is now the bookId (url-encoded book name)
    const res = await fetch(`/api/books/${parentId}/chapters`);
    if (!res.ok) {
      throw new Error('Failed to fetch chapters');
    }
    return await res.json();
  } catch (err) {
    console.error('Failed to get chapters', err);
    throw err;
  }
}

export async function deleteBook(token: string | null, bookId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/books/${encodeURIComponent(bookId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Xóa truyện thất bại');
    }
    return true;
  } catch (err) {
    console.error('Failed to delete book', err);
    throw err;
  }
}

export async function deleteChapter(token: string | null, chapterId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/chapters/${encodeURIComponent(chapterId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Xóa chương thất bại');
    }
    return true;
  } catch (err) {
    console.error('Failed to delete chapter', err);
    throw err;
  }
}

export async function getFileContent(
  token: string | null, 
  fileId: string, 
  mimeType: string, 
  fileName: string = ''
): Promise<{content: string, isHtml: boolean}> {
  const cacheKey = `file_${fileId}`;
  
  try {
    const url = `/api/chapters/${fileId}/content`;

    // Epuv, doc, pdf validation check
    if (fileName.endsWith('.epub')) {
      throw new Error('Định dạng EPUB chưa được hỗ trợ. Vui lòng dùng file TXT, HTML, DOCX hoặc Google Doc.');
    }
    if (fileName.endsWith('.doc')) {
      throw new Error('Định dạng DOC cũ không được hỗ trợ. Vui lòng lưu thành DOCX hoặc Google Doc.');
    }
    if (fileName.endsWith('.pdf')) {
      throw new Error('Định dạng PDF không được hỗ trợ để đọc text.');
    }

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch content (${res.status})`);
    }

    const buffer = await res.arrayBuffer();

    // 1. DOCX Files
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
      // @ts-ignore
      const mammoth = await import('mammoth/mammoth.browser.js');
      const docxResult = await mammoth.convertToHtml({ arrayBuffer: buffer });
      const result = { content: docxResult.value, isHtml: true };
      await set(cacheKey, result);
      return result;
    }

    // 2. Text/HTML Files (with smart encoding detection)
    let text = '';
    try {
      // Try UTF-8 first
      text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch (e) {
      try {
        // Fallback 1: UTF-16LE
        text = new TextDecoder('utf-16le', { fatal: true }).decode(buffer);
      } catch (e2) {
        // Fallback 2: Vietnamese Windows-1258
        text = new TextDecoder('windows-1258').decode(buffer);
      }
    }

    const isHtml = mimeType === 'text/html' || fileName.endsWith('.html') || fileName.endsWith('.htm');
    const result = { content: text, isHtml };
    await set(cacheKey, result);
    return result;
  } catch (err: any) {
    // Try cache if failed
    if (!err.message.includes('không được hỗ trợ')) {
      const cached = await get<{content: string, isHtml: boolean}>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    throw err;
  }
}

// Function to upload a chapter/book file to the backend
export async function uploadChapter(bookName: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('bookName', bookName);
  formData.append('fileName', file.name);
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to upload novel chapter');
  }

  return await res.json();
}
