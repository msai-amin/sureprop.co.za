# Vercel Option A: use `sureprop.co.za`, not `sureprop.co.za-production`

Your builds were cloning `github.com/msai-amin/sureprop.co.za-production` (old commit, no Prisma `postinstall`). Point the **same Vercel project** at **`msai-amin/sureprop.co.za`** on branch **`main`**.

## 1. GitHub access

In GitHub → **Settings → Applications → Vercel** (or the Vercel GitHub app install), ensure the **`sureprop.co.za`** repository is allowed (not only `sureprop.co.za-production`).

## 2. Vercel Dashboard (recommended)

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → select the project (e.g. production site).
2. **Settings** → **Git**.
3. If a repo is connected, use **Disconnect** (or **Manage** → disconnect `sureprop.co.za-production`).
4. **Connect Git Repository** → **GitHub** → choose **`msai-amin/sureprop.co.za`**.
5. **Production Branch**: `main`.
6. **Root Directory**: leave **empty** (this repo’s app lives at the repo root).
7. Save, then **Deployments** → **Redeploy** the latest deployment (or push a commit to `main`).

## 3. Vercel CLI (alternative)

From this folder (`cpt-property/`):

```bash
vercel login
vercel link
```

Select the **existing** Vercel project when prompted.

Then connect the main repo:

```bash
vercel git disconnect
vercel git connect https://github.com/msai-amin/sureprop.co.za.git
```

If `disconnect` is not needed, run only `vercel git connect` with the URL above.

## 4. After switching

Confirm the next build log shows:

`Cloning github.com/msai-amin/sureprop.co.za (Branch: main, Commit: …)`

and that `npm run build` succeeds (Prisma client is generated in `postinstall`).
