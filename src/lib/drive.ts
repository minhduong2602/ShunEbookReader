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

export async function getFileContent(token: string, fileId: string, mimeType: string): Promise<string> {
  let url = `${DRIVE_API}/files/${fileId}?alt=media`;

  // If it's a Google Doc, export it as HTML
  if (mimeType === 'application/vnd.google-apps.document') {
    url = `${DRIVE_API}/files/${fileId}/export?mimeType=text/html`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to fetch content');
  }

  return res.text();
}
