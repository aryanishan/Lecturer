# StudyShelf 🎨 — Design System & UI Specification

> A comprehensive specification of the Neo-Brutalist design system, typography hierarchy, visual metaphors, color theory, component geometry, and interactive patterns across StudyShelf.

---

## 🏛️ 1. Design Philosophy & Aesthetic

StudyShelf is designed around the principles of **Neo-Brutalism** (also known as Retro-Brutalism). Rather than relying on soft drop shadows, glassy blurs, or ultra-clean minimalist white-space, the interface draws inspiration from:

1. **Tactile Physical Metaphors**: Physical stationery, index cards, graph/grid engineering paper, physical folder tabs, and push buttons.
2. **High-Contrast Geometry**: Thick, unrelenting solid borders (`2.5px solid #000000`) paired with sharp `4px 4px 0px #000000` offset shadows.
3. **Intentional Playfulness & Utility**: Punchy pastel accents (Cyber Yellow, Hot Pink, Mint Teal, Lavender Purple) balanced against a warm cream canvas (`#f4efe6`).
4. **Mechanical Micro-Interactions**: Direct tactile feedback where buttons and cards physically depress and translate on hover/active states, mimicking physical pushbuttons.
5. **Legibility & Hierarchy**: Expressive geometric headers with disciplined monospace labels, data badges, and clean sans-serif body text.

---

## 🎨 2. Color Palette & Semantic Variables

### Core Light Mode Palette
```css
:root {
  /* Surfaces & Canvas */
  --bg-canvas:        #f4efe6;   /* Warm, physical newsprint/cream canvas */
  --bg-sidebar:       #f4efe6;   /* Unified tonal sidebar */
  --bg-topbar:        #f4efe6;   /* Sticky header background */
  --bg-card:          #ffffff;   /* Pure white card face for strong border contrast */
  --bg-card-hover:    #fafafa;   /* Subtly lifted card hover state */
  --bg-input:         #ffffff;   /* Clean input background */

  /* Neo-Brutalist Color Accents */
  --neo-yellow:       #f5d547;   /* Hero banner canvas, warning badges, highlights */
  --neo-yellow-light: #fff8d6;   /* Highlighted lecture hover, warning alerts */
  --neo-pink:         #ff6b6b;   /* Brand logo, primary CTA buttons, active states */
  --neo-pink-light:   #ff7782;   /* Secondary pink accents */
  --neo-green:        #4ecdc4;   /* Progress bars, user avatar box, success alerts */
  --neo-green-light:  #e6f9f7;   /* Success container backgrounds */
  --neo-purple:       #b8a9e8;   /* Motto card, input tab badge, tags */
  --neo-purple-light: #f1edfb;   /* Subtle lavender tints */
  --neo-blue:         #5b9bd5;   /* Secondary badges & info highlights */
  --neo-coral:        #ff8a65;   /* Accent pill tags & chart lines */
  --neo-red:          #e74c3c;   /* Delete buttons, destructive actions, errors */

  /* Borders & Hard Shadows */
  --border-thick:     2.5px solid #000000;
  --border-thin:      2.0px solid #000000;
  --border-subtle:    1.0px solid #000000;
  --shadow-brutal:    4px 4px 0px #000000;
  --shadow-brutal-sm: 2px 2px 0px #000000;
  --shadow-brutal-lg: 6px 6px 0px #000000;
  --shadow-brutal-hover: 5px 5px 0px #000000;
}
```

### Dark Mode Semantic Tokens
Instead of a simple mathematical color inversion, StudyShelf's Dark Mode is an intentional **Midnight Slate** palette that preserves high readability and eliminates night-time glare while sustaining crisp brutalist borders:

