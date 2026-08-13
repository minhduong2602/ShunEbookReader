# ShunEbookReader

ShunEbookReader is a beautiful, self-hosted web-based e-book reader and bookshelf manager designed with a warm, cozy aesthetic. 

## Key Features

- **Cozy Bookshelf**: Organize your library with a responsive grid layout using a custom warm-beige design system.
- **Rich Reading Experience**: Custom reader with adjustable font settings, multiple reading themes, and progress tracking.
- **Flexible Formats**: Seamlessly view novels and documents, powered by custom parsers (including Mammoth for `.docx` and custom Markdown renderers).
- **Hybrid Storage Support**: Store your library in **Cloudflare R2** (S3-compatible object storage) or fall back automatically to local file storage.
- **Secure Access**: Simple, credential-based authentication for private reading sessions.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS, Lucide React, Zustand (State Management)
- **Backend**: Node.js & Express, TypeScript, Multer, AWS S3 SDK
- **Bundler & Tooling**: Vite, esbuild, tsx

## Quick Start

### 1. Prerequisites
Ensure you have Node.js and npm (or Bun) installed.

### 2. Environment Setup
Copy `.env.example` to `.env` and fill in the required environment variables:
```bash
cp .env.example .env
```
*Note: If Cloudflare R2 variables are not provided, the application will default to local storage.*

### 3. Installation
Install dependencies:
```bash
npm install
# or
bun install
```

### 4. Development Server
Run the Express backend and Vite dev server:
```bash
npm run dev
```

### 5. Production Build
Build and start the production application:
```bash
npm run build
npm run start
```
