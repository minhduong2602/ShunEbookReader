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
  if (
    process.env.AUTH_ID && process.env.AUTH_PASSWORD &&
    id === process.env.AUTH_ID && password === process.env.AUTH_PASSWORD
  ) {
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
          Delimiter: "/",
        });
        const data = await s3.send(command);
        
        const books = (data.CommonPrefixes || []).map((prefixObj, idx) => {
          const rawPrefix = prefixObj.Prefix || "";
          const bookName = rawPrefix.endsWith("/") ? rawPrefix.slice(0, -1) : rawPrefix;
          return {
            id: encodeURIComponent(bookName),
            name: bookName,
            mimeType: "application/vnd.google-apps.folder",
          };
        });

        (data.Contents || []).forEach(file => {
          if (file.Key?.endsWith("/") && file.Key !== "/") {
            const bookName = file.Key.slice(0, -1);
            if (!books.find(b => b.name === bookName)) {
              books.push({
                id: encodeURIComponent(bookName),
                name: bookName,
                mimeType: "application/vnd.google-apps.folder",
              });
            }
          }
        });

        const rootFiles = (data.Contents || [])
          .filter(file => !file.Key?.endsWith("/") && (file.Key?.endsWith(".txt") || file.Key?.endsWith(".docx") || file.Key?.endsWith(".html") || file.Key?.endsWith(".htm")))
          .map(file => {
            const key = file.Key || "";
            let mimeType = "text/plain";
            if (key.endsWith(".docx")) {
              mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            } else if (key.endsWith(".html") || key.endsWith(".htm")) {
              mimeType = "text/html";
            }
            return {
              id: encodeURIComponent(key),
              name: key,
              mimeType,
            };
          });

        return res.json([...books, ...rootFiles]);
      } catch (r2Err: any) {
        console.error("R2 failed to list books:", r2Err);
        return res.status(500).json({ error: `Cloudflare R2 Error: ${r2Err.message}` });
      }
    }
    
    // Local fallback
    const items = fs.readdirSync(LOCAL_NOVELS_DIR, { withFileTypes: true });
    const books = items
      .filter((item) => item.isDirectory())
      .map((item) => ({
        id: encodeURIComponent(item.name),
        name: item.name,
        mimeType: "application/vnd.google-apps.folder",
      }));
      
    const rootFiles = items
      .filter((item) => item.isFile() && item.name.match(/\.(txt|docx|html|htm)$/i))
      .map((item) => {
        let mimeType = "text/plain";
        if (item.name.endsWith(".docx")) {
          mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else if (item.name.endsWith(".html") || item.name.endsWith(".htm")) {
          mimeType = "text/html";
        }
        return {
          id: encodeURIComponent(item.name),
          name: item.name,
          mimeType,
        };
      });

    return res.json([...books, ...rootFiles]);
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
          .map((file, idx) => {
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
        return {
          id: btoa(encodeURIComponent(key)),
          name: item.name,
          mimeType: mimeType,
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
