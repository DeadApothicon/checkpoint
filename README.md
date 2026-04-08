# Checkpoint

A web-based human-in-the-loop interface for reviewing and actioning automation checkpoints. When a workflow reaches a point requiring human judgement, it pauses and creates a ticket in this system. The reviewer then approves it (workflow continues), denies it (workflow halts), or re-prompts it (the AI re-evaluates with additional context).

Built for internal use with [n8n](https://n8n.io/), but the API layer is automation-tool-agnostic — any tool that can make HTTP requests can integrate with it.

## Features

- **Ticket queue** — review pending checkpoints with full context, filter by client
- **Approve / Deny / Re-Prompt** — actions trigger a webhook back to the automation tool
- **Action log** — auditable history of every decision taken
- **Notifications** — in-app badge, browser push, and email alerts on new tickets
- **Settings** — per-user control over notification preferences

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | SQLite via Prisma |
| Auth | NextAuth.js (Credentials) |
| Styling | Tailwind CSS v4 |
| Notifications | Web Push API + Nodemailer |
| Runtime | Node.js 20 |

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Environment Variables

Copy and fill in the required values:

```env
# App
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# API auth (shared key for inbound automation requests)
API_KEY=

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# Web Push (generate with: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com
```

### Database Setup

```bash
npx prisma migrate deploy
```

### Development

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Deployment (Docker)

A `Dockerfile` and `docker-compose.yml` are included for homelab or self-hosted deployment.

1. Create a `.env.production` file with the environment variables above.
2. Build and start the container:

```bash
docker compose up -d
```

The app is served on `127.0.0.1:3000`. Put a reverse proxy (e.g. Caddy, nginx) in front of it for HTTPS.

The SQLite database is persisted to `./data/` on the host via a Docker volume.

## API

Inbound requests from automation tools require an `Authorization` header containing the `API_KEY` value.

### Create a ticket

```
POST /api/tickets
```

```json
{
  "client_id": "acme-ltd",
  "workflow_name": "Customer Quote Generator",
  "title": "Review quote for Acme Ltd — Job #1042",
  "body": "Labour: £480\nMaterials: £320\nTotal: £800",
  "is_ai_generated": true,
  "resume_webhook": "https://n8n.yourdomain.com/webhook/abc123"
}
```

When the reviewer takes action, Checkpoint calls `resume_webhook` with a payload containing `ticket_id` and `action` (`approved`, `denied`, or `re_prompted`). For re-prompts, a `reprompt_text` field is also included.
