# Quick Start Guide - Janssen Guard Frontend

## Prerequisites
- Node.js 18+ installed
- Backend API running on `http://192.168.1.225:8000` (or update `.env.local`)

## Installation (5 minutes)

### Step 1: Navigate to Frontend Directory
```bash
cd frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
The `.env.local` file is already created with default values:
```env
NEXT_PUBLIC_API_BASE_URL=http://192.168.1.225:8000
NEXT_PUBLIC_APP_NAME=Janssen Guard
NEXT_PUBLIC_COMPANY_NAME=Janssen
```

**Important**: Update `NEXT_PUBLIC_API_BASE_URL` if your backend is running on a different address.

### Step 4: Run Development Server
```bash
npm run dev
```

### Step 5: Open Browser
Navigate to [http://localhost:3000](http://localhost:3000)

## Default Login (Test)
Use the credentials from your backend API. Example:
- Username: `admin` (or your configured username)
- Password: `password` (or your configured password)

## Main Features

### 1. Login Page (`/login`)
- Enter username and password
- Check server status indicator (should be green)
- Click "Login"

### 2. Scanner Page (`/scan`)
- Allow camera permissions when prompted
- Point camera at QR code with numeric value (1-12)
- Watch progress tracker update
- Scan all 12 points to complete patrol

### 3. Logs Page (`/logs`)
- Click "View Logs" button from scanner
- View all patrol records
- Use "Filter" button to filter by point, guard, or date
- Click on any log card to view details

### 4. Reports Page (`/reports`)
- Navigate to reports (add navigation button or go to `/reports`)
- View summary statistics
- See point and guard distributions
- Click "Export PDF" to download report

## Troubleshooting

### Camera Not Working
**Issue**: Camera doesn't start or shows error

**Solutions**:
1. Use HTTPS (camera requires secure context)
   - For local dev: `http://localhost` is allowed
   - For network access: Use HTTPS or ngrok
2. Check browser permissions (allow camera access)
3. Ensure no other app is using the camera
4. Try different browser (Chrome recommended)

### API Connection Failed
**Issue**: "Server Offline" or login fails

**Solutions**:
1. Verify backend is running: `http://192.168.1.225:8000/health`
2. Update `.env.local` with correct API URL
3. Check CORS settings on backend
4. Restart dev server after changing `.env.local`

### Build Errors
**Issue**: npm install or build fails

**Solutions**:
1. Check Node.js version: `node --version` (should be 18+)
2. Clear cache:
   ```bash
   rm -rf node_modules .next
   npm install
   ```
3. Check for port conflicts (3000 already in use)

### QR Codes Not Scanning
**Issue**: Camera works but doesn't detect QR codes

**Solutions**:
1. Ensure QR code contains numeric value (1-12)
2. Hold camera steady and ensure good lighting
3. Try different distance from QR code
4. Generate test QR codes: https://www.qr-code-generator.com/

## Testing QR Codes

Generate QR codes with these values for testing:
- Point 1: QR code containing "1"
- Point 2: QR code containing "2"
- ... and so on up to Point 12

Use any QR code generator online and create codes with numeric values 1-12.

## Production Build

### Build
```bash
npm run build
```

### Run Production Server
```bash
npm start
```

### Access
Open [http://localhost:3000](http://localhost:3000)

## File Structure Overview

```
frontend/
├── src/
│   ├── app/              # Pages (login, scan, logs, reports)
│   ├── components/       # React components
│   ├── lib/             # API client, hooks, utilities
│   ├── contexts/        # React contexts (Auth)
│   ├── services/        # Business logic
│   └── constants/       # Configuration
├── public/              # Static files
└── package.json         # Dependencies
```

## Development Tips

### Hot Reload
Changes to files automatically reload the browser. No need to restart server.

### TypeScript Errors
Check terminal for TypeScript errors. Fix them for better code quality.

### Tailwind Classes
Use Tailwind utility classes for styling. IntelliSense should provide autocomplete.

### API Calls
All API calls go through `src/lib/api/client.ts`. Check console for API errors.

## Next Steps

1. **Add Sound Files**: Replace placeholder files in `public/sounds/`
   - `success.mp3` - Success sound
   - `error.mp3` - Error sound

2. **Add Icons**: Add app icons in `public/icons/`
   - `icon-192x192.png`
   - `icon-512x512.png`

3. **Customize Branding**: Update company logo and colors in:
   - `src/constants/index.ts`
   - `tailwind.config.ts`
   - `src/app/globals.css`

4. **Test on Mobile**: Open on mobile device for real-world testing
   - Use same network as dev machine
   - Access via `http://YOUR_IP:3000`

## Support

For issues or questions:
1. Check `README.md` for detailed documentation
2. Check `IMPLEMENTATION_SUMMARY.md` for technical details
3. Review console logs for errors
4. Contact development team

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Run linter
npm run lint

# Clear cache and reinstall
rm -rf node_modules .next && npm install
```

## Success Checklist

- [ ] Backend API is running
- [ ] Frontend dev server started successfully
- [ ] Login page loads at http://localhost:3000
- [ ] Server status shows "Online" (green)
- [ ] Can login with valid credentials
- [ ] Camera permissions granted
- [ ] QR scanner detects codes
- [ ] Progress tracker updates
- [ ] Can view logs
- [ ] Can generate PDF report

If all items are checked, you're ready to go! 🎉

