# StudyShelf 📚 — YouTube Playlist Lectures Viewer & Study Space

> Turn YouTube into your personal, distraction-free study space. Organize playlists, sequence learning paths, track video progress, and take lecture-specific notes — without ads, comments, or algorithmic rabbit holes.

[![React](https://img.shields.io/badge/Frontend-React_18_%7C_Vite_5-61dafb?logo=react&style=flat-square)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_%7C_Express_4-339933?logo=node.js&style=flat-square)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MySQL_8-4479A1?logo=mysql&style=flat-square)](https://www.mysql.com/)
[![Design](https://img.shields.io/badge/UI_Style-Neo--Brutalist-f5d547?style=flat-square)](./design.md)
[![License](https://img.shields.io/badge/License-MIT-black?style=flat-square)](./LICENSE)

---

## ⚡ Overview

**StudyShelf** (also known as Lecturer) is a dedicated learning portal engineered for students, developers, and lifelong learners who use YouTube courses. Rather than learning inside the distraction-heavy YouTube interface, StudyShelf lets you import complete playlists or individual lectures into a clean, neo-brutalist dashboard.

### Why StudyShelf?
- 🚫 **Zero Distractions**: No recommendation feed, no comments, no algorithmic clickbait.
- 🎯 **Linear Learning Paths**: Build a customized **Learning Ladder** by drag-and-dropping your playlists into an intentional order.
- ⏱️ **Playhead & Progress Tracking**: Remembers exactly how many seconds you have watched across every lecture.
- 📝 **Lecture-Linked Notes**: Write notes directly beside each video, auto-saved and aggregated into a global study notebook.
- 🔄 **Local-First with Cloud Sync**: Instant responsiveness with browser `localStorage`, seamlessly synced with a MySQL/Express cloud backend when signed in.
- 🎨 **Neo-Brutalist Aesthetic**: Hand-crafted high-contrast visual design with custom typography, tactile button states, and instant dark mode.

---

## ✨ Key Features

### 1. Playlist & Video Importer
- Import playlists by **Full URL** (`youtube.com/playlist?list=...`), **Watch URL** (`youtube.com/watch?v=...&list=...`), **Short URL** (`youtu.be/...`), **Individual Video URL**, or **Raw ID**.
- Automatic pagination handles large playlists (> 50 lectures) via YouTube Data API v3.
- Automated course label classification based on topic keywords:
  - `DSA`, `DBMS`, `SQL`, `OS`, `CN`, `OOPS`, `WEB DEV`, `AI / ML`, `PYTHON`, `JAVA`, `JS`, `C`.

### 2. Distraction-Free Video Player
- Custom embedded 16:9 theater view powered by YouTube IFrame API.
- Integrated left drawer with a scrollable lecture list and real-time completion indicators.
- Live watch-time tracking with fine-grained elapsed seconds vs. duration progress bar.
- One-click **Mark Complete / Incomplete** toggle with instant percentage calculation.
- Quick **Library** back navigation to jump back to your dashboard anytime.

### 3. Integrated Study Tools
- **Timestamped & Per-Lecture Notes**: Take notes while listening; notes are keyed to the specific video and playlist.
- **Ask Doubts / Q&A**: Submit questions and study doubts directly within the player interface.
- **Global Notes Notebook**: Review all notes taken across all courses in one searchable, filterable grid view.

### 4. Learning Ladder (Drag-and-Drop Study Plan)
- Design an explicit study roadmap.
- Drag courses from your library onto sequential rungs (`Step 01`, `Step 02`, `Step 03`).
- Re-order or remove steps as your curriculum evolves.

### 5. Dashboard Views
- **Home**: Yellow hero banner with fast import, quick metrics ring, and "Recently Added" playlist carousel.
- **My Playlists**: Complete library of saved courses with action menus (open, favorite, delete).
- **Favorites**: Starred courses for rapid daily access.
- **Notes**: Consolidated view of all notes across your learning journey.
- **Progress**: Statistical breakdown of total videos completed, active playlists, and completion rates.
- **Settings**: Account details, dark/light theme switch, and session management.

### 6. User Authentication & Cloud Sync
- Secure user registration and login using JWT (JSON Web Tokens) with 7-day expiration.
- Password hashing with `bcryptjs` (salt rounds: 12).
- Automatic synchronization queue that pushes local state changes to MySQL whenever online.
- Seamless guest experience: You can try out the app in offline local-storage mode without an account.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 18.3](https://react.dev/) + [Vite 5.4](https://vitejs.dev/)
- **Routing**: [React Router DOM 6.28](https://reactrouter.com/)
- **Icons**: [Lucide React 0.468](https://lucide.dev/)
- **Styling**: Pure Neo-Brutalist CSS System + [Tailwind CSS 3.4](https://tailwindcss.com/)
- **Typography**: Google Fonts ([Chakra Petch](https://fonts.google.com/specimen/Chakra+Petch), [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans), [Space Mono](https://fonts.google.com/specimen/Space+Mono), [Silkscreen](https://fonts.google.com/specimen/Silkscreen))

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Server Framework**: [Express 4.21](https://expressjs.com/)
- **Database Driver**: [MySQL2 3.24](https://github.com/sidorares/node-mysql2) (Connection Pool)
- **Security & Auth**: [JSON Web Token (jsonwebtoken 9.0)](https://github.com/auth0/node-jsonwebtoken), [bcryptjs 2.4](https://github.com/dcodeIO/bcrypt.js), [cors 2.8](https://github.com/expressjs/cors)
- **Configuration**: [dotenv 16.4](https://github.com/motdotla/dotenv)

---

## 📁 Project Structure

```text
Lecturer/
├── package.json              # Root workspace scripts (dev, build, start)
├── README.md                 # Project documentation & setup instructions
├── design.md                 # Visual design system & UI specifications
│
├── frontend/                 # Client React single-page application
│   ├── index.html            # Entry HTML with Google Fonts & meta tags
│   ├── package.json          # Frontend dependencies & Vite scripts
│   ├── vite.config.js        # Vite build & plugin configuration
│   ├── tailwind.config.cjs   # Tailwind styling setup
│   ├── postcss.config.cjs    # PostCSS plugins
│   ├── .env.example          # Frontend environment variables template
│   ├── public/               # Public assets (hero image, favicons)
│   └── src/
│       ├── main.jsx          # React DOM root entry
│       ├── App.jsx           # Core app router, pages, navigation & state
│       ├── auth.jsx          # AuthProvider context & token handling
│       ├── index.css         # Neo-brutalist design system & dark mode CSS
│       ├── services/
│       │   ├── api.js        # REST client with auth bearer injection
│       │   └── youtube.js    # YouTube v3 API fetching & URL parsers
│       └── utils/
│           └── storage.js    # Local-first storage management & sync queue
│
└── backend/                  # REST API server & MySQL database interface
    ├── package.json          # Backend dependencies & dev scripts
    ├── .env.example          # Backend environment variables template
    └── src/
        └── server.js         # Express app, auth routes, DB pool & controllers
```

---

## 🗄️ Database Architecture

The backend utilizes MySQL with a single normalized `users` table storing JSON document state:

```sql
CREATE DATABASE IF NOT EXISTS lecturer;
USE lecturer;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User State Payload (`data` column)
```json
{
  "currentPlaylist": {
    "playlistId": "PLu0W_9lII9agq5TrH9XLIKQvv0iaF2X3w",
    "playlistTitle": "Web Development Bootcamp",
    "channelTitle": "CodeWithHarry",
    "videos": [
      { "videoId": "tVzUXW6siu0", "title": "Introduction to HTML" }
    ],
    "addedAt": 1730419200000
  },
  "savedPlaylists": [ ... ],
  "completedVideos": {
    "PLu0W_9lII9agq5TrH9XLIKQvv0iaF2X3w": [0, 1, 3]
  },
  "favorites": [ "PLu0W_9lII9agq5TrH9XLIKQvv0iaF2X3w" ],
  "notes": {
    "PLu0W_9lII9agq5TrH9XLIKQvv0iaF2X3w": {
      "0": "HTML semantic tags: <header>, <nav>, <main>, <article>"
    }
  },
  "videoProgress": {
    "tVzUXW6siu0": { "watchedSeconds": 482, "duration": 940 }
  },
  "learningLadder": [ "PLu0W_9lII9agq5TrH9XLIKQvv0iaF2X3w" ]
}
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MySQL**: v8.0 or higher (optional if running purely with local storage)
- **YouTube Data API v3 Key** (a default public fallback key is bundled)

---

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/studyshelf.git
cd studyshelf

# Install root, backend, and frontend packages
npm install
npm install --prefix backend
npm install --prefix frontend
```

---

### Step 2: Configure Environment Variables

#### Backend Configuration
Create `backend/.env` based on `backend/.env.example`:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=lecturer
DB_USER=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=super_secret_jwt_random_key_study_shelf_2026
CLIENT_ORIGIN=http://localhost:5173
```

#### Frontend Configuration
Create `frontend/.env` based on `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:4000/api
# Optional: Provide your own YouTube API Key
# VITE_YOUTUBE_API_KEY=AIzaSy...
```

---

### Step 3: Run the Application

#### Option A: Run Both Together (Root workspace)
```bash
# Runs frontend on :5173
npm run dev

# In a separate terminal, start the backend API on :4000
npm run dev:backend
```

#### Option B: Run Services Individually
```bash
# Terminal 1 — Backend API
cd backend
npm run dev

# Terminal 2 — Frontend Application
cd frontend
npm run dev
```

Open your browser at `http://localhost:5173` to start studying!

---

## 📡 API Reference

Base URL: `http://localhost:4000/api`

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/health` | No | Server health check endpoint |
| `POST` | `/auth/register` | No | Create account with `{ email, password }` |
| `POST` | `/auth/login` | No | Authenticate user with `{ email, password }` |
| `GET` | `/data` | **Bearer Token** | Retrieve saved user state (playlists, progress, notes) |
| `PUT` | `/data` | **Bearer Token** | Persist updated user state |

---

## ⌨️ Keyboard Shortcuts & Power Tips

- `Ctrl + K` or `/` : Jump directly into the Global Search bar.
- `Escape` : Close flyout menus, modal drawers, or search focus.
- **Offline Mode**: If the backend database is unreachable, StudyShelf functions completely offline via `localStorage`.

---

## 🎨 Visual Design

StudyShelf uses an authentic **Neo-Brutalist** design language with 2.5px solid black borders, hard offset shadows, high-saturation pastel accents, and responsive layout scaling.

For an in-depth breakdown of colors, typography, component geometry, micro-interactions, and dark mode tokens, read [design.md](./design.md).

---

## 📄 License

This project is open-source and distributed under the **MIT License**.

