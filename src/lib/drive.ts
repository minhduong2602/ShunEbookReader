import { get, set } from 'idb-keyval';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';

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
