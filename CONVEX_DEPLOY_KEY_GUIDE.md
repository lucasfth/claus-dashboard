# How to Generate/Get Your Convex Deploy Key

The `CONVEX_DEPLOY_KEY` is a credential that allows external tools (like GitHub Actions) to deploy to your Convex backend without requiring interactive login.

## Finding or Creating Your Deploy Key

### Option 1: In the Convex Dashboard (Recommended)

If you already have a deploy key (like `claus-lpaia-dashboard-deploy`), you need to get the actual key value:

1. Go to https://dashboard.convex.dev
2. Select your **claus-dashboard** project
3. Click **Settings** (gear icon) in the left sidebar
4. Click **Authentication**
5. You should see your existing deploy key with a name like `claus-lpaia-dashboard-deploy`

#### To Get the Key Value:

If you just created the key, the value should have been shown in a popup (a long base64 string). If you don't have it:

**Option A: Copy it if visible**
- Look for a **"Copy"** button or icon next to the key
- Click it to copy the full key value to your clipboard

**Option B: Regenerate the key**
- Click the **⚙️ (Settings)** or **🔄 (Regenerate)** button next to the key name
- Convex will generate a new key value
- A modal will appear with the new key - **copy this immediately** (you won't be able to see it again)

### Option 2: Using the Convex CLI

If you're using the local Convex CLI, you might be able to authenticate and deploy without needing a separate deploy key:

```bash
bunx convex deploy --yes
```

This uses your local authentication (stored in `~/.convex/config.json`) and doesn't require `CONVEX_DEPLOY_KEY`.

However, for **GitHub Actions**, you **must** use `CONVEX_DEPLOY_KEY` since the runner doesn't have your local auth config.

## Key Format

The deploy key value should be:
- A **long string** (50+ characters)
- **Base64-encoded**
- Usually starts with `eyJ` (which is base64 for `{"v`)
- Example format (not real): `eyJ2MiI6ImVhN2I1MTk3MzQxMTQ1YzViZDY4MWI3M2U1NTZmNmRmIn0=`

## Common Issues

### "I see the key name but not the value"

**Solution**: The key name (like `claus-lpaia-dashboard-deploy`) is NOT the key value. You need to:
1. Click the **Copy** icon next to the key in the dashboard
2. Or, regenerate the key (⚙️ icon) and copy the new value from the modal

### "The key value was never shown"

**Solution**: Regenerate the key:
1. Go to Settings → Authentication
2. Click the ⚙️ or 🔄 icon next to your key
3. Click "Regenerate" or "Create new key"
4. Copy the new value from the modal that appears
5. **Important**: You must copy it immediately - Convex won't show it again

### "Where exactly is the copy button?"

In the Convex dashboard (Settings → Authentication):
- You should see a table with your keys
- Each row has your key name on the left
- On the right side, there are action icons:
  - 📋 **Copy** (click this to copy the key value)
  - 🔧 **Settings** (for advanced options)
  - ❌ **Delete** (to remove the key)

## Using the Key in GitHub

Once you have the key value:

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. **Name**: `CONVEX_DEPLOY_KEY`
5. **Value**: Paste the full key value you copied (the long base64 string)
6. Click **Add secret**

Now the workflow will work when you push to `main`!

## Getting Help

If you can't find where to get the deploy key:
1. Check the Convex Discord: https://convex.dev/community
2. Visit the Convex docs: https://docs.convex.dev
3. Create an issue: https://github.com/get-convex/convex-js/issues
