# Deploy to DigitalOcean - Quick Start

## 🚀 5-Minute Deployment

### Step 1: Sign Up & Get Free Credits

1. **Create account**: [digitalocean.com](https://www.digitalocean.com)
2. **Get $200 free**: [GitHub Student Pack](https://education.github.com/pack)

### Step 2: Deploy App

1. **Go to**: [cloud.digitalocean.com/apps/new](https://cloud.digitalocean.com/apps/new)

2. **Connect GitHub**:
   - Authorize DigitalOcean
   - Select: `dannyjy/backend_AGAS`
   - Branch: `main`
   - ✅ Auto-deploy on push

3. **Configure Service**:
   - Build: `npm install`
   - Run: `npm start`
   - Port: `8080`
   - Plan: Basic ($5/month)

4. **Add Database**:
   - Click "Add Resource" → "Database"
   - PostgreSQL 14
   - Development Plan ($7/month)

5. **Click "Create Resources"** ✅

### Step 3: Done! 🎉

Your app is live at:
```
https://agas-api-xxxxx.ondigitalocean.app
```

---

## 💰 Pricing

- **Web App**: $5/month
- **Database**: $7/month
- **Total**: $12/month
- **FREE for 16+ months** with GitHub Student Pack!

---

## 🔄 Auto-Deploy

Push to GitHub = Automatic deployment:

```bash
git add .
git commit -m "Update"
git push origin main
```

DigitalOcean deploys automatically!

---

## 📖 Full Guide

See [DIGITALOCEAN_DEPLOYMENT.md](./DIGITALOCEAN_DEPLOYMENT.md) for:
- Detailed setup
- Environment variables
- Custom domains
- Monitoring & logs
- Troubleshooting

---

## ✨ Why DigitalOcean?

- ✅ Simpler than Azure
- ✅ $200 student credit
- ✅ Auto-deploy from GitHub
- ✅ Built-in PostgreSQL
- ✅ WebSocket support included
- ✅ No region restrictions

---

## 🆘 Need Help?

Check the full guide: [DIGITALOCEAN_DEPLOYMENT.md](./DIGITALOCEAN_DEPLOYMENT.md)
