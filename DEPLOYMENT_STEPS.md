# DigitalOcean Web Deployment - Step by Step

Follow these exact steps to deploy your AGAS backend:

## Step 1: Select Source (GitHub)

1. You should see "Create App" page
2. **Click** the **"GitHub"** button
3. If prompted, **authorize DigitalOcean** to access your repositories
4. **Select repository**: `dannyjy/backend_AGAS`
5. **Branch**: `main`
6. **Autodeploy**: ✅ Check "Autodeploy code changes"
7. **Click** "Next"

---

## Step 2: Configure Resources (Web Service)

DigitalOcean should auto-detect your Node.js app. Verify these settings:

### Web Service Configuration:
- **Name**: `agas-api` (or keep default)
- **Environment**: Node.js
- **Build Command**: `npm install`
- **Run Command**: `npm start`
- **HTTP Port**: `8080`
- **HTTP Routes**: `/`

### Instance Configuration:
- **Instance Size**: Basic
- **Instance Type**: Basic (512 MB RAM, $5/mo) or Basic XXS (512 MB RAM, $5/mo)
- **Number of Instances**: 1

**Click** "Next" when done.

---

## Step 3: Add Database

1. **Click** "Add Resource" → "Database"

2. Configure Database:
   - **Engine**: PostgreSQL
   - **Version**: 14
   - **Name**: `agas-db` (or keep default)
   - **Cluster Name**: `agas-cluster` (optional)
   - **Plan**: Development Database ($7/month)

3. **Click** "Add Database"

4. **Important**: DigitalOcean will automatically set `${agas-db.DATABASE_URL}` environment variable

---

## Step 4: Environment Variables

The database URL is auto-configured, but verify these are set:

**Scroll down to "Environment Variables" section or click "Edit" on your web service**

Required variables:
```
NODE_ENV = production
PORT = 8080
HOST = 0.0.0.0
```

The `DATABASE_URL` should already be there as `${agas-db.DATABASE_URL}` (reference to the database you just added).

**If not showing**, you can add after deployment in Settings.

---

## Step 5: Review and Deploy

1. Review the configuration summary:
   - ✅ Web Service: agas-api
   - ✅ Database: PostgreSQL 14
   - ✅ Auto-deploy enabled

2. **Estimated cost**: ~$12/month
   - Basic web service: $5/mo
   - Dev database: $7/mo

3. **Click "Create Resources"**

---

## Step 6: Wait for Deployment (3-5 minutes)

You'll see:
1. **Building**: Installing dependencies (npm install)
2. **Deploying**: Starting your app
3. **Creating Database**: Provisioning PostgreSQL

Progress indicators will show each step.

---

## Step 7: Get Your App URL

Once deployed (status shows "Active"):

1. Click on your app name
2. You'll see your app URL:
   ```
   https://agas-api-xxxxx.ondigitalocean.app
   ```

3. **Click** "Live App" button to open it

4. You should see: `Smart Safety API is running`

---

## Step 8: Verify Database Connection

1. Click "Runtime Logs" tab
2. Look for this message:
   ```
   PostgreSQL schema is ready.
   Server running at http://localhost:8080
   ```

If you see this, your database is connected! ✅

---

## Step 9: Test Your API

Open PowerShell and run:

```powershell
# Replace with your actual app URL
$appUrl = "https://agas-api-xxxxx.ondigitalocean.app"

# Test health endpoint
Invoke-WebRequest -Uri $appUrl

# Test sensor data endpoint
Invoke-RestMethod -Uri "$appUrl/api/gas-data" -Method POST -ContentType "application/json" -Body '{"sensorId":"SENSOR-001","co2":920,"gas_level":6}'
```

---

## 🎉 Success!

Your backend is now deployed with:
- ✅ Node.js app running on App Platform
- ✅ PostgreSQL database connected
- ✅ WebSocket support enabled
- ✅ Auto-deploy from GitHub enabled
- ✅ HTTPS enabled automatically

---

## Next Steps:

1. **Update Frontend**: Change API URL in your frontend to use the DigitalOcean URL
2. **Monitor**: Use DigitalOcean dashboard to view logs and metrics
3. **Scale**: Upgrade instance size if needed (Settings → Edit Plan)

---

## Troubleshooting:

### App won't start?
- Check Runtime Logs
- Verify PORT=8080 is set
- Ensure package.json has all dependencies

### Database connection error?
- Wait 2-3 minutes for database to fully provision
- Check that DATABASE_URL is set
- Verify database status is "Active"

### Can't access app?
- Check deployment status
- View build logs for errors
- Ensure HTTP port is 8080

---

**Need help?** Come back to VS Code and I can assist with debugging!
