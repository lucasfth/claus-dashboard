# Convex GitHub Actions Setup

To enable the Convex workflow to run in GitHub Actions and automatically sync your Convex functions when you push to `main`, you need to add your deployment key as a GitHub secret.

## Quick Setup (Automated)

Run this command from the repository root:

```bash
./scripts/setup-convex-github.sh
```

The script will:
1. Guide you to get your Convex deploy key from the dashboard
2. Automatically add it as a GitHub secret
3. Verify the setup is working

## Manual Setup

If you prefer to add the secret manually:

### 1. Get your Convex Deploy Key

⚠️ **Important:** Copy the full key value, not just the key name!

1. Visit https://dashboard.convex.dev
2. Click on your "claus-dashboard" project
3. Go to **Settings → Authentication**
4. Look for the **API Keys** or **Deploy Keys** section
5. Click the copy icon (📋) next to your key to copy the **full key value**
   - The key should be a long base64-encoded string starting with `eyJ`
   - **NOT** just the key name like `claus-lpaia-dashboard-deploy`

### 2. Add it to GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** (top navigation)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Name: `CONVEX_DEPLOY_KEY`
6. Value: Paste the full deploy key you copied from Convex
7. Click **Add secret**

### 3. Verify the Workflow

1. Push a commit to the `main` branch
2. Go to the **Actions** tab in your GitHub repository
3. You should see the "Convex Deploy" workflow running
4. It should complete successfully

## What the Workflow Does

The "Convex Deploy" workflow (`.github/workflows/convex-dev.yml`):
- Runs automatically on every push to the `main` branch
- Installs dependencies
- Runs `bunx convex deploy --yes` to push your Convex functions to production
- Ensures your Convex deployment is always up-to-date with your code

## Troubleshooting

### Workflow fails with "Please set CONVEX_DEPLOY_KEY to a new key"

This means the secret value was not correct. Check:
- You copied the **full key value** from Convex (long base64 string), not the key name
- The secret name in GitHub is exactly `CONVEX_DEPLOY_KEY` (case-sensitive)
- The secret value doesn't have extra spaces or line breaks

To fix it:
1. Go to https://dashboard.convex.dev → Settings → Authentication
2. Copy the full key value again (click the copy icon)
3. Update the GitHub secret with the correct value
4. Push a new commit to trigger the workflow again

### Other errors

- Check the workflow logs in the GitHub "Actions" tab for detailed error messages
- Verify the deployment ID in `.env.local` matches your Convex project
- Make sure your Convex deployment is active and not in a paused state
