# Render Deployment Guide for Rick and Morty Fanwork Archive

## Overview
This guide covers deploying your 18+ Rick and Morty fanwork archive platform to Render with proper database configuration and environment setup.

## Prerequisites
- Render account (render.com)
- Neon PostgreSQL database (recommended for production)
- GitHub repository containing your project

## Database Setup (Neon PostgreSQL)

### 1. Create Neon Database
1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Choose your preferred region
4. Copy the connection string (format: `postgresql://username:password@hostname/database`)

### 2. Database Schema Migration
Run the following command locally to push your schema to Neon:
```bash
npm run db:push
```

## Render Deployment Steps

### 1. Create Web Service
1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the following settings:

**Basic Settings:**
- Name: `rickorty-archive`
- Environment: `Node`
- Region: Choose closest to your users
- Branch: `main`

**Build & Deploy:**
- Build Command: `npm install && node build-production.js`
- Start Command: `npm start`

### 2. Environment Variables
Add these environment variables in Render:

**Required:**
```
NODE_ENV=production
DATABASE_URL=your_neon_connection_string
SESSION_SECRET=your_secure_random_string_64_chars_min
```

**Session Secret Generation:**
Generate a secure session secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Advanced Settings
- **Auto-Deploy:** Enable for automatic deployments
- **Health Check Path:** `/` (landing page)
- **HTTP Headers:** Leave default

## Post-Deployment Configuration

### 1. Database Verification
After deployment, verify your database connection by checking the logs for successful startup.

### 2. Domain Setup (Optional)
- Render provides a free `.onrender.com` subdomain
- For custom domains, upgrade to paid plan and configure DNS

### 3. SSL/HTTPS
- Automatic SSL certificates provided by Render
- All traffic automatically redirected to HTTPS

## Performance Optimizations

### 1. Node.js Optimization
Add to your `package.json`:
```json
{
  "scripts": {
    "start": "NODE_ENV=production node server/index.js"
  }
}
```

### 2. Static Asset Serving
Ensure your build process generates optimized static assets:
```bash
npm run build
```

## Security Considerations

### 1. Environment Variables
- Never commit `.env` files to Git
- Use Render's environment variable system
- Rotate SESSION_SECRET periodically

### 2. Database Security
- Use Neon's connection pooling
- Enable SSL connections (Neon provides this by default)
- Regularly backup your database

## Monitoring & Maintenance

### 1. Logs
- Access logs via Render Dashboard
- Monitor for errors and performance issues
- Set up log retention policies

### 2. Scaling
- Render automatically handles basic scaling
- Upgrade to paid plans for more resources
- Monitor CPU and memory usage

### 3. Backups
- Neon provides automatic backups
- Consider setting up additional backup strategies for critical data

## Troubleshooting

### Common Issues:

**Vite Build Failures (Replit Plugin Issues):**
The project uses Replit-specific plugins that cause build failures on Render. Solution:
- Use the custom build script: `node build-production.js`
- This script uses `vite.config.production.ts` which excludes Replit plugins
- If build still fails, try: `NODE_ENV=production vite build --config vite.config.production.ts`

**Build Failures:**
- Check Node.js version compatibility (use Node 18+ recommended)
- Verify all dependencies are in `package.json`
- Review build logs for specific errors
- Clear build cache if needed

**Database Connection Issues:**
- Verify DATABASE_URL format
- Check Neon database status
- Ensure IP restrictions (if any) allow Render's IPs

**Session Issues:**
- Verify SESSION_SECRET is set
- Check session store configuration
- Monitor memory usage for session storage

**File Upload Issues:**
- Render has ephemeral storage
- Consider using cloud storage (AWS S3, Cloudinary) for persistent file uploads
- Current setup stores uploads in memory/temporary storage

## Production Checklist

Before going live:
- [ ] Database schema deployed to Neon
- [ ] All environment variables configured
- [ ] SSL certificate active
- [ ] Health checks passing
- [ ] File upload functionality tested
- [ ] Admin panel accessible
- [ ] Age verification working
- [ ] User registration/login functional
- [ ] Content moderation tools operational

## Support Resources

- **Render Documentation:** [docs.render.com](https://docs.render.com)
- **Neon Documentation:** [neon.tech/docs](https://neon.tech/docs)
- **Node.js on Render:** [render.com/docs/node-js](https://render.com/docs/node-js)

## Cost Estimation

**Free Tier:**
- Render: Free web service (with limitations)
- Neon: Free tier with 0.5GB storage

**Paid Recommendations:**
- Render: $7/month for basic web service
- Neon: $19/month for production database with better performance

## Architecture Notes

This platform uses:
- **Frontend:** React with Vite build system
- **Backend:** Express.js with JWT authentication
- **Database:** PostgreSQL via Drizzle ORM
- **File Storage:** Temporary storage (consider upgrading to cloud storage)
- **Session Management:** PostgreSQL-backed sessions

## Next Steps After Deployment

1. Test all functionality in production environment
2. Set up monitoring and alerting
3. Configure regular database backups
4. Implement CDN for static assets (optional)
5. Set up staging environment for testing updates

---

*This deployment guide ensures your 18+ Rick and Morty fanwork archive runs reliably in production with proper security and performance considerations.*