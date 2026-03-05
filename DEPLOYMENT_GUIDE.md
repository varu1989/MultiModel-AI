# JaipurEyeVision Studio - Deployment & API Key Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [API Key Generation](#api-key-generation)
3. [Railway Deployment (Backend)](#railway-deployment-backend)
4. [Vercel Deployment (Frontend)](#vercel-deployment-frontend)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Local Development Setup](#local-development-setup)

---

## Prerequisites

Before deploying, ensure you have:
- GitHub account (for code repository)
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)
- Razorpay account (https://razorpay.com)
- Emergent Platform account (for Universal LLM Key)

---

## API Key Generation

### 1. Emergent Universal LLM Key (Required)

The Emergent LLM Key provides access to GPT-5.2, Gemini Nano Banana, Sora 2, and OpenAI TTS/Whisper.

**Steps:**
1. Go to [Emergent Platform](https://emergentagent.com)
2. Sign in to your account
3. Navigate to **Profile** → **Universal Key**
4. Click **Generate Key** or copy your existing key
5. Add balance: **Profile** → **Universal Key** → **Add Balance**
6. Your key looks like: `sk-emergent-xxxxxxxxxxxx`

**Note:** Enable auto top-up to avoid service interruptions.

---

### 2. Razorpay API Keys (Required for Payments)

**Steps:**
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Sign up / Sign in to your account
3. Navigate to **Settings** → **API Keys**
4. Click **Generate Test Keys** (for testing) or **Generate Live Keys** (for production)
5. Copy both:
   - **Key ID**: `rzp_test_xxxxxxxxxxxx` or `rzp_live_xxxxxxxxxxxx`
   - **Key Secret**: `xxxxxxxxxxxxxxxxxxxxxxxx`

**Important:** 
- Use **Test Keys** during development
- Switch to **Live Keys** only when going to production
- Never expose your Key Secret in frontend code

---

### 3. MongoDB Connection String

**Option A: Railway MongoDB (Recommended)**
- Railway will auto-generate this when you add MongoDB service

**Option B: MongoDB Atlas (Alternative)**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster
3. Go to **Database** → **Connect** → **Connect your application**
4. Copy the connection string: `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/dbname`

---

## Railway Deployment (Backend)

### Step 1: Push Code to GitHub

```bash
# Create a new repository on GitHub, then:
cd /path/to/jaipureyevision
git init
git add .
git commit -m "Initial commit - JaipurEyeVision Studio"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/jaipureyevision-backend.git
git push -u origin main
```

### Step 2: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Connect your GitHub account if not already connected
5. Select your `jaipureyevision-backend` repository
6. Railway will auto-detect Python and start deployment

### Step 3: Add MongoDB Service

1. In your Railway project, click **+ New**
2. Select **Database** → **MongoDB**
3. Railway will provision MongoDB and add `MONGO_URL` automatically

### Step 4: Configure Environment Variables

1. Click on your backend service
2. Go to **Variables** tab
3. Add the following variables:

```
MONGO_URL=<auto-populated by Railway MongoDB>
DB_NAME=jaipureyevision
CORS_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24
EMERGENT_LLM_KEY=sk-emergent-your-key-here
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

### Step 5: Generate Domain

1. Go to **Settings** tab
2. Under **Domains**, click **Generate Domain**
3. Your backend URL will be: `https://jaipureyevision-backend-production.up.railway.app`

### Step 6: Verify Deployment

```bash
curl https://your-backend.up.railway.app/api/health
# Should return: {"status": "healthy"}
```

---

## Vercel Deployment (Frontend)

### Step 1: Prepare Frontend Repository

```bash
# Create separate repo for frontend or use monorepo
cd /path/to/frontend
git init
git add .
git commit -m "Initial commit - JaipurEyeVision Frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/jaipureyevision-frontend.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `./` (or `frontend` if monorepo)
   - **Build Command**: `yarn build`
   - **Output Directory**: `build`

### Step 3: Configure Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Add:

```
REACT_APP_BACKEND_URL=https://your-backend.up.railway.app
```

3. Click **Save**
4. Redeploy: Go to **Deployments** → click **...** → **Redeploy**

### Step 4: Get Your Frontend URL

After deployment, your frontend URL will be:
- `https://jaipureyevision.vercel.app` or
- `https://your-project-name.vercel.app`

---

## Post-Deployment Configuration

### 1. Update CORS in Railway

Go back to Railway and update `CORS_ORIGINS`:
```
CORS_ORIGINS=https://jaipureyevision.vercel.app,https://your-custom-domain.com
```

### 2. Seed Admin User

The admin user is auto-seeded on first startup. Verify by logging in:
- **Email**: `admin@jaipureyevision.com`
- **Password**: `admin@3036`

### 3. Test Payment Flow

1. Login to your app
2. Go to Billing
3. Click Subscribe on any plan
4. Use Razorpay test card:
   - Card: `4111 1111 1111 1111`
   - Expiry: Any future date
   - CVV: Any 3 digits
   - OTP: `1234` (for test mode)

### 4. Configure Custom Domain (Optional)

**For Vercel:**
1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed

**For Railway:**
1. Go to **Settings** → **Domains**
2. Add custom domain
3. Update DNS CNAME record

---

## Local Development Setup

### Mac Setup

```bash
# 1. Install dependencies
brew install python@3.11 node mongodb-community

# 2. Start MongoDB
brew services start mongodb-community

# 3. Clone repository
git clone https://github.com/YOUR_USERNAME/jaipureyevision.git
cd jaipureyevision

# 4. Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your keys
python seed_admin.py
uvicorn server:app --reload --port 8001

# 5. Frontend setup (new terminal)
cd frontend
yarn install
cp .env.example .env
# Edit .env: REACT_APP_BACKEND_URL=http://localhost:8001
yarn start
```

### Windows Setup

```powershell
# 1. Install Python 3.11 from python.org
# 2. Install Node.js from nodejs.org
# 3. Install MongoDB Community Server

# 4. Clone repository
git clone https://github.com/YOUR_USERNAME/jaipureyevision.git
cd jaipureyevision

# 5. Backend setup
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Edit .env with your keys
python seed_admin.py
uvicorn server:app --reload --port 8001

# 6. Frontend setup (new terminal)
cd frontend
yarn install
copy .env.example .env
# Edit .env: REACT_APP_BACKEND_URL=http://localhost:8001
yarn start
```

---

## Environment Variables Summary

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| MONGO_URL | MongoDB connection string | `mongodb://localhost:27017` |
| DB_NAME | Database name | `jaipureyevision` |
| CORS_ORIGINS | Allowed frontend URLs | `https://app.vercel.app` |
| JWT_SECRET | Secret for JWT tokens | `your-32-char-secret` |
| JWT_ALGORITHM | JWT algorithm | `HS256` |
| JWT_EXPIRY_HOURS | Token expiry | `24` |
| EMERGENT_LLM_KEY | Universal AI key | `sk-emergent-xxx` |
| RAZORPAY_KEY_ID | Razorpay Key ID | `rzp_test_xxx` |
| RAZORPAY_KEY_SECRET | Razorpay Secret | `xxx` |

### Frontend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| REACT_APP_BACKEND_URL | Backend API URL | `https://api.railway.app` |

---

## Troubleshooting

### Backend not starting on Railway
- Check **Logs** tab for errors
- Verify all environment variables are set
- Ensure `requirements.txt` has all dependencies

### Frontend API calls failing
- Check browser console for CORS errors
- Verify `REACT_APP_BACKEND_URL` is correct
- Ensure backend `CORS_ORIGINS` includes frontend URL

### Razorpay checkout not opening
- Verify `RAZORPAY_KEY_ID` is correct
- Check browser console for errors
- Ensure you're using test keys in development

### AI generation failing
- Verify `EMERGENT_LLM_KEY` is valid
- Check Emergent Platform for key balance
- Review backend logs for specific errors

---

## Support

For issues or questions:
- Check [Railway Docs](https://docs.railway.app)
- Check [Vercel Docs](https://vercel.com/docs)
- Check [Razorpay Docs](https://razorpay.com/docs)

---

**Happy Deploying! 🚀**
