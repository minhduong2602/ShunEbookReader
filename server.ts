import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

app.post("/api/login", (req, res) => {
  const { id, password } = req.body || {};
  const authId = process.env.AUTH_ID;
  const authPassword = process.env.AUTH_PASSWORD;

  // Strict check if environment variables are explicitly configured
  if (authId && authPassword) {
    if (id === authId && password === authPassword) {
      return res.json({ success: true, token: Buffer.from(`${id}:${password}`).toString('base64') });
    }
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Fallback when AUTH_ID/AUTH_PASSWORD are not set (e.g. Vercel deployment without .env):
  // Allow login for any non-empty ID & password
  if (id && password) {
    return res.json({ success: true, token: Buffer.from(`${id}:${password}`).toString('base64') });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Check if Cloudflare R2 is configured
const isR2Configured = () => {
  return !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
};

app.get("/api/status", async (req, res) => {
  if (!isR2Configured()) {
    return res.json({ r2: false, message: "R2 is not configured. Using local storage." });
  }
  try {
    const s3 = getS3Client();
    await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, MaxKeys: 1 }));
    return res.json({ r2: true, message: "R2 is connected successfully." });
  } catch (err: any) {
    return res.json({ r2: false, error: err.message, message: "R2 is configured but connection failed. Using local storage." });
  }
});

// Lazy S3 client initialization
let s3Client: S3Client | null = null;
function getS3Client() {
  if (!s3Client) {
    if (!isR2Configured()) {
      throw new Error("R2 is not fully configured");
    }
    
    let endpoint = process.env.R2_ENDPOINT || "";
    if (!endpoint.startsWith("http")) endpoint = `https://${endpoint}`;
    // Remove trailing slash or bucket name from endpoint if user accidentally included it
    try {
      const url = new URL(endpoint);
      endpoint = `${url.protocol}//${url.host}`;
    } catch (e) {
      // Ignored
    }

    s3Client = new S3Client({
      endpoint: endpoint,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      region: "auto",
      forcePathStyle: true,
    });
  }
  return s3Client;
}

const BUCKET = process.env.R2_BUCKET_NAME || "";

// Ensure local data folders exist if falling back
const LOCAL_DATA_DIR = process.env.VERCEL ? path.join("/tmp", "data") : path.join(process.cwd(), "data");
const LOCAL_NOVELS_DIR = path.join(LOCAL_DATA_DIR, "novels");
try {
  if (!fs.existsSync(LOCAL_NOVELS_DIR)) {
    fs.mkdirSync(LOCAL_NOVELS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("Failed to create local data directory (expected on Vercel)");
}

// Ensure at least one dummy sample book exists if local storage is completely empty
try {
  const books = fs.readdirSync(LOCAL_NOVELS_DIR);
  if (books.length === 0) {
    const sampleBookDir = path.join(LOCAL_NOVELS_DIR, "Sample Novel");
    fs.mkdirSync(sampleBookDir, { recursive: true });
    fs.writeFileSync(
      path.join(sampleBookDir, "Chapter 1 - Welcome.txt"),
      "Welcome to your brand new R2 Novel Reader!\n\nThis is a sample chapter to get you started. You can upload your own novel files (.txt, .docx, .html) using the upload button on the bookshelf.\n\nEnjoy reading!"
    );
  }
} catch (e) {
  console.error("Failed to create sample book", e);
}

// 1. API: List Books
app.get("/api/books", async (req, res) => {
  try {
    if (isR2Configured()) {
      try {
        const s3 = getS3Client();
        const command = new ListObjectsV2Command({
          Bucket: BUCKET,
        });
        const data = await s3.send(command);
        
        const folderLastModified: Record<string, number> = {};
        const booksMap = new Map<string, { id: string; name: string; mimeType: string; updatedAt: number }>();
        const rootFiles: any[] = [];

        (data.Contents || []).forEach(file => {
          if (!file.Key) return;
          const parts = file.Key.split("/");
          const mtime = file.LastModified ? new Date(file.LastModified).getTime() : 0;

          if (parts.length > 1 && parts[0]) {
            // It's in a folder
            const bookName = parts[0];
            if (!folderLastModified[bookName] || mtime > folderLastModified[bookName]) {
              folderLastModified[bookName] = mtime;
            }
            if (!booksMap.has(bookName)) {
              booksMap.set(bookName, {
                id: encodeURIComponent(bookName),
                name: bookName,
                mimeType: "application/vnd.google-apps.folder",
                updatedAt: mtime
              });
            } else {
              const b = booksMap.get(bookName)!;
              if (mtime > b.updatedAt) {
                b.updatedAt = mtime;
              }
            }
          } else {
            // Root file
            if (!file.Key.endsWith("/") && (file.Key.endsWith(".txt") || file.Key.endsWith(".docx") || file.Key.endsWith(".html") || file.Key.endsWith(".htm"))) {
              let mimeType = "text/plain";
              if (file.Key.endsWith(".docx")) mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
              else if (file.Key.endsWith(".html") || file.Key.endsWith(".htm")) mimeType = "text/html";
              
              rootFiles.push({
                id: encodeURIComponent(file.Key),
                name: file.Key,
                mimeType,
                updatedAt: mtime,
              });
            }
          }
        });

        const books = Array.from(booksMap.values());
        const allItems = [...books, ...rootFiles];
        allItems.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        return res.json(allItems);
      } catch (r2Err: any) {
        console.error("R2 failed to list books:", r2Err);
        return res.status(500).json({ error: `Cloudflare R2 Error: ${r2Err.message}` });
      }
    }
    
    // Local fallback
    const items = fs.readdirSync(LOCAL_NOVELS_DIR, { withFileTypes: true });
    const books = items
      .filter((item) => item.isDirectory())
      .map((item) => {
        const bookDir = path.join(LOCAL_NOVELS_DIR, item.name);
        let maxMtime = fs.statSync(bookDir).mtimeMs;
        try {
          const subFiles = fs.readdirSync(bookDir);
          subFiles.forEach(f => {
            const fStat = fs.statSync(path.join(bookDir, f));
            if (fStat.mtimeMs > maxMtime) maxMtime = fStat.mtimeMs;
          });
        } catch (e) {}
        return {
          id: encodeURIComponent(item.name),
          name: item.name,
          mimeType: "application/vnd.google-apps.folder",
          updatedAt: maxMtime,
        };
      });
      
    const rootFiles = items
      .filter((item) => item.isFile() && item.name.match(/\.(txt|docx|html|htm)$/i))
      .map((item) => {
        let mimeType = "text/plain";
        if (item.name.endsWith(".docx")) {
          mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else if (item.name.endsWith(".html") || item.name.endsWith(".htm")) {
          mimeType = "text/html";
        }
        const fStat = fs.statSync(path.join(LOCAL_NOVELS_DIR, item.name));
        return {
          id: encodeURIComponent(item.name),
          name: item.name,
          mimeType,
          updatedAt: fStat.mtimeMs,
        };
      });

    const allItems = [...books, ...rootFiles];
    allItems.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return res.json(allItems);
  } catch (err: any) {
    console.error("Failed to list books", err);
    return res.status(500).json({ error: err.message || "Failed to list books" });
  }
});

// 2. API: List Chapters in a Book
app.get("/api/books/:bookId/chapters", async (req, res) => {
  try {
    const bookName = decodeURIComponent(req.params.bookId);
    
    // If it's a standalone file
    if (bookName.match(/\.(txt|docx|html|htm)$/i)) {
      let mimeType = "text/plain";
      if (bookName.endsWith(".docx")) {
        mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else if (bookName.endsWith(".html") || bookName.endsWith(".htm")) {
        mimeType = "text/html";
      }
      return res.json([{
        id: btoa(encodeURIComponent(bookName)), // Safe base64 id
        name: bookName,
        mimeType: mimeType,
      }]);
    }

    if (isR2Configured()) {
      try {
        const s3 = getS3Client();
        const prefix = `${bookName}/`;
        const command = new ListObjectsV2Command({
          Bucket: BUCKET,
          Prefix: prefix,
          Delimiter: "/",
        });
        const data = await s3.send(command);
        
        const files = (data.Contents || [])
          .filter(file => file.Key !== prefix && !file.Key?.endsWith("/"))
          .map((file) => {
            const key = file.Key || "";
            const name = key.replace(prefix, "");
            let mimeType = "text/plain";
            if (name.endsWith(".docx")) {
              mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            } else if (name.endsWith(".html") || name.endsWith(".htm")) {
              mimeType = "text/html";
            }
            return {
              id: btoa(encodeURIComponent(key)), // Safe base64 id
              name: name,
              mimeType: mimeType,
              updatedAt: file.LastModified ? new Date(file.LastModified).getTime() : Date.now(),
            };
          });
        return res.json(files);
      } catch (r2Err: any) {
        console.error(`R2 failed to list chapters for ${bookName}:`, r2Err);
        return res.status(500).json({ error: `Cloudflare R2 Error: ${r2Err.message}` });
      }
    }
    
    // Local fallback
    const bookDir = path.join(LOCAL_NOVELS_DIR, bookName);
    if (!fs.existsSync(bookDir)) {
      return res.status(404).json({ error: "Book not found" });
    }
    const items = fs.readdirSync(bookDir, { withFileTypes: true });
    const files = items
      .filter((item) => item.isFile() && !item.name.startsWith("."))
      .map((item) => {
        let mimeType = "text/plain";
        if (item.name.endsWith(".docx")) {
          mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else if (item.name.endsWith(".html") || item.name.endsWith(".htm")) {
          mimeType = "text/html";
        }
        const key = `${bookName}/${item.name}`;
        const filePath = path.join(bookDir, item.name);
        const fStat = fs.statSync(filePath);
        return {
          id: btoa(encodeURIComponent(key)),
          name: item.name,
          mimeType: mimeType,
          updatedAt: fStat.mtimeMs,
        };
      });
    return res.json(files);
  } catch (err: any) {
    console.error("Failed to list chapters", err);
    return res.status(500).json({ error: err.message || "Failed to list chapters" });
  }
});

// 3. API: Get Chapter Content
app.get("/api/chapters/:id/content", async (req, res) => {
  try {
    const key = decodeURIComponent(atob(req.params.id));
    
    if (isR2Configured()) {
      try {
        const s3 = getS3Client();
        const command = new GetObjectCommand({
          Bucket: BUCKET,
          Key: key,
        });
        const data = await s3.send(command);
        if (data.Body) {
          const bytes = await data.Body.transformToByteArray();
          const buffer = Buffer.from(bytes);
          
          let contentType = "text/plain";
          if (key.endsWith(".docx")) {
            contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          } else if (key.endsWith(".html") || key.endsWith(".htm")) {
            contentType = "text/html";
          }
          
          res.setHeader("Content-Type", contentType);
          return res.send(buffer);
        }
      } catch (r2Err: any) {
        console.error(`R2 failed to load content for ${key}:`, r2Err);
        return res.status(500).json({ error: `Cloudflare R2 Error: ${r2Err.message}` });
      }
    }
    
    // Local fallback
    const filePath = path.join(LOCAL_DATA_DIR, key);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Chapter not found" });
    }
    const buffer = fs.readFileSync(filePath);
    let contentType = "text/plain";
    if (key.endsWith(".docx")) {
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (key.endsWith(".html") || key.endsWith(".htm")) {
      contentType = "text/html";
    }
    res.setHeader("Content-Type", contentType);
    return res.send(buffer);
  } catch (err: any) {
    console.error("Failed to get chapter content", err);
    return res.status(500).json({ error: err.message || "Failed to get chapter content" });
  }
});

// 4. API: Upload Novel Chapter
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const { bookName } = req.body || {};
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const sanitizedBookName = bookName ? bookName.trim().replace(/[\\/:*?"<>|]/g, "") : "";
    const fileName = req.body.fileName || Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const key = sanitizedBookName ? `${sanitizedBookName}/${fileName}` : fileName;

    let uploadedToR2 = false;
    if (isR2Configured()) {
      try {
        const s3 = getS3Client();
        const command = new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        });
        await s3.send(command);
        uploadedToR2 = true;
      } catch (r2Err: any) {
        console.warn(`R2 failed to upload ${fileName}, saving locally instead:`, r2Err.message);
      }
    }

    // Always write locally as cache and resilient fallback
    try {
      if (sanitizedBookName) {
        const bookDir = path.join(LOCAL_NOVELS_DIR, sanitizedBookName);
        if (!fs.existsSync(bookDir)) {
          fs.mkdirSync(bookDir, { recursive: true });
        }
        fs.writeFileSync(path.join(bookDir, fileName), req.file.buffer);
      } else {
        fs.writeFileSync(path.join(LOCAL_NOVELS_DIR, fileName), req.file.buffer);
      }
    } catch (e) {
      console.warn("Failed to write uploaded file locally (expected on Vercel):", e);
    }

    return res.json({ success: true, key, uploadedToR2 });
  } catch (err: any) {
    console.error("Upload failed", err);
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
});

// 5. API: Get Sync State
app.get("/api/sync", async (req, res) => {
  const syncKey = "reader_sync_v1.json";
  try {
    if (isR2Configured()) {
      try {
        const s3 = getS3Client();
        const command = new GetObjectCommand({
          Bucket: BUCKET,
          Key: syncKey,
        });
        const data = await s3.send(command);
        if (data.Body) {
          const text = await data.Body.transformToString();
          return res.json(JSON.parse(text));
        }
      } catch (e: any) {
        const errName = e.name || "";
        const errMsg = e.message || "";
        const isNotFound = errName === "NoSuchKey" || 
                           e.$metadata?.httpStatusCode === 404 || 
                           errName.includes("NotFound") || 
                           errMsg.includes("NoSuchKey") || 
                           errMsg.includes("not exist");
        if (isNotFound) {
          console.log("Sync state file not found on R2, checking local");
        } else {
          console.warn("R2 failed to load sync state, falling back to local:", e);
        }
      }
    }
    
    // Local fallback
    const syncPath = path.join(LOCAL_DATA_DIR, syncKey);
    if (fs.existsSync(syncPath)) {
      const text = fs.readFileSync(syncPath, "utf-8");
      return res.json(JSON.parse(text));
    }
    return res.json(null);
  } catch (err: any) {
    console.error("Failed to load sync state", err);
    return res.json(null);
  }
});

// 6. API: Save Sync State
app.post("/api/sync", async (req, res) => {
  const syncKey = "reader_sync_v1.json";
  try {
    const state = req.body || {};
    let savedToR2 = false;
    if (isR2Configured()) {
      try {
        const s3 = getS3Client();
        const command = new PutObjectCommand({
          Bucket: BUCKET,
          Key: syncKey,
          Body: JSON.stringify(state),
          ContentType: "application/json",
        });
        await s3.send(command);
        savedToR2 = true;
      } catch (r2Err: any) {
        console.warn("R2 failed to save sync state, writing locally only:", r2Err.message);
      }
    }
    
    // Always write locally as cache and resilient fallback
    try {
      const syncPath = path.join(LOCAL_DATA_DIR, syncKey);
      fs.writeFileSync(syncPath, JSON.stringify(state), "utf-8");
    } catch (e) {
      console.warn("Failed to write sync state locally (expected on Vercel):", e);
    }

    
    return res.json({ success: true, savedToR2 });
  } catch (err: any) {
    console.error("Failed to save sync state", err);
    return res.status(500).json({ error: err.message || "Failed to save sync state" });
  }
});

// 7. API: Link Preview
app.get("/api/link-preview", async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: "Missing url parameter" });
    }
    
    // We can use a public metadata API or fetch and parse ourselves.
    // Fetching directly and using simple regex/parsing
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });
    
    if (!response.ok) {
      return res.status(400).json({ error: "Failed to fetch URL" });
    }
    
    const html = await response.text();
    
    const getMetaTag = (name: string, html: string) => {
      const match = html.match(new RegExp(`<meta\\s+(?:name|property)=["']${name}["']\\s+content=["']([^"']+)["']`, 'i')) || 
                    html.match(new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+(?:name|property)=["']${name}["']`, 'i'));
      return match ? match[1] : null;
    };
    
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    let title = titleMatch ? titleMatch[1] : url;
    
    // Check og:title
    const ogTitle = getMetaTag("og:title", html);
    if (ogTitle) title = ogTitle;
    
    const description = getMetaTag("og:description", html) || getMetaTag("description", html);
    const image = getMetaTag("og:image", html);
    const siteName = getMetaTag("og:site_name", html);
    
    return res.json({
      title: title.trim(),
      description: description ? description.trim() : null,
      image: image ? (image.startsWith('/') ? new URL(image, url).toString() : image) : null,
      siteName: siteName ? siteName.trim() : null,
      url
    });
  } catch (err: any) {
    console.error("Link preview error:", err);
    return res.status(500).json({ error: "Failed to get link preview" });
  }
});

