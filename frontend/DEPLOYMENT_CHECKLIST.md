# Deployment Checklist - Janssen Guard Frontend

## Pre-Deployment Tasks

### 1. Environment Configuration
- [ ] Update `.env.local` with production API URL
- [ ] Verify all environment variables are set correctly
- [ ] Remove any development-only configurations
- [ ] Set `NODE_ENV=production`

### 2. Asset Preparation
- [ ] Replace `public/sounds/success.mp3` with actual audio file
- [ ] Replace `public/sounds/error.mp3` with actual audio file
- [ ] Create and add `public/icons/icon-192x192.png`
- [ ] Create and add `public/icons/icon-512x512.png`
- [ ] Add company logo to `public/images/`
- [ ] Optimize all images (compress, resize)

### 3. Code Quality
- [ ] Run `npm run lint` and fix all errors
- [ ] Run `npm run build` successfully
- [ ] Check for console errors in production build
- [ ] Remove all `console.log` statements (or use proper logging)
- [ ] Review and remove any TODO comments

### 4. Security Review
- [ ] Verify no sensitive data in code
- [ ] Check API keys are in environment variables
- [ ] Ensure HTTPS is enabled
- [ ] Verify CORS settings on backend
- [ ] Test authentication flow
- [ ] Check session timeout behavior

### 5. Testing
- [ ] Test login with valid credentials
- [ ] Test login with invalid credentials
- [ ] Test camera permissions on mobile
- [ ] Test QR scanning with real QR codes
- [ ] Test all 12 patrol points
- [ ] Test duplicate scan prevention
- [ ] Test progress persistence
- [ ] Test logs filtering
- [ ] Test PDF generation
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test on multiple devices (desktop, tablet, mobile)
- [ ] Test in different network conditions
- [ ] Test offline behavior

### 6. Performance
- [ ] Run Lighthouse audit (aim for 90+ scores)
- [ ] Check bundle size (`npm run build`)
- [ ] Test loading speed on 3G network
- [ ] Verify images are optimized
- [ ] Check for unnecessary re-renders

### 7. Accessibility
- [ ] Test with keyboard navigation
- [ ] Test with screen reader
- [ ] Verify all images have alt text
- [ ] Check color contrast ratios
- [ ] Ensure all interactive elements are accessible

---

## Deployment Steps

### Option A: Vercel Deployment

#### Step 1: Prepare Repository
```bash
git add .
git commit -m "Production ready"
git push origin main
```

#### Step 2: Vercel Setup
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Click "Import Project"
- [ ] Select your GitHub repository
- [ ] Configure project settings

#### Step 3: Environment Variables
Add these in Vercel dashboard:
```
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
NEXT_PUBLIC_APP_NAME=Janssen Guard
NEXT_PUBLIC_COMPANY_NAME=Janssen
```

#### Step 4: Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete
- [ ] Verify deployment URL

#### Step 5: Custom Domain (Optional)
- [ ] Add custom domain in Vercel
- [ ] Configure DNS records
- [ ] Wait for SSL certificate

---

### Option B: Docker Deployment

#### Step 1: Create Dockerfile
Already created at `frontend/Dockerfile` (if not, create it):

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

#### Step 2: Build Image
```bash
docker build -t janssen-guard-frontend:latest .
```

#### Step 3: Test Locally
```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=https://your-api.com \
  janssen-guard-frontend:latest
```

#### Step 4: Push to Registry
```bash
docker tag janssen-guard-frontend:latest your-registry/janssen-guard-frontend:latest
docker push your-registry/janssen-guard-frontend:latest
```

#### Step 5: Deploy to Server
```bash
docker pull your-registry/janssen-guard-frontend:latest
docker run -d -p 3000:3000 \
  --name janssen-guard \
  -e NEXT_PUBLIC_API_BASE_URL=https://your-api.com \
  your-registry/janssen-guard-frontend:latest
```

---

### Option C: Traditional Server Deployment

#### Step 1: Build Application
```bash
npm run build
```

#### Step 2: Copy Files to Server
```bash
# Copy these files/folders:
- .next/
- node_modules/
- public/
- package.json
- next.config.mjs
```

