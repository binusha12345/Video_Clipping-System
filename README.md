# ClipForge AI

> **An AI-powered, copyright-conscious short-form video creator.**
> Transform content you are legally authorized to use into engaging 9:16 vertical clips for YouTube Shorts, Instagram Reels, and TikTok.

---

## ⚠️ Copyright & Rights Disclaimer

**IMPORTANT — Please read before using ClipForge AI:**

ClipForge AI is a **processing tool**, not a copyright bypass tool. It:

- ❌ Does **not** grant copyright permission to use others' content
- ❌ Does **not** make third-party content copyright-free or royalty-free
- ❌ Does **not** guarantee monetization of processed content
- ❌ Does **not** bypass DRM, authentication, paywalls, or private video restrictions
- ✅ **Requires** you to confirm your legal rights before processing any video
- ✅ Is designed for content you **own or are legally authorized** to repurpose

**Using others' YouTube content without permission may violate:**
- YouTube's Terms of Service
- The Copyright Act / DMCA (US)
- EU Copyright Directive
- Your local copyright laws

**You are solely responsible for ensuring legal compliance.**

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Quick Start](#quick-start)
4. [Environment Variables](#environment-variables)
5. [MongoDB Setup](#mongodb-setup)
6. [FFmpeg Configuration](#ffmpeg-configuration)
7. [AI Provider Configuration](#ai-provider-configuration)
8. [YouTube & API Limitations](#youtube--api-limitations)
9. [Copyright Responsibilities](#copyright-responsibilities)
10. [Rights-Safe Workflow](#rights-safe-workflow)
11. [Project Architecture](#project-architecture)
12. [Development](#development)
13. [Testing](#testing)
14. [Production Deployment](#production-deployment)

---

## Features

- 🎯 **AI Clip Detection** — Speech-to-text + LLM analysis identifies 3–5 high-engagement moments
- ✂️ **Clip Editor** — Trim, adjust timing, preview in 9:16 format
- 📝 **Auto Subtitles** — ASS format burned-in via FFmpeg with full style control
- 🎵 **Music Library** — CC0/Public Domain tracks only
- 💧 **Watermark** — Text watermark with position/opacity control
- 🎙️ **AI Voice** — Optional TTS commentary (configurable provider)
- 📱 **9:16 Export** — 1080×1920 H.264/AAC MP4 at 30 FPS
- 🛡️ **Rights Protection** — Mandatory rights confirmation, metadata tracking
- 📊 **Job Tracking** — QUEUED → PROCESSING → COMPLETED → FAILED with SSE progress
- 🔐 **JWT Auth** — Secure user authentication with refresh tokens

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS v4, Zustand, React Router v6 |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | MongoDB, Mongoose |
| **Authentication** | JWT + bcryptjs |
| **Video Processing** | FFmpeg (via `ffmpeg-static` — no manual install needed) |
| **AI (default)** | Mock mode (no API keys needed for dev) |
| **AI (optional)** | OpenAI Whisper/GPT-4/TTS, AssemblyAI, ElevenLabs |
| **Video Download** | yt-dlp (optional, must be installed separately) |
| **Validation** | Zod |
| **Logging** | Winston |

---

## Quick Start

### Prerequisites

- Node.js v18 or higher
- MongoDB (see [MongoDB Setup](#mongodb-setup))
- Git

### 1. Clone and Install

```bash
git clone <repo-url>
cd "Clipping Videos"
npm install          # installs root devDependencies
npm run install:all  # installs server + client dependencies
```

### 2. Configure Environment

```bash
cd server
copy .env.example .env
# Edit .env with your configuration
```

### 3. Start MongoDB

```bash
# Option A: Bundled dev database (recommended, no install needed)
npm run dev:db          # starts a local MongoDB on 127.0.0.1:27017

# Option B: Docker
docker-compose up -d

# Option C: Local MongoDB already running on localhost:27017

# Option D: MongoDB Atlas — set MONGODB_URI in server/.env
# If the configured URI is unreachable, the server automatically falls
# back to the local MongoDB on 127.0.0.1:27017.
```

### 4. Start Development Servers

```bash
# From root directory — starts the dev database, API and client together
npm run dev

# Or start individually:
npm run dev:db       # Local MongoDB on 127.0.0.1:27017
npm run dev:server   # Backend on http://localhost:5000
npm run dev:client   # Frontend on http://localhost:5173

# Ports are already taken by another project? Override them:
PORT=5001 npm run dev:server
API_TARGET=http://localhost:5001 CLIENT_PORT=5174 npm run dev:client
```

### 5. Generate the music library (once)

```bash
npm run music:generate --prefix server
# Synthesises six CC0 tracks into server/storage/music/*.mp3.
# They are generated from scratch (no samples), so they are genuinely CC0.
```

### 6. Open Browser

Navigate to `http://localhost:5173`

---

## Environment Variables

All environment variables are in `server/.env`. See `server/.env.example` for the full template.

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/clipforge` |
| `JWT_SECRET` | JWT signing secret (min 64 chars) | `your-super-secret-key...` |
| `JWT_REFRESH_SECRET` | Refresh token secret (different from above) | `another-secret-key...` |

### AI Providers

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_STT_PROVIDER` | Speech-to-text: `mock`, `openai`, `assemblyai`, `deepgram` | `mock` |
| `AI_LLM_PROVIDER` | Language model: `mock`, `openai` | `mock` |
| `AI_TTS_PROVIDER` | Text-to-speech: `mock`, `openai`, `elevenlabs` | `mock` |
| `OPENAI_API_KEY` | OpenAI API key | _(empty)_ |
| `ASSEMBLYAI_API_KEY` | AssemblyAI API key | _(empty)_ |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | _(empty)_ |

### Storage

| Variable | Description | Default |
|----------|-------------|---------|
| `STORAGE_TYPE` | `local` or `s3` | `local` |
| `LOCAL_STORAGE_PATH` | Local storage directory | `./storage` |
| `MAX_FILE_SIZE_MB` | Maximum upload size | `500` |

---

## MongoDB Setup

### Option A: Docker (Recommended for Development)

```bash
docker-compose up -d mongodb
```

MongoDB will be available at `mongodb://localhost:27017/clipforge`.

### Option B: MongoDB Atlas (Production)

1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Get your connection string
3. Set `MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/clipforge`

### Option C: Local Installation

Install MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/docs/manual/installation/).

---

## FFmpeg Configuration

**FFmpeg is bundled automatically** via the `ffmpeg-static` and `ffprobe-static` npm packages. No manual FFmpeg installation is required.

The bundled FFmpeg binary supports:
- H.264 video encoding (libx264)
- AAC audio encoding
- ASS/SRT subtitle burning
- Complex audio/video filtering

If you want to use a custom FFmpeg installation:
1. Ensure `ffmpeg` and `ffprobe` are in your system PATH
2. Modify `server/src/config/ffmpeg.ts` to use the system binary

---

## AI Provider Configuration

### Mock Mode (Default — No API Keys Required)

By default, all AI providers use mock mode. This generates realistic fake transcripts and clip suggestions for development.

```env
AI_STT_PROVIDER=mock
AI_LLM_PROVIDER=mock
AI_TTS_PROVIDER=mock
```

### OpenAI (Whisper + GPT-4 + TTS)

```env
AI_STT_PROVIDER=openai
AI_LLM_PROVIDER=openai
AI_TTS_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

Install the OpenAI SDK: `npm install openai --prefix server`

### AssemblyAI (STT)

```env
AI_STT_PROVIDER=assemblyai
ASSEMBLYAI_API_KEY=your-key-here
```

Install: `npm install assemblyai --prefix server`

### ElevenLabs (TTS)

```env
AI_TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=your-key-here
```

Install: `npm install @elevenlabs/api --prefix server`

---

## YouTube & API Limitations

### yt-dlp Requirements

YouTube video downloading requires `yt-dlp` to be installed on the system:

**Windows:**
```powershell
winget install yt-dlp.yt-dlp
# OR download from https://github.com/yt-dlp/yt-dlp/releases
```

**Linux/Mac:**
```bash
pip install yt-dlp
# OR: sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
```

### YouTube Terms of Service

> **⚠️ Important:** Downloading YouTube videos may violate [YouTube's Terms of Service](https://www.youtube.com/t/terms) if you do not have permission from the content owner. ClipForge AI requires users to confirm they have the legal right to process content, but cannot enforce or verify these claims. All legal responsibility rests with the user.

### Limitations

- Live streams are not supported (only recorded videos)
- Private videos, age-restricted content, and DRM-protected videos cannot be downloaded
- YouTube may rate-limit or block downloads — this is outside our control
- Content must be publicly accessible

### Recommended: Rights-Safe Mode (Upload Your Own Videos)

The safest workflow is to upload your own videos directly. This completely bypasses YouTube download concerns and ensures you are processing content you own.

---

## Copyright Responsibilities

### What ClipForge AI Does

- Requires explicit rights confirmation before processing any video
- Records rights type, confirmation timestamp, and source URL with each project
- Displays prominent copyright disclaimers throughout the interface
- Provides a Rights-Safe Mode that restricts to user-owned content
- Uses only CC0/Public Domain music in the built-in library
- Never bypasses DRM, authentication, or access controls

### What ClipForge AI Does NOT Do

- Grant copyright permission to use others' content
- Make third-party content copyright-free or royalty-free
- Verify or enforce users' rights claims
- Guarantee monetization of processed content
- Provide legal advice

### Rights Types Explained

| Type | When to Use |
|------|-------------|
| **OWNER** | You created the video and own all rights |
| **LICENSED** | You have a formal license or written permission from the rights holder |
| **CREATIVE_COMMONS** | The video is published under a CC license that permits repurposing |
| **PUBLIC_DOMAIN** | The content has no copyright restrictions (very old content, government works, etc.) |
| **FAIR_USE_CLAIM** | You believe your use qualifies as fair use (consult a lawyer — you accept all risk) |

---

## Rights-Safe Workflow

**The safest way to use ClipForge AI:**

1. **Record your own video** (screen recording, vlog, tutorial, etc.)
2. Upload it via the **Upload Video** option (no YouTube download needed)
3. Select **"I Own This Content"** as your rights type
4. Enable **Rights-Safe Mode**
5. Process, edit, and export without any copyright concerns

This workflow is recommended for all content creators.

---

## Project Architecture

```
Clipping Videos/
├── server/                      # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts           # Zod-validated environment config
│   │   │   ├── db.ts            # MongoDB connection
│   │   │   └── storage.ts       # Local/S3 storage abstraction
│   │   ├── models/
│   │   │   ├── User.ts          # User schema + bcrypt
│   │   │   ├── Project.ts       # Project + embedded clips
│   │   │   └── RenderJob.ts     # Job queue tracking
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   ├── types.ts     # STT/LLM/TTS interfaces
│   │   │   │   ├── factory.ts   # Provider factory (env-based)
│   │   │   │   └── providers/
│   │   │   │       └── mock/    # Mock STT, LLM, TTS (no API keys)
│   │   │   ├── ffmpeg/
│   │   │   │   ├── processor.ts # Trim, vertical convert, render
│   │   │   │   └── subtitles.ts # ASS subtitle generator
│   │   │   ├── youtube/
│   │   │   │   └── downloader.ts # yt-dlp wrapper + rights gate
│   │   │   └── jobs/
│   │   │       ├── queue.ts     # In-memory job queue + SSE
│   │   │       └── worker.ts    # Render pipeline worker
│   │   ├── routes/
│   │   │   ├── auth.ts          # Register, login, refresh
│   │   │   ├── projects.ts      # CRUD + analysis pipeline
│   │   │   ├── render.ts        # Start job, status, SSE stream
│   │   │   └── export.ts        # Download MP4, music library
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT verification
│   │   │   ├── validate.ts      # Zod request validation
│   │   │   └── errorHandler.ts  # Centralized error handling
│   │   └── index.ts             # Express app + startup
│   ├── storage/                 # (created at runtime)
│   │   ├── videos/              # Downloaded/uploaded source videos
│   │   ├── audio/               # Extracted audio for STT
│   │   ├── renders/             # Final rendered MP4 files
│   │   └── thumbnails/          # Video thumbnails
│   ├── .env                     # Your environment config
│   ├── .env.example             # Template
│   └── package.json
│
├── client/                      # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx  # Hero + features + copyright
│   │   │   ├── AuthPage.tsx     # Login / Register
│   │   │   ├── DashboardPage.tsx # URL input + project history
│   │   │   ├── AnalysisPage.tsx # Progress + clip candidates
│   │   │   ├── EditorPage.tsx   # Clip editor (all controls)
│   │   │   └── RenderPage.tsx   # Job progress + download
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   └── RightsConfirmationModal.tsx
│   │   ├── store/
│   │   │   ├── authStore.ts     # JWT + user (Zustand + persist)
│   │   │   ├── projectStore.ts  # Active project + clips
│   │   │   └── editorStore.ts   # Editor configuration
│   │   ├── services/
│   │   │   ├── api.ts           # Axios + token interceptors
│   │   │   └── services.ts      # Auth, project, render services
│   │   ├── index.css            # Design system + component styles
│   │   └── App.tsx              # Router
│   └── package.json
│
├── shared/
│   └── types.ts                 # Shared TypeScript types
│
├── docker-compose.yml           # MongoDB for local dev
├── package.json                 # Root: concurrently dev script
└── README.md
```

---

## Development

### Running in Development Mode

```bash
# Start both server and client
npm run dev

# Server only
npm run dev:server

# Client only
npm run dev:client
```

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register user |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/refresh` | No | Refresh access token |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/projects` | Yes | List user projects |
| GET | `/api/projects/:id` | Yes | Get project details |
| POST | `/api/projects/metadata` | Yes | Fetch video metadata |
| POST | `/api/projects` | Yes | Create + start analysis (YouTube URL) |
| POST | `/api/projects/upload` | Yes | Upload your own video (multipart `video`) + start analysis |
| DELETE | `/api/projects/:id` | Yes | Delete project |
| POST | `/api/render` | Yes | Start render job |
| GET | `/api/render/:jobId` | Yes | Get job status |
| GET | `/api/render/:jobId/progress` | Yes | SSE progress stream |
| GET | `/api/export/:jobId/download` | Yes | Download rendered MP4 |
| GET | `/api/export/music/library` | Yes | List CC0 music tracks |

### Job Status States

```
QUEUED → PROCESSING → COMPLETED
                    ↘ FAILED (retries up to 3 times)
```

### Adding Real AI Providers

1. Set the appropriate environment variable in `server/.env`
2. Install the provider SDK: `npm install openai --prefix server`
3. Create the provider implementation in `server/src/services/ai/providers/<name>/`
4. Add it to the factory in `server/src/services/ai/factory.ts`

---

## Testing

```bash
# Run server tests
npm test --prefix server

# End-to-end smoke test (server must be running on :5001)
npm run test:e2e --prefix server
# Exercises: register → rights gate → metadata → analysis → upload →
# render → authenticated download → SSE auth checks

# TypeScript type-check (server)
npx tsc --noEmit --prefix server

# TypeScript type-check (client)
npx tsc --noEmit --prefix client
```

---

## Production Deployment

### Environment Setup

1. Set `NODE_ENV=production` in server environment
2. Use strong random values for `JWT_SECRET` and `JWT_REFRESH_SECRET` (min 64 chars)
3. Use MongoDB Atlas connection string for `MONGODB_URI`
4. Set `CLIENT_URL` to your production frontend URL
5. Configure real AI providers (OpenAI, AssemblyAI, etc.)

### Build

```bash
npm run build
```

### Process Management

Use PM2 or similar:

```bash
npm install -g pm2
pm2 start server/dist/index.js --name clipforge-api
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        # Required for SSE
        proxy_buffering off;
        proxy_cache off;
    }

    location / {
        root /var/www/clipforge/client/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

### Storage for Production

For production, replace local storage with S3-compatible storage:

1. Set `STORAGE_TYPE=s3` in environment
2. Add S3 credentials to environment variables
3. Implement the S3 adapter in `server/src/config/storage.ts`
   (the `StorageProvider` interface is ready — just implement for S3)

---

## Security Considerations

- All routes are protected with JWT authentication
- Rate limiting: 100 requests per 15 minutes per IP
- File size limits: 500MB maximum
- Passwords hashed with bcrypt (12 rounds)
- CORS restricted to configured origins
- Helmet.js security headers
- Zod input validation on all routes
- Never logs or exposes API keys
- Rights confirmation required before any video processing

---

## License

This project is licensed for personal and commercial use. See LICENSE file.

**Music assets**: All music in the built-in library is CC0 / Public Domain.
**FFmpeg**: Distributed under the LGPL license via `ffmpeg-static`.
**Third-party video content**: All copyright remains with the original creators.

---

*Built with ❤️ for copyright-conscious content creators.*
