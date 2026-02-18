# EmailAI — Product Flow Guide

A non-technical guide explaining how the EmailAI system works, step by step.

---

## What Does EmailAI Do?

EmailAI is a smart email assistant that:
1. **Reads** incoming emails from your inbox
2. **Understands** them using AI and your company's knowledge documents
3. **Drafts** professional responses automatically
4. **Decides** whether the response is good enough to send, or needs a human to review

---

## Core Concepts

### Clients
EmailAI supports **multiple clients** (companies/products). Each client has its own:
- Email inbox and mail server settings
- Knowledge base (product docs, FAQs, policies)
- AI configuration and accuracy rules
- Separate email history

This means one EmailAI installation can serve multiple businesses or departments.

### Knowledge Base
The knowledge base is a collection of documents that teach the AI about your product/service. Better documents = more accurate AI responses. Examples:
- Product documentation
- Pricing sheets
- FAQ documents
- Troubleshooting guides
- Company policies

### Accuracy Score
Every AI-generated response includes an **accuracy percentage** (0–100%) indicating how confident the AI is about its answer:
- **80–100%** → High confidence (green) — AI had strong knowledge base coverage
- **60–79%** → Medium confidence (amber) — AI found some relevant info
- **Below 60%** → Low confidence (red) — AI recommends human review

### Accuracy Threshold
You set a threshold (e.g., 75%). When the AI's confidence is:
- **Above threshold** → Response is auto-drafted, ready for review or auto-send
- **Below threshold** → Email is automatically escalated to a human agent

---

## Product Flow — Step by Step

```
┌──────────────┐
│ 1. CONFIGURE │
└──────┬───────┘
       ↓
┌──────────────────┐
│ 2. UPLOAD DOCS   │
│   Knowledge Base │
└──────┬───────────┘
       ↓
┌──────────────────┐
│ 3. FETCH EMAILS  │
│   From IMAP      │
└──────┬───────────┘
       ↓
┌──────────────────┐
│ 4. PROCESS EMAIL │
│   AI + Knowledge │
└──────┬───────────┘
       ↓
  ┌────┴────┐
  │Accuracy │
  │ Check   │
  └────┬────┘
   ┌───┴───┐
   ↓       ↓
┌──────┐ ┌──────────┐
│DRAFT │ │ ESCALATE │
│Email │ │ to Human │
└──┬───┘ └──────────┘
   ↓
┌──────┐
│ SEND │
└──────┘
```

### Step 1: Set Up a Client
Go to **Clients** → **New Client**. Enter the company/department name and description.

### Step 2: Configure Email Settings
Go to **Configuration** and set up:
- **Email Filter**: Choose to process `Unread`, `Read`, or `All` emails
- **IMAP Settings**: Your incoming mail server (host, port, credentials)
- **SMTP Settings**: Your outgoing mail server for sending replies
- **AI Model**: Which OpenAI model to use
- **Accuracy Threshold**: The confidence cutoff (default 75%)

### Step 3: Upload Knowledge Documents
Go to **Knowledge Base** and upload your product documentation:
- **Upload files** (`.txt`, `.md`, `.csv`, `.json`) via drag-and-drop
- **Paste text** directly using the "Add Text" option
- Toggle documents **active/inactive** to control what the AI uses

### Step 4: Fetch Emails
Go to **Inbox** → click **Fetch Emails**. The system connects to your IMAP server and pulls emails based on your filter settings.

### Step 5: Process an Email
Click on any email → click **Process with AI**. The system:
1. Reads the email content
2. Loads all active knowledge base documents for this client
3. Sends both to the AI model
4. Receives a drafted response + accuracy score

### Step 6: Review & Act
Based on the accuracy score:

| Accuracy | What Happens | Your Options |
|----------|-------------|-------------|
| **Above threshold** | Status → "Drafted" | Review → Edit → **Send** |
| **Below threshold** | Status → "Escalated" | Review in **Escalation Queue** → Write response → Send |

You can always:
- **Edit** the drafted response before sending
- **Manually escalate** even if accuracy was high
- **Send** immediately if the draft looks good

### Step 7: Monitor
Use the **Dashboard** to track:
- Total emails processed
- How many are pending, drafted, sent, or escalated
- Average accuracy across all processed emails
- Recent activity log

---

## User Roles (Conceptual)

| Role | What They Do |
|------|-------------|
| **Admin** | Sets up clients, configures email servers, manages knowledge base |
| **Agent** | Reviews AI drafts, handles escalated emails, sends responses |
| **Viewer** | Monitors dashboard and email activity |

*Note: The current version does not have login/auth. All users have full access.*

---

## FAQ

**Q: What happens if the AI can't answer an email?**
A: It generates a response with a low accuracy score. If below your threshold, the email is automatically escalated for human review. The AI always explains why it's not confident.

**Q: Can I use this without an OpenAI API key?**
A: Yes! The system runs in demo/mock mode with sample emails and simulated AI responses. This is great for testing the workflow.

**Q: Do different clients share knowledge documents?**
A: No. Each client has its own isolated knowledge base. Documents uploaded for Client A are never used when processing Client B's emails.

**Q: What file types can I upload to the knowledge base?**
A: Currently `.txt`, `.md`, `.csv`, and `.json` files. You can also paste text directly.

**Q: Can the system automatically send emails without human review?**
A: Yes, there's an "Auto-send above threshold" toggle in Configuration. When enabled, high-confidence responses can be sent automatically. Use with caution.