```css
[data-theme="dark"] {
  color-scheme: dark;

  /* Midnight Surfaces */
  --bg-canvas:        #11131a;   /* Deep midnight navy canvas */
  --bg-sidebar:       #171a24;   /* Slate charcoal sidebar */
  --bg-topbar:        #171a24;   /* Slate charcoal topbar */
  --bg-card:          #202431;   /* Elevated dark card surface */
  --bg-card-hover:    #292e3d;   /* Hover state highlight */
  --bg-input:         #171a24;   /* Recessed input box */

  /* Typography & Line Tokens */
  --dark-text:        #f7f8fc;   /* Clean high-contrast white */
  --dark-muted:       #b9c0d0;   /* Readable secondary slate text */
  --dark-border:      #737c95;   /* Crisp steel-gray outline */
  --dark-shadow:      #080a10;   /* Pitch black drop shadow */

  /* Borders & Shadows */
  --border-thick:     2.0px solid var(--dark-border);
  --border-thin:      1.5px solid var(--dark-border);
  --border-subtle:    1.0px solid #4e566b;
  --shadow-brutal:    4px 4px 0px var(--dark-shadow);
  --shadow-brutal-sm: 2px 2px 0px var(--dark-shadow);
  --shadow-brutal-lg: 6px 6px 0px var(--dark-shadow);
}
```

---

## 🔤 3. Typography System

The application combines four distinct font families loaded via Google Fonts to establish clear functional boundaries:

| Font Family | CSS Variable | Weights | Primary Usage |
|---|---|---|---|
| **Chakra Petch** | `--font-display` | 600, 700, 800, 900 | High-impact headings, Hero titles, Logo text, Metric numbers, Section headers |
| **Plus Jakarta Sans** | `--font-sans` | 500, 600, 700, 800 | Playlist card titles, lecture names, body copy, general paragraph text |
| **Space Mono** | `--font-mono` | 400, 700 | Badges, pills, metadata, input boxes, keyboard shortcuts, buttons, statistics |
| **Silkscreen** | `--font-pixel` | 400, 700 | Pixel art badge icons, retro code graphics (`</>`), thumbnail center art |

### Type Scale Breakdown
- **Hero Display Title**: `clamp(2.4rem, 5vw, 3.1rem)` / `line-height: 0.95` / `font-weight: 900` / uppercase
- **Page Titles (`h1`)**: `2.0rem` / `font-weight: 900` / uppercase / letter-spacing `-0.01em`
- **Section Titles (`h2`)**: `1.55rem` / `font-weight: 900` / uppercase
- **Card Titles**: `0.95rem` / `font-weight: 800` / `line-height: 1.3`
- **Eyebrow Headers**: `0.80rem` / `font-weight: 700` / `letter-spacing: 0.06em` / uppercase
- **Badges & Pills**: `0.70rem` - `0.75rem` / `font-family: Space Mono` / `font-weight: 700`
- **Body & Notes Text**: `0.85rem` - `0.88rem` / `line-height: 1.5`

---

## 📐 4. Borders, Elevation & Tactile Physics

### 1. Solid Outlines
Every visual element (buttons, cards, badges, inputs, avatar chips) has an explicit solid boundary. No borderless floating elements exist.
- Primary Containers & Hero: `2.5px solid #000000`
- Controls, Cards, Badges: `2.0px solid #000000`

### 2. Hard Offset Drop Shadows
Shadows use **0px blur radius** to create a sharp, physical paper-cutout or mechanical push-key appearance:
- Standard Shadow: `box-shadow: 4px 4px 0px #000000;`
- Sub-element Shadow: `box-shadow: 2px 2px 0px #000000;`
- Hero & Focus Shadow: `box-shadow: 6px 6px 0px #000000;`

### 3. Button Physics (Depress & Lift)
Interactive elements feel springy and tangible:
```css
/* Rest state */
.btn {
  transform: translate(0, 0);
  box-shadow: 2px 2px 0px #000000;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

/* Hover: Element lifts up and to the left, shadow expands */
.btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0px #000000;
}

/* Active / Click: Element depresses down and to the right, shadow collapses */
.btn:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0px #000000;
}
```

---

## 📄 5. Textures, Patterns & Visual Metaphors

### 1. Graph Paper / Engineering Grid
The canvas and hero banner utilize an infinite repeating 24px x 24px grid texture that reinforces the concept of an engineer's notebook:
```css
background-image: 
  linear-gradient(rgba(0, 0, 0, 0.07) 1px, transparent 1px),
  linear-gradient(90deg, rgba(0, 0, 0, 0.07) 1px, transparent 1px);
background-size: 24px 24px;
```

### 2. Physical Folder Tab Metaphor
The Hero Input area uses a tab-index design. The purple label (`ADD NEW PLAYLIST`) is styled like an overlapping folder tab:
- Positioned above the white input box with `margin-bottom: -2px`
- Bottom border is set to `none`
- Higher `z-index: 3` so it visually merges into the main card body.

