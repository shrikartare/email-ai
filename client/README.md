# Frontend — Technical Documentation

## Overview

React 18 + TypeScript single-page application built with Vite. Uses a dark-mode-first custom CSS design system with glassmorphism aesthetics.

---

## Tech & Dependencies

| Package | Purpose |
|---------|---------|
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client with interceptors |
| `lucide-react` | Icon library |
| `react-hot-toast` | Toast notifications |

---

## Architecture

```
src/
├── api/api.ts            # Axios instance (auto-attaches x-client-id)
├── types/index.ts        # Shared TypeScript interfaces
├── components/           # Reusable UI building blocks
├── pages/                # Route-level page components
├── App.tsx               # Router + layout shell
├── main.tsx              # Entry point
└── index.css             # Complete design system
```

### Client Context

The active client ID is stored in `localStorage('activeClientId')`. The Axios interceptor reads it and attaches `x-client-id` to every request header. When the user switches clients via the sidebar dropdown, a `clientChanged` custom event fires — all pages listen and reload their data.

---

## Pages

### Dashboard (`/`)
Stats grid (total, pending, drafted, sent, escalated, avg accuracy) + recent activity table. Auto-refreshes on client switch.

### Inbox (`/inbox`)
Paginated email list with:
- **Search** — filters by subject, from, body
- **Read/Unread filter** — toggle buttons
- **Status filter** — pending / drafted / sent / escalated
- Click row → navigates to email detail

### Email Detail (`/inbox/:id`)
Two-column layout:
- **Left**: Full email body with metadata (from, to, date)
- **Right**: Action panel
  - "Process with AI" button (for pending emails)
  - Accuracy gauge (circular SVG with color coding)
  - Editable draft response textarea
  - Send / Escalate action buttons

### Knowledge Base (`/knowledge`)
- Drag-and-drop file upload (`.txt`, `.md`, `.csv`, `.json`)
- Inline text document creation form
- Document list with active/inactive toggle and delete
- All scoped to the active client

### Configuration (`/config`)
Forms for:
- Email filter (read/unread/all)
- IMAP settings (host, port, user, password, TLS toggle)
- SMTP settings (host, port, user, password)
- LLM settings (API key, model selector, accuracy threshold slider)
- Auto-escalate / auto-send toggle switches

### Escalation Queue (`/escalations`)
Table of escalated emails showing accuracy score, escalation reason, with View and Send actions.

### Client Management (`/clients`)
Card grid of all clients with create/edit modal and delete (with cascade warning).

---

## Components

| Component | Props | Description |
|-----------|-------|-------------|
| `Sidebar` | — | Nav links, client switcher, logo |
| `StatsCard` | `icon, value, label, color` | Animated metric card |
| `AccuracyGauge` | `value, size?` | Circular SVG progress ring |
| `Badge` | `status` | Color-coded status pill |
| `LoadingSpinner` | — | Centered animated spinner |

---

## Design System (`index.css`)

CSS custom properties define the entire palette:

| Token | Value | Use |
|-------|-------|-----|
| `--bg-primary` | `#0a0e1a` | Page background |
| `--bg-secondary` | `#111827` | Sidebar, modals |
| `--bg-card` | `rgba(17,24,39,0.8)` | Cards with blur |
| `--accent-blue` | `#3b82f6` | Primary actions |
| `--accent-green` | `#22c55e` | Success / high accuracy |
| `--accent-red` | `#ef4444` | Danger / escalation |

All interactive elements include hover transitions. Cards use `backdrop-filter: blur(10px)` for glassmorphism. Responsive breakpoints at 1024px and 768px.

---

## Adding a New Page

1. Create `src/pages/NewPage.tsx`
2. Add route in `App.tsx`
3. Add nav link in `Sidebar.tsx`
4. Use existing CSS classes (`.card`, `.btn`, `.form-group`, etc.)
