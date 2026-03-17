# Convex GitHub Actions Setup

To enable the Convex workflow to run in GitHub Actions, you need to add your deployment key as a GitHub secret.

## Steps to Set Up

1. **Get your Convex Deploy Key:**
   - Visit https://dashboard.convex.dev
   - Navigate to your "claus-dashboard" project
   - Go to the "Settings" section (gear icon)
   - Look for "Deploy Key" or "API Keys"
   - Copy the deploy key value

2. **Add it to GitHub Secrets:**
   - Go to your GitHub repository
   - Click "Settings" (top navigation)
   - In the left sidebar, click "Secrets and variables" → "Actions"
   - Click "New repository secret"
   - Name: `CONVEX_DEPLOY_KEY`
   - Value: Paste the deploy key you copied
   - Click "Add secret"

3. **Verify the Workflow:**
   - Push a commit to the `main` branch
   - Go to the "Actions" tab in your GitHub repository
   - You should see the "Convex Sync" workflow running
   - It should complete successfully

## Troubleshooting

If the workflow still fails:
- Ensure the deploy key is correct and hasn't been rotated
- Check that the secret name is exactly `CONVEX_DEPLOY_KEY` (case-sensitive)
- Verify the deployment ID in `.env.local` matches your Convex project
