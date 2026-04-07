# Checkpoint Interface — Technical Specification

## 1. Project Overview

A web-based human-in-the-loop interface for reviewing and actioning automation checkpoints. When a workflow reaches a point requiring human judgement, it pauses and creates a "ticket" in this system. The reviewing user evaluates the ticket and either approves it (workflow continues), denies it (workflow halts), or re-prompts it (AI re-evaluates with additional context).

### MVP Scope
- Single authenticated user (internal use)
- n8n as the primary automation backend, communicated with via a generic API layer
- Core ticket management: Approve, Deny, Re-Prompt
- In-app, browser push, and email notifications
- Action log for auditing

### Post-MVP Scope (do not build now, but design for)
- Multi-user support with role-based access control
- Client assignment — restrict users to specific clients' tickets
- Passkey / 2FA authentication
- White-labelled or shared access for clients

---

## 2. Architecture

### Overview

```
Automation Tool (n8n) <──> REST API Layer <──> Next.js App <──> SQLite (via Prisma)
```

The API layer is automation-tool-agnostic. n8n communicates with it using standard HTTP requests. Any future automation tool (custom, Make, Zapier, etc.) can do the same without changes to the interface.

### Key Principle
The system must not contain any n8n-specific logic. All communication is via generic REST endpoints. n8n workflows are responsible for constructing the correct API payloads and handling webhook responses.

---

## 3. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js (App Router) | React, built-in API routes, file-based routing |
| Database | SQLite via Prisma | Lightweight for MVP, Prisma enables easy migration to Postgres later |
| Auth | NextAuth.js | Handles session management; extensible for OAuth/passkeys post-MVP |
| Styling | Tailwind CSS | Utility-first, easy to apply brand tokens |
| Real-time | Server-Sent Events or polling | For live ticket updates without a separate WebSocket server |
| Notifications | Web Push API (browser) + Nodemailer (email) | OS-level browser notifications + optional email |

---

## 4. Database Schema

### `tickets` table

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key, generated on creation |
| `client_id` | String | Identifier for the associated client |
| `workflow_name` | String | Name of the paused workflow |
| `title` | String | Human-readable summary of what needs reviewing |
| `body` | Text | Content to review — plain text for MVP |
| `is_ai_generated` | Boolean | Controls whether Re-Prompt action is shown |
| `status` | Enum | `pending`, `approved`, `denied`, `re_prompted` |
| `reprompt_text` | Text \| null | Populated when user submits a re-prompt |
| `resume_webhook` | String (URL) | Webhook URL called by the system when actioned |
| `created_at` | DateTime | When the ticket was received |
| `actioned_at` | DateTime \| null | When the user took action |

> **On status:** `pending` tickets appear in the active queue. All other statuses appear only in the log view. The log is not a separate table — it is a filtered query on the same `tickets` table.

### `users` table (MVP: single row)

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `email` | String | Login identifier |
| `password_hash` | String | Hashed password |
| `email_notifications` | Boolean | User preference, default `true` |
| `push_subscriptions` | JSON | Stores Web Push subscription objects |

> **Schema note:** Design this table with future multi-user support in mind. Avoid any assumptions that only one user exists in the application logic.

---

## 5. API Specification

All endpoints are prefixed `/api`. Requests from automation tools must include an `Authorization` header with a pre-shared API key (stored as an environment variable for MVP).

---

### Inbound Endpoints (called by automation tools)

#### `POST /api/tickets`
Creates a new checkpoint ticket and pauses the workflow.

**Request body:**
```json
{
  "client_id": "acme-ltd",
  "workflow_name": "Customer Quote Generator",
  "title": "Review quote for Acme Ltd — Job #1042",
  "body": "Labour: £480\nMaterials: £320\nTotal: £800\n\nPayment terms: 30 days.",
  "is_ai_generated": true,
  "resume_webhook": "https://n8n.yourdomain.com/webhook/abc123"
}
```

**Response:**
```json
{
  "ticket_id": "uuid-here",
  "status": "pending"
}
```

---

### Outbound Webhooks (called by the system back to the automation tool)

When a user actions a ticket, the system calls the `resume_webhook` URL stored on the ticket.

#### Approve
```json
{
  "ticket_id": "uuid-here",
  "action": "approved"
}
```

#### Deny
```json
{
  "ticket_id": "uuid-here",
  "action": "denied"
}
```

#### Re-Prompt
```json
{
  "ticket_id": "uuid-here",
  "action": "re_prompted",
  "reprompt_text": "The labour cost should reflect a 4-hour job, not 8."
}
```

> **n8n handling:** The receiving n8n webhook node should branch on the `action` field to determine how the workflow continues. This logic lives in n8n, not in this system.

---

## 6. Application Pages & UI

### `/login`
- Email and password form
- Session persists via NextAuth cookie
- Redirect to `/` on success

---

### `/` — Ticket Queue (Active)

**Header bar**
- App name / logo
- Notification bell with unread badge count
- User avatar / logout

