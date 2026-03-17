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

Set these env vars in Vercel Project Settings → Environment Variables:
- `NUXT_PUBLIC_CONVEX_URL`
- `NUXT_CONVEX_HTTP_URL` (or `CONVEX_SITE_URL`)
- `BRIDGE_SECRET`
- `NUXT_OAUTH_GITHUB_CLIENT_ID`
- `NUXT_OAUTH_GITHUB_CLIENT_SECRET`
- `NUXT_SESSION_PASSWORD`

This project runs Convex codegen automatically before build (`prebuild: convex codegen`), so Vercel should use the normal build command:

```bash
bun run build
```

For GitHub OAuth callback URL, use your Vercel domain:
`https://<your-domain>/auth/github`

### 7. GitHub Actions Convex sync (push to `main`)

This repo includes `.github/workflows/convex-dev.yml`, which runs on every push to `main` and executes:

```bash
bunx convex dev --once
```

`--once` is the CI-safe version of `convex dev` (it runs the sync and exits instead of staying open).

In GitHub, add this repository secret so the workflow can authenticate with Convex:

- `CONVEX_DEPLOY_KEY` — create it in Convex dashboard → your deployment → **Settings → Deploy Keys** (or API keys, depending on UI)

If the workflow fails with `Please set CONVEX_DEPLOY_KEY ...`, the key is missing, expired, or from a different deployment. Generate a fresh key and re-save it in GitHub:

```bash
gh secret set CONVEX_DEPLOY_KEY --body "<paste-new-convex-deploy-key>"
```

## GitHub Actions: Automatic Convex Sync

The repository includes a GitHub Actions workflow that automatically syncs your Convex functions whenever you push to the `main` branch.

### Setup (one-time)

Run the setup script:

```bash
./scripts/setup-convex-github.sh
```

This will:
1. Guide you to get your Convex deploy key from https://dashboard.convex.dev
2. Add it as a GitHub secret (`CONVEX_DEPLOY_KEY`)
3. Enable the automatic workflow

After setup, any push to `main` will automatically run `bunx convex dev --once` to sync your Convex functions.

For detailed instructions, see [CONVEX_SETUP.md](./CONVEX_SETUP.md).

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
