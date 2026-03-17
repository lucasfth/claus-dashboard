# claus-webinterface

Real-time personal dashboard for the Claus AI assistant.

**Stack:** Nuxt 3 + Convex + Tailwind CSS

## Features

- **Feed** — real-time activity stream from Claus (Telegram replies, cron jobs, GitHub actions)
- **Context** — editable notes that Claus reads as extra context each session
- **Jobs** — live view of scheduled cron jobs, synced from the Zenfone

## Setup

### 1. Convex project

```bash
bun install
bunx convex dev
```

This creates a Convex deployment and generates `convex/_generated/` locally.

### 2. Convex environment variables

In the [Convex dashboard](https://dashboard.convex.dev) → your deployment → **Settings → Environment Variables**:

```
BRIDGE_SECRET=<generate: openssl rand -hex 32>
```

### 3. GitHub OAuth app

1. [GitHub Developer Settings](https://github.com/settings/developers) → **New OAuth App**
2. Homepage URL: `https://your-vercel-app.vercel.app`
3. Callback URL: `https://your-vercel-app.vercel.app/auth/github`
4. Copy Client ID and Secret

### 4. Local `.env`

```bash
cp .env.example .env
```

Fill in:
- `NUXT_PUBLIC_CONVEX_URL` — from Convex dashboard
- `NUXT_OAUTH_GITHUB_CLIENT_ID` / `NUXT_OAUTH_GITHUB_CLIENT_SECRET` — from step 3
- `NUXT_SESSION_PASSWORD` — run `openssl rand -hex 32`

### 5. Local dev

```bash
bun run dev
```

### 6. Vercel deploy

```bash
bunx vercel
```

Set the same env vars in Vercel project settings. For the GitHub OAuth callback URL, use your Vercel domain.

## Bridge

The `claus_bridge.py` script (in the `claus2` project on the Zenfone) syncs Claus's activity logs and jobs to Convex. Configure it at `.claude/claudeclaw/bridge_config.json`:

```json
{
  "convex_http_url": "https://your-deployment.convex.cloud",
  "bridge_secret": "<same BRIDGE_SECRET from Convex env>"
}
```

Runs automatically every 10 minutes via claudeclaw cron, or manually:

```bash
python3 /home/zen/claus2/claus_bridge.py
```

## API endpoints (for bridge)

All require `x-bridge-secret` header.

| Method | Path | Body |
|--------|------|------|
| POST | `/pushActivity` | `{type, summary, details?}` |
| POST | `/pushJobs` | `[{name, schedule, prompt}]` |
| GET | `/getContext` | — |

Types: `telegram` \| `cron` \| `github` \| `briefing` \| `misc`
