# UGO Admin - Render Deployment Guide

## 🚀 Deploy to Render.com

### Prerequisites
- GitHub repository with your code
- Render.com account (Free tier available)
- MongoDB Atlas account (Free tier available)

### Step 1: Prepare Your Code
Your code is already configured for Render deployment with:
- ✅ `Procfile` - Tells Render how to start your app
- ✅ `package.json` - Dependencies and start script
- ✅ `server.js` - Uses PORT environment variable
- ✅ `render.yaml` - Render configuration file

### Step 2: Set Up MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user with password
4. Get your connection string (SRV format)
5. Add your IP address to whitelist (0.0.0.0/0 for Render)

### Step 3: Deploy to Render

#### Option A: Using render.yaml (Recommended)
1. Push your code to GitHub
2. Go to Render Dashboard
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Render will automatically detect your Node.js app
6. Configure environment variables (see below)

#### Option B: Manual Setup
1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: ugo-admin
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`

### Step 4: Set Environment Variables
In Render Dashboard → your service → Environment, add:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ugo?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-2026
ADMIN_EMAIL=admin@ugo.com
ADMIN_PASSWORD=12345678
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User
```

**Important**: Replace the MongoDB URI with your actual Atlas connection string.

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait for deployment (2-3 minutes)
3. Your app will be available at: `https://ugo-admin.onrender.com`

### Step 6: Test Your Deployment
1. Visit your app URL
2. Test health check: `https://ugo-admin.onrender.com/health`
3. Test admin login: `https://ugo-admin.onrender.com/admin`
4. Login with: admin@ugo.com / 12345678

### 🔧 Troubleshooting

#### Common Issues:

**1. Build Fails**
- Check package.json has correct dependencies
- Ensure Node version is compatible (>=14.0.0)

**2. Database Connection Failed**
- Verify MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas
- Ensure database user has correct permissions

**3. App Not Loading**
- Check health endpoint: `/health`
- Review deployment logs in Render dashboard
- Verify all environment variables are set

**4. Login Not Working**
- Verify JWT_SECRET is set
- Check admin credentials in environment variables
- Review auth middleware logs

### 📱 Mobile Access
Your deployed app will be mobile-responsive and accessible on all devices.

### 🔄 Auto-Deployments
Render automatically redeploys when you push to GitHub. Your app will update automatically!

### 💡 Pro Tips
1. Use Render's free tier for development
2. Monitor logs in Render dashboard
3. Set up custom domain later if needed
4. Consider upgrading to paid plan for production use

### 🎯 Success Metrics
Your deployment is successful when:
- ✅ Health check returns status OK
- ✅ Landing page loads correctly
- ✅ Admin login works
- ✅ Dashboard displays stats
- ✅ All navigation links work

---

**Need Help?**
- Check Render docs: https://render.com/docs
- Review deployment logs
- Test locally first with `npm start`