#### Step 3: Install PM2 (Process Manager)
```bash
npm install -g pm2
```

#### Step 4: Start Application
```bash
pm2 start npm --name "janssen-guard" -- start
pm2 save
pm2 startup
```

#### Step 5: Configure Nginx (Reverse Proxy)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Step 6: Enable SSL with Let's Encrypt
```bash
sudo certbot --nginx -d your-domain.com
```

---

## Post-Deployment Verification

### Immediate Checks (First 5 Minutes)
- [ ] Application loads successfully
- [ ] Login page is accessible
- [ ] Can login with test account
- [ ] Camera permissions work
- [ ] QR scanning functions
- [ ] No console errors
- [ ] Server status shows "Online"

### Functional Testing (First Hour)
- [ ] Complete a full patrol (scan all 12 points)
- [ ] View patrol logs
- [ ] Filter logs by date
- [ ] Generate and download PDF report
- [ ] Logout and login again
- [ ] Test on mobile device
- [ ] Test on different browser

### Performance Monitoring (First Day)
- [ ] Check server response times
- [ ] Monitor error logs
- [ ] Check user feedback
- [ ] Verify API calls are working
- [ ] Monitor memory usage
- [ ] Check database connections

### Security Audit (First Week)
- [ ] Review access logs
- [ ] Check for unauthorized access attempts
- [ ] Verify SSL certificate is valid
- [ ] Test session timeout
- [ ] Review API security
- [ ] Check for vulnerabilities

---

## Rollback Plan

### If Deployment Fails

#### Vercel
- [ ] Click "Rollback" in Vercel dashboard
- [ ] Select previous working deployment

#### Docker
```bash
docker stop janssen-guard
docker rm janssen-guard
docker run -d -p 3000:3000 \
  --name janssen-guard \
  your-registry/janssen-guard-frontend:previous-version
```

#### Traditional Server
```bash
pm2 stop janssen-guard
# Restore previous .next folder
pm2 start janssen-guard
```

---

## Monitoring Setup

### Recommended Tools
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Configure uptime monitoring (UptimeRobot, Pingdom)
- [ ] Set up analytics (Google Analytics, Plausible)
- [ ] Configure performance monitoring (Vercel Analytics)
- [ ] Set up log aggregation (Papertrail, Loggly)

### Alerts to Configure
- [ ] Application downtime
- [ ] High error rate
- [ ] Slow response times
- [ ] Failed deployments
- [ ] SSL certificate expiration

---

## Maintenance Schedule

### Daily
- [ ] Check error logs
- [ ] Monitor uptime
- [ ] Review user feedback

### Weekly
- [ ] Review performance metrics
- [ ] Check for security updates
- [ ] Backup configuration

### Monthly
- [ ] Update dependencies
- [ ] Security audit
- [ ] Performance optimization review
- [ ] User feedback analysis

---

## Emergency Contacts

### Technical Issues
- Backend Team: [contact info]
- DevOps Team: [contact info]
- Frontend Developer: [contact info]

### Business Issues
- Project Manager: [contact info]
- Security Team: [contact info]

---

## Documentation Links

- **User Guide**: `README.md`
- **Technical Details**: `IMPLEMENTATION_SUMMARY.md`
- **Quick Start**: `QUICK_START.md`
- **API Documentation**: [Backend API docs]

---

## Success Criteria

### Deployment is Successful When:
✅ Application is accessible at production URL
✅ All features work as expected
✅ No critical errors in logs
✅ Performance meets requirements (< 3s load time)
✅ Mobile experience is smooth
✅ Camera and QR scanning work on real devices
✅ Users can complete full patrol workflow
✅ Reports generate correctly
✅ SSL certificate is valid
✅ Monitoring is active

---

## Notes

- Keep this checklist updated with lessons learned
- Document any issues encountered during deployment
- Share feedback with the team
- Celebrate successful deployment! 🎉

---

**Last Updated**: December 10, 2025
**Version**: 1.0.0
**Status**: Ready for Deployment