### 3. Sunburst Rays & Burst Accents
To convey retro comic-book energy:
- **Hero Sunburst**: Three angled black hatch lines (rotated `-30deg`, `0deg`, `+30deg`) located at the top right of the hero illustration.
- **Section Burst Rays**: Three stacked horizontal tick marks placed directly before the `RECENTLY ADDED` section title.

---

## 🖥️ 6. Page-by-Page Design Specifications

---

### A. Public Landing Page (`/`)

Designed as an engaging introduction that communicates the core value proposition:

1. **Public Topbar**:
   - Left: StudyShelf logo (pink rounded play icon + Chakra Petch title).
   - Center: Subtitle pill (`Turn YouTube into your Study Space.`).
   - Right: Sun/Moon theme toggle, "Sign in" text button, and high-visibility "Create account" pill with arrow icon.
2. **Hero Copy**:
   - Step chain pill badge: `Organize → Learn → Track → Grow` with alternating pastel backgrounds (Yellow, Pink, Mint, Lavender).
   - Headline: `Your learning, all in one place.` in 5rem Chakra Petch with italicized outline text.
   - Dual Call-to-Action buttons with active push states.
3. **Interactive Preview Mockup**:
   - A tilted Neo-Brutalist card representing the in-app player with a 68% progress badge, verified lecture checkmarks, and a sample study note.

---

### B. Authentication Screen (`/login`)

A balanced **3-column split-panel** design:

```text
┌─────────────────┬─────────────────────────┬───────────────────────┐
│                 │                         │  [Tilted YT Card]     │
│  WELCOME BACK!  │   ┌─────────────────┐   │       \ -10°          │
│                 │   │  SIGN IN        │   │                       │
│  • Organize     │   ├─────────────────┤   │  [Learning Space Card]│
│  • Learn        │   │  Email Input    │   │       / +5°           │
│  • Track        │   │  Password Input │   │                       │
│  • Grow         │   │  [Submit CTA]   │   │  [Tilted Sticky Notes]│
│                 │   └─────────────────┘   │                       │
└─────────────────┴─────────────────────────┴───────────────────────┘
```

1. **Left Welcome Column**:
   - Giant display title with two-tone styling (`WELCOME` in solid black, `Back!` in transparent stroke with 2px black outline).
   - Step chain tags with individual borders.
   - Tilted yellow memo badge (`Learn without distractions`) rotated at `-14deg`.
2. **Center Authentication Card**:
   - White brutalist container with `box-shadow: 7px 9px 0 #000`.
   - Top segmented bar with mode toggle ("Sign in" / "Create account").
   - Input fields with left-aligned icons (`Mail`, `Lock`) and password visibility toggle (`Eye` / `EyeOff`).
   - Full-width pink submit button with tactile hover physics.
3. **Right Illustration Area**:
   - **Tilted YouTube Card**: Mini mockup rotated at `-10deg` with red YouTube badge and placeholder lecture rows.
   - **Learning Space Card**: Rotated at `+5deg` with colored progress bars (Purple 42%, Green 16%, Pink 62%).
   - **Post-it Sticky Notes**: Yellow and lavender memo notes rotated at contrasting angles.

---

### C. Application Dashboard (`HomePage`)

