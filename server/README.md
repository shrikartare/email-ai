# Backend — Technical Documentation

## Overview

Express.js REST API with MongoDB, serving a multi-tenant email automation system. All tenant data is isolated via a `clientId` foreign key enforced by middleware.

---

## Server Entry Point (`index.js`)

Connects to MongoDB, applies CORS + JSON middleware, mounts routes, and starts on port `5000`.

- **Client routes** (`/api/clients`) are mounted **before** the client context middleware (they don't require a client scope).
- All other `/api/*` routes pass through `clientContext` middleware.

---

## Middleware

### `clientContext.js`

Extracts `x-client-id` from request headers and validates against the `clients` collection.

| Scenario | Response |
|----------|----------|
| Header missing | `400` — "Missing x-client-id header" |
| Client not found | `404` — "Client not found" |
| Client inactive | `403` — "Client is inactive" |
| Valid | Sets `req.clientId` and `req.client`, calls `next()` |

Skips validation for paths starting with `/api/clients`.

---

## Database Models

### Client
| Field | Type | Notes |
|-------|------|-------|
| name | String | Required, trimmed |
| slug | String | Unique, auto-generated from name |
| description | String | Optional |
| isActive | Boolean | Default `true` |

### Email
| Field | Type | Notes |
|-------|------|-------|
| clientId | ObjectId | Indexed, required |
| messageId | String | Used for de-duplication |
| subject, from, to, body | String | Core email fields |
| isRead | Boolean | From IMAP status |
| status | Enum | `pending → processing → drafted/escalated → sent` |
| draftResponse | String | LLM-generated response |
| accuracy | Number | 0–100, LLM confidence score |
| escalationReason | String | Why it was escalated |

Indexes: `{ clientId, status }`, `{ clientId, date }`

### KnowledgeDoc
| Field | Type | Notes |
|-------|------|-------|
| clientId | ObjectId | Indexed |
| title, content | String | Required |
| filename, fileType | String | From uploads |
| isActive | Boolean | Toggle for LLM context inclusion |

### Config (one per client)
IMAP/SMTP credentials, email filter (`read`/`unread`/`all`), LLM model, OpenAI key, accuracy threshold (0–100), auto-send/auto-escalate toggles.

### Action (audit log)
Records every email processing event: `type` (process/draft/send/escalate), `performedBy` (ai/human), accuracy, response text.

---

## API Endpoints

### Clients (no client scope required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/clients` | List all clients |
| POST | `/api/clients` | Create client (auto-creates default config) |
| PUT | `/api/clients/:id` | Update client |
| DELETE | `/api/clients/:id` | Delete client + all associated data |

### Emails (client-scoped)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/emails` | List with filters (`status`, `isRead`, `search`, `page`) |
| POST | `/api/emails/fetch` | Pull emails from IMAP server |
| GET | `/api/emails/:id` | Get single email |
| POST | `/api/emails/:id/process` | Run LLM processing |
| POST | `/api/emails/:id/send` | Send drafted response via SMTP |
| POST | `/api/emails/:id/escalate` | Escalate to human |

### Knowledge Base (client-scoped)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/knowledge` | List docs |
| POST | `/api/knowledge` | Upload (multipart file or JSON `{title, content}`) |
| DELETE | `/api/knowledge/:id` | Delete doc |
| PATCH | `/api/knowledge/:id/toggle` | Toggle active/inactive |

### Config (client-scoped)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/config` | Get config (passwords masked) |
| PUT | `/api/config` | Update config (ignores masked password values) |

### Dashboard (client-scoped)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/stats` | Aggregated counts + avg accuracy |
| GET | `/api/dashboard/actions` | Recent action log |

---

## Services

### `emailService.js`

Connects to IMAP using the client's stored credentials. Searches for emails based on the `emailFilter` config (`UNSEEN`, `SEEN`, or `ALL`). Parses with `mailparser`. De-duplicates by `messageId` before saving.

**Mock mode**: Returns 3 sample emails when IMAP is not configured.

### `llmService.js`

1. Loads the client's **active** knowledge documents
2. Builds a system prompt instructing the LLM to return JSON: `{ response, accuracy, reasoning, suggestedAction }`
3. Calls OpenAI's Chat Completions API (model from client config)
4. Parses the structured response; falls back to raw text with 50% accuracy on parse failure

**Mock mode**: Returns realistic responses with accuracy scores proportional to knowledge base size.

### `smtpService.js`

Sends emails via Nodemailer using client-specific SMTP credentials. Logs to console in mock mode.

---

## Error Handling

- Controllers return appropriate HTTP status codes (400/404/500)
- Email processing resets status to `pending` on failure
- Config update skips masked password placeholders (`••••••••`)
