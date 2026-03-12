# 🚀 UGO Admin - Deployment Guide

## 📋 CSP Issues & Solutions

### 🔧 Content Security Policy (CSP) Configuration

The CSP errors you're experiencing on Render are caused by the default security settings being too restrictive for external CDN resources. Here's how to fix them:

## 🛠️ Current CSP Configuration

The server now includes a comprehensive CSP configuration that allows:

```javascript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
    styleSrcElem: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
    scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
    scriptSrcElem: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https://picsum.photos", "https://fastly.picsum.photos", "https://ui-avatars.com"],
    fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
    connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    manifestSrc: ["'self'"],
    workerSrc: ["'self'"],
    upgradeInsecureRequests: []
  }
}
```

**Key Updates:**
- ✅ Added `'unsafe-inline'` to `styleSrcElem` and `scriptSrcElem` directives
- ✅ Added `https://fastly.picsum.photos` to `imgSrc` directive
- ✅ Resolved all inline style and script violations
- ✅ Fixed image loading from Picsum Photos CDN

## 🔧️ Render Deployment Steps

### 1. Environment Variables

Make sure your Render environment variables include:

```bash
# Required
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-mongodb-connection-string

# Optional
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
```

### 2. Build Command

Add this to your `package.json` scripts:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "echo 'No build step required for Node.js'",
    "deploy": "npm start"
  }
}
```

### 3. Render Configuration

Your `render.yaml` should include:

```yaml
services:
  - type: web
    name: ugo-admin
    env: node
    plan: free
    buildCommand: "npm install"
    startCommand: "npm start"
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: MONGODB_URI
        value: mongodb://your-mongodb-connection-string
```

## 🔧️ CSP-Specific Solutions

### If CSP Issues Persist

#### Option 1: Disable CSP (Not Recommended for Production)
```javascript
// In server.js, temporarily disable CSP
app.use(helmet({
  contentSecurityPolicy: false
}));
```

#### Option 2: Permissive CSP (More Lenient)
```javascript
// In server.js, use a more permissive CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "data:", "blob:", "https:", "unsafe-inline", "unsafe-eval"],
      styleSrc: ["'self'", "unsafe-inline", "https:", "data:"],
      scriptSrc: ["'self'", "unsafe-inline", "unsafe-eval", "https:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "ws:", "wss:"],
    }
  }
}));
```

#### Option 3: Add Specific Domains
If you need to allow specific external domains, add them to the CSP:

```javascript
// Example: Allow Google Fonts and additional CDNs
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
    }
  }
}));
```

## 🚨️ Common CSP Errors & Solutions

### Error: `style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'`

**Problem**: Font Awesome styles blocked
**Solution**: Already fixed with updated CSP configuration

### Error: `script-src 'self' https://cdn.jsdelivr.net`

**Problem**: JavaScript libraries blocked
**Solution**: Already fixed with updated CSP configuration

### Error: `style-src 'self' https://cdnjs.cloudflare.com`

**Problem**: Font Awesome styles blocked
**Solution**: Already fixed with updated CSP configuration

### Error: `Failed to load resource: the server responded with a status of 404`

**Problem**: JavaScript file not found
**Solution**: Ensure `public/js/login.js` exists and is properly referenced

## 📁 File Structure for Deployment

```
ugo-admin/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── views/                 # EJS templates
│   ├── admin/
│   │   ├── components/
│   │   │   └── sidebar.ejs
│   │   └── views/
│   │       ├── auth-management/
│   │       ├── api-docs/
│   │       ├── customers/
│   │       ├── drivers/
│   │       └── users/
│   ├── login.ejs
│   └── landing.ejs
├── public/                # Static files
│   ├── css/
│   ├── js/
│   │   └── login.js
│   └── images/
└── modules/              # Application modules
    ├── auth/
    ├── user-management/
    └── ...
```

## 🔍 Testing CSP Configuration

### Test Locally First
1. Start the server locally
2. Check browser console for CSP errors
3. Test all external resource loading

### Test on Render
1. Deploy to Render
2. Check Render logs for CSP violations
3. Test all pages and functionality

### Debugging CSP Issues
1. Open browser developer tools
2. Check Console tab for CSP errors
3. Look for "Content Security Policy" violations
4. Check Network tab for blocked resources

## 📋 External Resources Used

### Stylesheets
- Bootstrap 5.3.0: `https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css`
- Font Awesome 6.4.0: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css`

### JavaScript
- Bootstrap Bundle: `https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js`
- Custom login script: `/public/js/login.js`

### Images
- UI Avatars: `https://ui-avatars.com/api/`
- Placeholder Images: `https://picsum.photos/seed/`

## 🎯️ Best Practices for CSP

### 1. Use Specific Domains
Only allow domains you actually use instead of wildcards.

### 2. Avoid `unsafe-inline` When Possible
Use external stylesheets instead of inline styles when feasible.

### 3. Use Nonces for Scripts
Use `crypto.getRandomValues()` for nonce-based CSP when possible.

### 4. Regular Updates
Keep your CSP configuration up to date with security best practices.

## 🔧️ Troubleshooting

### If Resources Still Blocked

1. **Check Browser Console**: Look for specific CSP violation messages
2. **Verify Resource URLs**: Ensure all external resources are correctly referenced
3. **Check File Paths**: Make sure all local files exist in the correct locations
4. **Test Individually**: Disable CSP temporarily to isolate the problem

### Common Issues

#### External Scripts Not Loading
- Check if script URLs are correct
- Verify the external domain is in CSP `connectSrc`
- Ensure `scriptSrc` includes the domain

#### Styles Not Loading
- Verify stylesheet URLs are correct
- Check if `styleSrc` includes the domain
- Ensure `styleSrcElem` is included for inline styles

#### Images Not Loading
- Verify image URLs are correct
- Check if `imgSrc` includes the domain
- Ensure `data:` is included for base64 images

## 📞 Support

If you continue to experience CSP issues after these changes:

1. **Check the browser console** for specific error messages
2. **Verify the CSP configuration** in `server.js`
3. **Test with CSP disabled** to isolate the problem
4. **Contact support** with specific error messages and browser console logs

The CSP configuration has been updated to allow all the external resources your application needs, so the issues should be resolved when you redeploy to Render.