The central logged-in command center:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [▶] StudyShelf          [🔍 Search playlists... / ]     [☀️] [A Email] │
├───────────────┬────────────────────────────────────────────────────────┤
│ 🏠 Home       │ ┌────────────────────────────────────────────────────┐ │
│ 📑 Playlists  │ │ YOUR STUDY SPACE —                                 │ │
│ 🤍 Favorites  │ │ MAKE EVERY LECTURE COUNT.     [YouTube] -> [Shelf] │ │
│ 📝 Notes      │ │ ┌─────────┐                                        │ │
│ 📊 Progress   │ │ │ADD LIST │                                        │ │
│ ⚙️ Settings   │ │ └─────────┴─────────────────────────────┐          │ │
│               │ │ 🔗 Paste YouTube playlist link... [Load]│          │ │
│ ┌───────────┐ │ │ ⚡ No ads   🔒 Free to use   👥 Learners│          │ │
│ │MY LEARNING│ │ └─────────────────────────────────────────┘          │ │
│ │  ((32%))  │ ├──────────────────────────────────────────────────────┤ │
│ └───────────┘ │ 彡 RECENTLY ADDED                          [View all]│ │
│ ┌───────────┐ │ ┌──────────┐ ┌──────────┐ ┌──────────┐               │ │
│ │ORGANIZE   │ │ │   DSA    │ │   </>    │ │  [Brain] │               │ │
│ │LEARN GROW │ │ │ 150 vids │ │ 120 vids │ │ 80 vids  │               │ │
│ └───────────┘ │ └──────────┘ └──────────┘ └──────────┘               │ │
└───────────────┴────────────────────────────────────────────────────────┘
```

#### 1. Topbar
- **Height**: `64px` fixed height, sticky top (`z-index: 100`), bottom thick border.
- **Brand Cluster**: Pink square icon with centered play triangle + Chakra Petch `StudyShelf` logotype.
- **Global Search Bar**: Centered, bordered input with a search icon and a keyboard shortcut tag (`K` or `/`) inside a tactile pill.
- **Right Action Cluster**:
  - Theme toggle button (Sun/Moon switch with 1px tactile click).
  - User profile badge: Mint green square with user initial + bold monospace email label + down chevron.

#### 2. Left Sidebar (Navigation & Metrics)
- **Width**: `220px` fixed rail with thick right border.
- **Nav Items**: Home, My Playlists, Favorites, Notes, Progress, Settings.
  - Active item styled in vibrant pink (`--neo-pink`) with thick border and hard shadow (`3px 3px 0 #000`).
- **`MY LEARNING` Progress Box**:
  - White container with brutalist shadow.
  - SVG Circular progress gauge (`80px x 80px`) with yellow arc stroke (`#f5d547`), centered bold percentage text.
  - Summary metric label (`3 of 9 playlists completed`).
- **Bottom Motto Card**:
  - Lavender purple container (`--neo-purple`) with stacked display words: `ORGANIZE`, `LEARN`, `GROW` and a bold forward arrow (`→`).

#### 3. Yellow Hero Section
- **Canvas**: High-contrast Cyber Yellow (`#f5d547`) with grid paper texture and heavy shadow (`6px 6px 0px #000`).
- **Eyebrow**: Monospace tracking label (`YOUR STUDY SPACE —`).
- **Headline**: Massive 3.1rem Chakra Petch headline (`MAKE EVERY LECTURE COUNT.`).
- **Input Container**:
  - Purple folder tab (`ADD NEW PLAYLIST`) attached directly to the white card.
  - White input bar with link icon, clean monospace placeholder, and pink `+ Load Playlist` action button.
  - Benefit pills below input: `⚡ No ads`, `🔒 Free to use`, `👥 Built for learners`.
- **Right Hand-Drawn Cards Illustration**:
  - Tilted white YouTube card with red play badge.
  - Curved connecting arrow leading to the "My Playlists" study shelf mockup.
  - Angular sunburst rays shooting out of the corner.

#### 4. Recently Added & Playlist Cards Grid
- **Header**: Black burst rays (`彡`), uppercase title, horizontal rule stretching across the screen, and white "View all →" button.
- **Card Anatomy**:
  - **Thumbnail Canvas (`125px` height)**: Distinct header art per topic:
    - *DSA*: Pink background with bold typography and wave outlines.
    - *Web Development*: Mint green background with pixelated `</>` code typography.
    - *Machine Learning*: Lavender background with retro pixelated Brain SVG.
  - **Top Badges**: Black video count pill on the left (`150 videos`), white 3-dots action button on the right.
  - **Card Body**: Course title in Plus Jakarta Sans, channel author in muted mono font, and a colored progress bar tracking watched lectures.

---

### D. Learning Ladder View (`/ladder`)

A dedicated study sequence planner:

1. **Two-Panel Workflow**:
   - **Left Library Rail**: List of all saved playlists with a grip handle icon (`⠿`) indicating draggable state.
   - **Right Ladder Board**: Numbered sequential rungs (`Step 01`, `Step 02`, `Step 03`).
2. **Drop Zones**:
   - Dashed brutalist drop zones allowing users to place a course at the beginning, between steps, or at the end.
   - Step cards show course title, channel author, total video count, and a quick remove button.