// 8. API: Gemini AI Chat for Cozy Assistant (With App Context)
app.post("/api/chat", async (req, res) => {
  try {
    const { message, context } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message string is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.json({
        reply: "⚠️ Chưa tìm thấy GEMINI_API_KEY. Bạn chỉ cần thêm `GEMINI_API_KEY=mã_key_của_bạn` vào file `.env` (local) hoặc Vercel Environment Variables để kích hoạt Trợ lý AI Gemini nhé!"
      });
    }

    let contextSummary = "";
    if (context) {
      contextSummary = `
--- DỮ LIỆU TỦ SÁCH CÁ NHÂN CỦA ĐỘC GIẢ ---
- Độc giả: ${context.userName || 'Bạn'}
- Thống kê: Chuỗi đọc ${context.readingStats?.streak || 0} ngày, Tổng thời gian đọc ${context.readingStats?.totalMinutes || 0} phút.
- Sách đọc gần nhất: ${JSON.stringify(context.recentRead || [])}
- Danh sách tác phẩm trong tủ (${context.userBooks?.length || 0} cuốn): ${JSON.stringify(context.userBooks || [])}
- Ghi chú cá nhân gần đây: ${JSON.stringify(context.quickNotes || [])}
------------------------------------------
`;
    }

    const systemInstruction = `Bạn là Cozy Assistant, trợ lý AI đọc sách thông minh và ấm áp của ứng dụng ShunEbookReader.
Bạn ĐÃ ĐƯỢC KẾT NỐI trực tiếp với dữ liệu tủ sách cá nhân thực tế của độc giả (được liệt kê ở trên).
Hãy sử dụng thông tin này để trả lời chính xác, cá nhân hóa khi người dùng hỏi về cuốn sách họ đang đọc, gợi ý cuốn tiếp theo, tóm tắt ghi chú hoặc tra cứu thông tin tủ sách. Trả lời bằng tiếng Việt đầm ấm, tự nhiên.`;

    const contents = [
      {
        role: "user",
        parts: [{ text: `${systemInstruction}\n${contextSummary}\nNgười dùng hỏi: ${message}` }]
      }
    ];

    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-2.0-flash-lite"
    ];

    let replyText = "";
    let lastError = "";

    const cleanKey = apiKey.trim();

    for (const model of modelsToTry) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
      
      try {
        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents })
        });

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không nhận được nội dung từ Gemini.";
          break;
        } else {
          const errBody = await geminiRes.text();
          lastError = `[${model}] HTTP ${geminiRes.status}: ${errBody}`;
          console.warn(`Gemini model ${model} failed:`, lastError);
        }
      } catch (fetchErr: any) {
        lastError = fetchErr.message;
      }
    }

    if (!replyText) {
      return res.json({ 
        reply: `⚠️ Không thể kết nối với các mô hình Gemini (${lastError}). Vui lòng kiểm tra lại GEMINI_API_KEY.` 
      });
    }

    return res.json({ reply: replyText });
  } catch (err: any) {
    console.error("Chat API error:", err);
    return res.status(500).json({ reply: "Đã có lỗi kết nối khi xử lý yêu cầu chat." });
  }
});

// Vite & Static file handler
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const viteModule = "vite";
    const { createServer: createViteServer } = await import(viteModule);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
