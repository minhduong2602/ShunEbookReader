import { get, set } from 'idb-keyval';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const SYNC_FILE_NAME = 'reader_sync_v1.json';

export async function getSyncState(token: string): Promise<any | null> {
  try {
    const q = `name='${SYNC_FILE_NAME}'`;
    const res = await fetch(`${DRIVE_API}/files?spaces=appDataFolder&q=${encodeURIComponent(q)}&fields=files(id)`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Unauthorized');
      return null;
    }
    const data = await res.json();
    if (!data.files || data.files.length === 0) return null;

    const fileId = data.files[0].id;
    const contentRes = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!contentRes.ok) return null;
    return await contentRes.json();
  } catch (err) {
    console.error('Failed to get sync state', err);
    return null;
  }
}

export async function saveSyncState(token: string, state: any): Promise<void> {
  try {
    const q = `name='${SYNC_FILE_NAME}'`;
    const resList = await fetch(`${DRIVE_API}/files?spaces=appDataFolder&q=${encodeURIComponent(q)}&fields=files(id)`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!resList.ok) {
       if (resList.status === 401) throw new Error('Unauthorized');
       if (resList.status === 403) throw new Error('Failed to list appDataFolder. You may not have granted the app data folder permission or the Drive API is not enabled.');
       throw new Error(`Failed to list appDataFolder: ${resList.status} ${resList.statusText}`);
    }
    
    const listData = await resList.json();
    let fileId = null;

    if (listData.files && listData.files.length > 0) {
      fileId = listData.files[0].id;
    } else {
      const createRes = await fetch(`${DRIVE_API}/files`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ name: SYNC_FILE_NAME, parents: ['appDataFolder'] })
      });
      if (!createRes.ok) throw new Error('Failed to create sync file');
      const createData = await createRes.json();
      fileId = createData.id;
    }

    if (!fileId) return;

    const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: blob
    });
  } catch (err) {
    console.error('Failed to save sync state', err);
  }
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

export async function getFolders(token: string, parentId: string): Promise<DriveFile[]> {
  const q = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const res = await fetch(`${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType)&orderBy=name`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to fetch folders');
  }
  const data = await res.json();
  return data.files || [];
}

export async function getFiles(token: string, parentId: string): Promise<DriveFile[]> {
  const q = `'${parentId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
  const res = await fetch(`${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType)&orderBy=name`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to fetch files');
  }
  const data = await res.json();
  return data.files || [];
}

export async function getFileContent(token: string, fileId: string, mimeType: string, fileName: string = ''): Promise<{content: string, isHtml: boolean}> {
  const cacheKey = `file_${fileId}`;
  
  try {
    let url = `${DRIVE_API}/files/${fileId}?alt=media`;

    // 1. Google Docs
    if (mimeType === 'application/vnd.google-apps.document') {
      url = `${DRIVE_API}/files/${fileId}/export?mimeType=text/html`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        if (res.status === 401) throw new Error('Unauthorized');
        if (res.status === 404) throw new Error('File not found');
        throw new Error(`Failed to fetch content (${res.status})`);
      }
      const content = await res.text();
      const result = { content, isHtml: true };
      await set(cacheKey, result);
      return result;
    }

    // Chặn các định dạng binary không hỗ trợ đọc text
    if (mimeType === 'application/epub+zip' || fileName.endsWith('.epub')) {
      throw new Error('Định dạng EPUB chưa được hỗ trợ. Vui lòng dùng file TXT, HTML, DOCX hoặc Google Doc.');
    }
    if (mimeType === 'application/msword' || fileName.endsWith('.doc')) {
      throw new Error('Định dạng DOC cũ không được hỗ trợ. Vui lòng lưu thành DOCX hoặc Google Doc.');
    }
    if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
      throw new Error('Định dạng PDF không được hỗ trợ để đọc text.');
    }

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Unauthorized');
      if (res.status === 404) throw new Error('File not found');
      throw new Error(`Failed to fetch content (${res.status})`);
    }

    const buffer = await res.arrayBuffer();

    // 2. DOCX Files
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
      const mammoth = await import('mammoth');
      const docxResult = await mammoth.convertToHtml({ arrayBuffer: buffer });
      const result = { content: docxResult.value, isHtml: true };
      await set(cacheKey, result);
      return result;
    }

    // 3. Text/HTML Files (with smart encoding detection)
    let text = '';
    try {
      // Thử UTF-8 trước (chuẩn phổ biến nhất)
      text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch (e) {
      try {
        // Fallback 1: UTF-16LE (hay gặp ở file txt Windows)
        text = new TextDecoder('utf-16le', { fatal: true }).decode(buffer);
      } catch (e2) {
        // Fallback 2: Windows-1258 (Tiếng Việt) hoặc Windows-1252
        text = new TextDecoder('windows-1258').decode(buffer);
      }
    }

    const isHtml = mimeType === 'text/html' || fileName.endsWith('.html');
    const result = { content: text, isHtml };
    await set(cacheKey, result);
    return result;
  } catch (err: any) {
    // If network fails, try to load from cache
    if (err.message !== 'Unauthorized' && !err.message.includes('không được hỗ trợ')) {
      const cached = await get<{content: string, isHtml: boolean}>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    throw err;
  }
}