**Toolbar**
- Client filter dropdown — options populated from distinct `client_id` values in the database. Default: "All clients"
- Ticket count label — e.g. "4 open tickets"

**Ticket list**
Each ticket is displayed as a card containing:
- **Title** (prominent)
- **Client** and **Workflow name** (subdued, secondary line)
- **Body content** — plain text, scrollable if long
- **Timestamp** — relative (e.g. "23 minutes ago"), with absolute on hover
- **Action buttons:**
  - `Approve` — green, always present
  - `Deny` — red, always present
  - `Re-Prompt` — amber, only shown when `is_ai_generated` is `true`

**Re-Prompt interaction**
When the user clicks Re-Prompt, the card expands inline to show a text area with a "Submit Re-Prompt" button. Submitting this:
1. Sends the webhook with `action: re_prompted` and the user's text
2. Updates the ticket status to `re_prompted`
3. Removes the card from the active list

**Empty state**
When no pending tickets exist, show a clear empty state message — e.g. "No tickets to review. You're all caught up."

---

### `/log` — Action Log

Displays all non-pending tickets in reverse chronological order.

**Columns / fields per entry:**
- Title
- Client
- Workflow name
- Action taken (`Approved`, `Denied`, `Re-prompted`) — colour-coded
- Actioned at (absolute timestamp)

**Filters:**
- Client dropdown (same as queue page)
- Action type filter: All / Approved / Denied / Re-prompted

No further actions are available from the log. It is read-only.

---

### `/settings` — User Settings

- **Email notifications toggle** — enables/disables outbound emails on new ticket arrival
- **Browser notifications toggle** — prompts the browser permission request on first enable; stores subscription for push delivery
- *(Post-MVP placeholder section)* — User management, client assignments, role configuration

---

## 7. Notification System

### In-App
- A notification bell in the header shows a live count of unread pending tickets
- Count updates in real time (polling every 30 seconds is acceptable for MVP; SSE preferred if straightforward)
- Clicking the bell navigates to `/`

### Browser Push (Web Push API)
- On first enabling in Settings, the browser prompts for OS-level notification permission
- When a new ticket is created via `POST /api/tickets`, the server sends a push notification to all stored subscriptions
- Notification content: ticket title and client name
- Clicking the notification opens the app at `/`

### Email
- Controlled by the `email_notifications` preference per user
- Sent when a new ticket arrives via `POST /api/tickets`
- Content: ticket title, client, workflow name, and a direct link to the queue
- Plain HTML template — no heavy styling required for MVP
- Sent via Nodemailer (SMTP credentials stored in environment variables)

---

## 8. Authentication

### MVP
- Email + password via NextAuth.js (Credentials provider)
- Single user, credentials stored in the `users` table with bcrypt hashing
- Session duration: 8 hours, re-authentication required after

### Post-MVP (design for, do not build)
- Passkey support (WebAuthn)
- TOTP-based 2FA (authenticator app)
- Multiple users with role definitions: `admin`, `reviewer`
- Client scoping — a `reviewer` can only see tickets where `client_id` matches their assigned clients

---

## 9. Environment Variables

```
# App
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# API auth (shared key for inbound automation requests)
API_KEY=

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# Web Push
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
```

---

## 10. Branding & Styling

Apply the Lancs AI visual identity via Tailwind CSS variables. This is low priority for MVP but should be configured from the start to avoid rework.

### Colour Tokens

| Token | Value | Usage |
|---|---|---|
| `brand-red` | `#C0374A` | Primary actions, accents, logo |
| `brand-red-dark` | `#9D1F2A` | Hover states, dark mode variant |
| `brand-offwhite` | `#F0EAE2` | Page backgrounds, card backgrounds |
| `brand-near-black` | `#1C1616` | Body text, headings |

### Typography
- Align with whatever typeface choices are finalised for the main website
- If not yet decided: a clean, readable sans-serif for UI elements (avoid system font stacks where possible)

### Tone
- The interface should feel professional and approachable — not cold or overly technical
- Avoid dashboard-startup aesthetics; aim for something a non-technical SMB owner could hand to a member of staff and have them understand immediately

---

## 11. Build Order (Suggested)

1. Initialise Next.js project with Tailwind, Prisma, NextAuth
2. Define and migrate the database schema
3. Build the inbound `POST /api/tickets` endpoint with API key auth
4. Build the login page and session handling
5. Build the ticket queue page (`/`) with static mock data
6. Wire queue page to live database
7. Implement Approve, Deny, Re-Prompt actions and outbound webhooks
8. Build the log page (`/log`)
9. Add in-app notification count (polling)
10. Add email notifications
11. Add browser push notifications
12. Build settings page with notification toggles
13. Apply brand tokens and refine styling
14. End-to-end test with a real n8n workflow

---

## 12. Out of Scope for MVP

- Multi-user authentication and roles
- Client assignment to users
- Passkey or 2FA authentication
- Ticket content richer than plain text (tables, structured data, file attachments)
- White-labelling for client deployment
- Analytics or reporting beyond the action log