---

### E. Distraction-Free Video Player (`/player`)

Designed specifically for intense focus and note-taking:

```text
┌────────────────────────┬──────────────────────────────────────────────────┐
│ NOW STUDYING           │ ← LIBRARY        [✓ Mark complete]           [✕] │
│ DSA Bootcamp           ├──────────────────────────────────────────────────┤
│ ────────────────────── │                                                  │
│ Course Progress: 45%   │           ┌──────────────────────────┐           │
│ [█████████░░░░░░░░░░░] │           │                          │           │
│                        │           │   16:9 YouTube Player    │           │
│ 01. Array Basics   [✓] │           │     (No Ads / Clean)     │           │
│ 02. Two Pointers   [✓] │           │                          │           │
│ 03. Binary Search  [▶] │           └──────────────────────────┘           │
│ 04. Linked Lists       │   04:12 / 18:30 [====================] 23%       │
│ 05. Recursion          ├──────────────────────────────────────────────────┤
│ 06. Dynamic Prog       │ 📝 LECTURE NOTES              ❓ ASK A DOUBT     │
│                        │ [ Markdown text editor... ]  [ Submit question ] │
└────────────────────────┴──────────────────────────────────────────────────┘
```

1. **Fixed Left Course Sidebar (`340px`)**:
   - Top header with playlist title and quick theme toggle.
   - Course progress bar with percentage readout.
   - Scrollable lecture list where each row displays lecture index, completion checkmark, and active playback indicator.
2. **Main Theater Stage**:
   - **Player Topbar**: "← Library" back link and green "Mark Complete" pill button.
   - **Video Frame**: 16:9 aspect ratio bordered video container with brutalist drop shadow.
   - **Live Watch Progress Tracker**: Shows elapsed minutes/seconds against total duration with a synchronized green progress fill.
3. **Dual Study Panels**:
   - **Lecture Notes Panel**: Clean monospace textarea automatically keyed to the active video ID with instant "Save Note" feedback.
   - **Doubt Resolution Drawer**: Collapsible Q&A form where students can log questions and doubts regarding complex lecture topics.

---

### F. Global Notes & Progress Views

1. **Notes View**:
   - Masonry/grid layout of all notes recorded across all courses.
   - Each card features a thick yellow left border accent, course name tag, lecture title, and readable monospace note body.
2. **Progress View**:
   - Top metrics grid with 4 brutalist stat cards:
     - Overall Course Completion %
     - Total Playlists Tracked
     - Lectures Watched
     - Study Notes Written
   - Detailed per-course progress breakdown with colored bar meters.

---

## 📱 7. Responsive Breakpoints & Adaptive Layout

The interface cleanly adapts across mobile, tablet, and desktop viewports:

| Breakpoint | Target Devices | Layout Adjustments |
|---|---|---|
| **`> 1120px`** | Desktop & Large Screens | Dual-column hero with hand-drawn art, 3-column auth screen, persistent 220px sidebar. |
| **`900px - 1120px`** | Small Laptops & Tablets (Landscape) | Hero banner collapses to single column (art stacks beneath input); auth illustrations hidden. |
| **`650px - 900px`** | Tablets (Portrait) | Sidebar collapses into a slide-over mobile drawer; topbar hamburger icon appears; player sidebar stacks above video. |
| **`< 650px`** | Mobile Phones | Search bar collapses into search icon; hero headline scales to 2.2rem; auth screen becomes single-column; padding reduces to 16px. |

---

## 🕹️ 8. Component Design Tokens Quick Reference

```css
/* Card Container */
border: 2.5px solid #000000;
background: #ffffff;
box-shadow: 4px 4px 0px #000000;

/* Primary Button */
background: #ff6b6b;
color: #000000;
border: 2px solid #000000;
box-shadow: 2px 2px 0px #000000;
font-family: 'Space Mono', monospace;
font-weight: 800;

/* Active Nav Item */
background: #ff6b6b;
border: 2px solid #000000;
box-shadow: 3px 3px 0px #000000;
color: #000000;

/* Tag / Badge */
border: 2px solid #000000;
box-shadow: 1px 1px 0px #000000;
padding: 4px 12px;
font-family: 'Space Mono', monospace;
font-size: 0.75rem;
font-weight: 700;
```

