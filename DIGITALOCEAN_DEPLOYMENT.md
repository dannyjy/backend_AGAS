# DigitalOcean Deployment Guide

Complete guide to deploy your AGAS Backend to DigitalOcean App Platform.

## Why DigitalOcean?

- ✅ **Simpler** than Azure for small projects
- ✅ **$200 free credit** for students ([GitHub Student Developer Pack](https://education.github.com/pack))
- ✅ **Transparent pricing** (~$12-20/month after credits)
- ✅ **Built-in PostgreSQL** with automatic backups
- ✅ **WebSocket support** included
- ✅ **Auto-deploy** from GitHub

---

## Prerequisites

1. **DigitalOcean Account**
   - Sign up at [digitalocean.com](https://www.digitalocean.com)
   - Get free credits: [GitHub Student Developer Pack](https://education.github.com/pack)

2. **GitHub Repository**
   - Your code should be pushed to GitHub
   - Repository: `dannyjy/backend_AGAS`

3. **DigitalOcean CLI (optional)**
   - Install: `npm install -g doctl` (optional, we'll use web UI)

---

## 🚀 Deployment Methods

### **Method 1: Web UI (Recommended for First Time)**

#### Step 1: Create App on DigitalOcean

1. **Login** to [cloud.digitalocean.com](https://cloud.digitalocean.com)

2. **Click "Create" → "Apps"**

3. **Connect GitHub**:
   - Click "GitHub"
   - Authorize DigitalOcean to access your repositories
   - Select repository: `dannyjy/backend_AGAS`
   - Branch: `main`
   - Auto-deploy: ✅ Enable

4. **Configure Resources**:
   
   Click "Edit Plan" for your web service:
   - **Name**: `agas-api`
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`
   - **HTTP Port**: `8080`
   - **Instance Size**: Basic (512MB RAM, $5/month)
   
#### Step 2: Add PostgreSQL Database

1. **Click "Add Resource" → "Database"**

2. **Configure Database**:
   - **Type**: PostgreSQL
   - **Version**: 14
   - **Plan**: Development ($7/month)
   - **Name**: `agas-db`

3. **DigitalOcean automatically sets `DATABASE_URL`** for you!

#### Step 3: Configure Environment Variables

1. **Click on your web service → "Settings" tab**

2. **Add Environment Variables**:

   ```
   NODE_ENV=production
   PORT=8080
   HOST=0.0.0.0
   ```

   The `DATABASE_URL` is automatically injected by DigitalOcean.

#### Step 4: Deploy!

1. **Click "Next" → "Create Resources"**

2. **Wait 3-5 minutes** for deployment

3. **Your app will be live** at:
   ```
   https://agas-api-xxxxx.ondigitalocean.app
   ```

---

### **Method 2: Using App Spec File (Faster)**

We've included a `.do/app.yaml` file for quick deployment.

#### Step 1: Login to DigitalOcean

Go to [cloud.digitalocean.com/apps/new](https://cloud.digitalocean.com/apps/new)

#### Step 2: Connect Repository

- Select GitHub
- Choose `dannyjy/backend_AGAS`
- Branch: `main`

#### Step 3: Use App Spec

1. Click "Edit App Spec"
2. Copy contents from `.do/app.yaml` file
3. Click "Save"

#### Step 4: Create Resources

Click "Create Resources" and wait for deployment!

---

### **Method 3: Using doctl CLI**

```bash
# Install doctl
npm install -g doctl

# Authenticate
doctl auth init

# Create app from spec file
doctl apps create --spec .do/app.yaml

# Check deployment status
doctl apps list

# Get app URL
doctl apps list --format ID,DefaultIngress
```

---

## 📝 Post-Deployment Setup

### 1. Get Your App URL

After deployment, find your URL:
- **Web UI**: Apps → Your App → "Live App" button
- **CLI**: `doctl apps list --format DefaultIngress`

Example: `https://agas-api-xxxxx.ondigitalocean.app`

### 2. Verify Database Connection

The database URL is automatically set. To verify:

```bash
# Access your app logs
doctl apps logs <app-id>
```

Look for: `PostgreSQL schema is ready.`

### 3. Test Your API

```bash
# Test the API
curl https://your-app-url.ondigitalocean.app

# Test with sensor data
curl -X POST https://your-app-url.ondigitalocean.app/api/gas-data \
  -H "Content-Type: application/json" \
  -d '{"sensorId":"SENSOR-001","co2":920,"gas_level":6}'
```

---

## 🔄 Updating Your Deployment

### Auto-Deploy (Recommended)

When auto-deploy is enabled, simply push to GitHub:

```bash
git add .
git commit -m "Update backend"
git push origin main
```

DigitalOcean automatically detects the push and redeploys!

### Manual Deploy

In the DigitalOcean dashboard:
1. Go to your app
2. Click "Actions" → "Force Rebuild and Deploy"

---

## 📊 Monitoring & Logs

### View Logs

**Web UI:**
1. Go to your app
2. Click "Runtime Logs" or "Build Logs"

**CLI:**
```bash
# Live logs
doctl apps logs <app-id> --follow

# Component logs
doctl apps logs <app-id> --type build
doctl apps logs <app-id> --type run
```

### Metrics

In the dashboard:
- **CPU Usage**
- **Memory Usage**
- **Bandwidth**
- **Request Count**

---

## 💰 Cost Breakdown

With Development tier:
- **Web Service (Basic)**: $5/month
- **PostgreSQL (Dev)**: $7/month
- **Bandwidth**: Included (1TB free)
- **Total**: **~$12/month**

**Free for Students**: GitHub Student Developer Pack gives you $200 credit (16+ months free!)

---

## ⚙️ Configuration Tips

### Enable CORS

Already configured in your code! The app uses:
```javascript
app.use(cors());
```

### WebSocket Support

✅ **Automatically supported** on DigitalOcean App Platform!

Your Socket.IO configuration works out of the box.

### Custom Domain (Optional)

1. Go to app → Settings → Domains
2. Add your domain
3. Update DNS records (DigitalOcean provides instructions)

---

## 🔒 Security Best Practices

### Environment Variables

Never commit sensitive data! Add them in DigitalOcean dashboard:
- Settings → App-Level Environment Variables

### Database Access

The database is only accessible from your app by default (secure!).

To access from your local machine:
1. Go to Databases → Your Database
2. Click "Connection Details"
3. Add your IP to "Trusted Sources"

---

## 🐛 Troubleshooting

### Issue: Build Fails

**Check build logs:**
```bash
doctl apps logs <app-id> --type build
```

Common fixes:
- Ensure `package.json` has all dependencies
- Check Node.js version compatibility

### Issue: App Crashes on Start

**Check runtime logs:**
```bash
doctl apps logs <app-id> --type run --follow
```

Common fixes:
- Verify `DATABASE_URL` is set
- Check that PORT is 8080
- Ensure database schema is created

### Issue: Database Connection Timeout

The database takes ~2 minutes to provision. Wait and redeploy.

### Issue: WebSocket Not Working

Verify your Socket.IO client connects to the correct URL:
```javascript
const socket = io('https://your-app.ondigitalocean.app');
```

---

## 📚 Additional Resources

- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [GitHub Student Pack](https://education.github.com/pack)
- [doctl Documentation](https://docs.digitalocean.com/reference/doctl/)
- [App Spec Reference](https://docs.digitalocean.com/products/app-platform/reference/app-spec/)

---

## 🆘 Need Help?

1. Check [DigitalOcean Community](https://www.digitalocean.com/community)
2. View [official tutorials](https://www.digitalocean.com/community/tags/app-platform)
3. Contact DigitalOcean support (available 24/7)

---

## ✅ Next Steps After Deployment

1. ✅ Update your frontend to use the new backend URL
2. ✅ Set up monitoring alerts
3. ✅ Configure custom domain (optional)
4. ✅ Set up GitHub Actions for testing (optional)
5. ✅ Create database backups schedule

---

**Your backend is ready for production! 🎉**
