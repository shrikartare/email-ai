# EmailAI — Email Automation System

An AI-powered, multi-tenant web application that automates email handling using LLM-generated responses grounded in a per-client knowledge base.

---

## Quick Start

### Prerequisites
- **Node.js** ≥ 18
- **MongoDB** running locally on port 27017 (or a remote URI)
- **OpenAI API key** (optional — the system runs in demo/mock mode without one)

### 1. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment
```bash
cp .env.example server/.env
# Edit server/.env with your MongoDB URI and (optionally) OpenAI key
```

### 3. Start both servers
```bash
# Terminal 1 — Backend (port 5000)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

### 4. Open the app
Navigate to **http://localhost:5173**

---

## Project Structure

```
AIAgent/
├── server/                     # Node.js + Express backend
│   ├── index.js                # Entry point
│   ├── middleware/
│   │   └── clientContext.js    # Multi-tenant scoping middleware
│   ├── models/                 # Mongoose schemas
│   │   ├── Client.js
│   │   ├── Email.js
│   │   ├── KnowledgeDoc.js
│   │   ├── Config.js
│   │   └── Action.js
│   ├── controllers/            # Request handlers
│   │   ├── clientController.js
│   │   ├── emailController.js
│   │   ├── knowledgeController.js
│   │   ├── configController.js
│   │   └── dashboardController.js
│   ├── routes/                 # Express route definitions
│   │   ├── clientRoutes.js
│   │   ├── emailRoutes.js
│   │   ├── knowledgeRoutes.js
│   │   ├── configRoutes.js
│   │   └── dashboardRoutes.js
│   └── services/               # Business logic
│       ├── emailService.js     # IMAP email fetching
│       ├── llmService.js       # OpenAI integration
│       └── smtpService.js      # Email sending
│
├── client/                     # React + TypeScript frontend (Vite)
│   └── src/
│       ├── api/api.ts          # Axios client with auto client-id header
│       ├── types/index.ts      # Shared TypeScript interfaces
│       ├── components/         # Reusable UI components
│       │   ├── Sidebar.tsx
│       │   ├── StatsCard.tsx
│       │   ├── AccuracyGauge.tsx
│       │   ├── Badge.tsx
│       │   └── LoadingSpinner.tsx
│       ├── pages/              # Page components
│       │   ├── Dashboard.tsx
│       │   ├── Inbox.tsx
│       │   ├── EmailDetail.tsx
│       │   ├── KnowledgeBase.tsx
│       │   ├── Configuration.tsx
│       │   ├── EscalationQueue.tsx
│       │   └── ClientManagement.tsx
│       ├── App.tsx
│       ├── main.tsx
│       └── index.css           # Design system
│
├── .env.example
├── .gitignore
└── package.json                # Root workspace scripts
```

---

## Tech Stack

| Layer      | Technology                         |
|------------|------------------------------------|
| Frontend   | React 18 + TypeScript, Vite        |
| Backend    | Node.js, Express                   |
| Database   | MongoDB + Mongoose                 |
| Email      | IMAP (reading), Nodemailer (send)  |
| AI/LLM     | OpenAI API (GPT-4o-mini default)   |
| UI         | Custom CSS design system (dark)    |

---

## Multi-Tenant Architecture

Every data collection is scoped by `clientId`. The frontend sends an `x-client-id` header with every API request; the backend middleware validates and injects it.

```
[Client Switcher] → x-client-id header → [Backend Middleware] → req.clientId
                                                                   ↓
                                                        All DB queries filtered
```

Each client has isolated:
- Email inbox
- Knowledge base documents
- IMAP/SMTP configuration
- LLM settings & accuracy threshold
- Action/audit history

---

## License

MIT
