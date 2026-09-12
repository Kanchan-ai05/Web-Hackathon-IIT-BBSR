# 🚀 Guild Quest Deployment Guide

Comprehensive step-by-step instructions to deploy the **Life RPG** stack to production on **MongoDB Atlas** (Database), **Render** (Backend API), and **Vercel / Netlify** (Frontend Client).

---

## 🗄️ Step 1: MongoDB Atlas Setup (Cloud Database)

1. Navigate to [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign in or create a free account.
2. Click **Create a Deployment** and select the **M0 Free** cluster tier.
3. Choose your preferred cloud provider (AWS / GCP) and nearest region.
4. Set a Cluster Name (e.g., `guild-cluster`) and click **Create Deployment**.
5. **Database Access (User Authentication)**:
   - Go to **Security** $\rightarrow$ **Database Access** $\rightarrow$ **Add New Database User**.
   - Select **Password Authentication**.
   - Create a username (e.g., `guild_admin`) and a secure password.
   - Set privileges to **Read and write to any database**. Click **Add User**.
6. **Network Access (IP Whitelist)**:
   - Go to **Security** $\rightarrow$ **Network Access** $\rightarrow$ **Add IP Address**.
   - Click **Allow Access From Anywhere** (`0.0.0.0/0`) so that Render server containers can connect freely. Click **Confirm**.
7. **Obtain Connection String**:
   - Go to **Database** $\rightarrow$ **Connect** $\rightarrow$ **Drivers** (Node.js).
   - Copy the SRV URI. It looks like:
     ```
     mongodb+srv://guild_admin:<password>@guild-cluster.xxxxx.mongodb.net/liferpg?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your database user password and ensure `/liferpg` is in the database path.

---

## ⚙️ Step 2: Deploy Backend to Render

1. Sign in to [render.com](https://render.com).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Connect your GitHub repository containing the Life RPG code.
4. Configure the service:
   - **Name**: `life-rpg-server`
   - **Region**: Nearest to your users (e.g., Oregon, Frankfurt, Singapore).
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. **Add Environment Variables**:
   Under the **Environment** tab, click **Add Environment Variable** and enter:
   | Key | Value | Notes |
   |:---|:---|:---|
   | `NODE_ENV` | `production` | Enables production security & logging |
   | `PORT` | `5000` | Render maps port dynamically |
   | `MONGODB_URI` | `mongodb+srv://...` | Your Atlas connection string from Step 1 |
   | `JWT_SECRET` | *(64-char random hex string)* | Secret for signing auth tokens |
   | `JWT_EXPIRES_IN`| `7d` | Token validity |
   | `CLIENT_URL` | `https://your-app.vercel.app,https://your-app.netlify.app` | Comma-separated frontend domains |
6. Click **Create Web Service**.
7. Once deployed, Render provides your public URL:
   `https://life-rpg-server.onrender.com`.
   Verify health by visiting: `https://life-rpg-server.onrender.com/api/health`.

---

## ⚡ Step 3A: Deploy Frontend to Vercel

1. Sign in to [vercel.com](https://vercel.com).
2. Click **Add New...** $\rightarrow$ **Project** and import your GitHub repository.
3. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Select `client` (or use the root `vercel.json`).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   Add:
   | Key | Value |
   |:---|:---|
   | `VITE_API_BASE_URL` | `https://life-rpg-server.onrender.com/api` |
5. Click **Deploy**. Vercel will build and assign a production URL (e.g., `https://life-rpg-guild.vercel.app`).
6. Update your Render backend `CLIENT_URL` environment variable with this URL to ensure CORS headers match.

---

## 🌐 Step 3B: Deploy Frontend to Netlify

### Option 1: Git-Connected Automated Deployment
1. Sign in to [netlify.com](https://netlify.com).
2. Click **Add new site** $\rightarrow$ **Import an existing project** $\rightarrow$ **GitHub**.
3. Select your repository.
4. Netlify will detect the `netlify.toml` in the repository root:
   - **Base directory**: *(leave blank or `client`)*
   - **Build command**: `npm run build --prefix client`
   - **Publish directory**: `client/dist`
5. **Environment Variables**:
   Under **Site configuration** $\rightarrow$ **Environment variables**, add:
   - `VITE_API_BASE_URL` = `https://life-rpg-server.onrender.com/api`
6. Click **Deploy site**.

### Option 2: Netlify CLI Instant Deploy (Used in this setup)
From your terminal:
```bash
# Build the client
npm run build --prefix client

# Deploy live with public link
npx netlify-cli deploy --dir client/dist --prod
```

---

## 🔒 Verification Checklist

- [x] **Zero localhost in production**: All API requests read `VITE_API_BASE_URL` dynamically.
- [x] **CORS headers**: Backend accepts requests from `.vercel.app` and `.netlify.app`.
- [x] **Database connection**: MongoDB Atlas whitelist set to `0.0.0.0/0`.
- [x] **SPA Routing**: `_redirects` and `vercel.json` rewrite non-file routes to `/index.html`.
- [x] **Rate Limiting**: Express rate limiters protect auth routes from credential stuffing.
- [x] **Health Check**: `/api/health` monitors database connectivity.
