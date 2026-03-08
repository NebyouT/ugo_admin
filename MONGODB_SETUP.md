# MongoDB Atlas Setup Guide for UGO

## 🚀 Quick Setup Steps

### 1. Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for free account
3. Verify your email

### 2. Create a New Cluster
1. Click **"Build a Database"**
2. Select **"M0 Sandbox"** (Free tier)
3. Choose **Cloud Provider**: AWS
4. Choose **Region**: Select closest to your location
5. Cluster Name: `UGO-Cluster`
6. Click **"Create Cluster"**

### 3. Create Database User
1. Go to **"Database Access"** (left menu)
2. Click **"Add New Database User"**
3. Username: `ugo`
4. Password: `12345678` (or your preferred password)
5. Click **"Add User"**

### 4. Configure Network Access
1. Go to **"Network Access"** (left menu)
2. Click **"Add IP Address"**
3. Select **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

### 5. Get Connection String
1. Go to **"Database"** (left menu)
2. Click **"Connect"** on your cluster
3. Select **"Drivers"**
4. Copy the connection string

### 6. Update Your .env File
Replace the MongoDB URI with your actual connection string:

```
MONGODB_URI=mongodb+srv://ugo:12345678@your-cluster-name.mongodb.net/ugo?retryWrites=true&w=majority
```

**Important:**
- Replace `your-cluster-name` with your actual cluster name
- Keep `/ugo` at the end to specify the database name

### 7. Restart Your Server
```bash
taskkill /F /IM node.exe
npm start
```

## 🎯 Expected Output
When MongoDB connects successfully, you should see:
```
MongoDB Connected: cluster0.xxxxx.mongodb.net
Admin user created successfully: admin@ugo.com
```

## 🔧 Troubleshooting

### If you get "bad auth" error:
- Check username and password in connection string
- Ensure database user exists in MongoDB Atlas

### If you get "ESERVFAIL" error:
- Check your cluster name in connection string
- Ensure cluster is created and active
- Wait a few minutes for cluster to initialize

### If you get IP whitelist error:
- Add your IP to Network Access
- Or use "Allow Access from Anywhere" (0.0.0.0/0)

## 🎉 Success!
Once connected:
- Database `ugo` will be created automatically
- Admin user will be created automatically
- Login will use database authentication
- Fallback authentication still works as backup

## 📱 Test Database Login
1. Visit: http://localhost:5000/admin
2. Login with: admin@ugo.com / 12345678
3. Should show: "Login successful (database)"
