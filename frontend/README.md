# Janssen Guard - Frontend

A comprehensive web-based security guard patrol management system built with Next.js 14.

## Features

- **Authentication System**: Secure login with username/password
- **QR Code Scanner**: Real-time QR code scanning for patrol points
- **Patrol Progress Tracking**: Visual progress tracker for 12 patrol points
- **Patrol Logs**: View and filter patrol history with pagination
- **Reports & Analytics**: Generate PDF reports with statistics
- **Server Status Monitoring**: Real-time server connectivity status
- **Responsive Design**: Mobile-first design that works on all devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **State Management**: React Context API + Zustand
- **QR Scanner**: html5-qrcode
- **PDF Generation**: jsPDF
- **HTTP Client**: Axios
- **Form Validation**: Zod + React Hook Form
- **Date Handling**: date-fns
- **Notifications**: Sonner

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running (see backend requirements)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_BASE_URL=http://192.168.1.225:8000
NEXT_PUBLIC_APP_NAME=Janssen Guard
NEXT_PUBLIC_COMPANY_NAME=Janssen
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── login/             # Login page
│   │   ├── scan/              # QR scanner page
│   │   ├── logs/              # Patrol logs page
│   │   └── reports/           # Reports page
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   ├── auth/             # Authentication components
│   │   ├── scanner/          # Scanner components
│   │   ├── logs/             # Logs components
│   │   ├── reports/          # Reports components
│   │   └── shared/           # Shared components
│   ├── lib/                  # Library code
│   │   ├── api/             # API client
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript types
│   ├── contexts/            # React contexts
│   ├── services/            # Business logic services
│   └── constants/           # App constants
├── public/                  # Static assets
│   ├── sounds/             # Audio feedback files
│   └── images/             # Images
└── package.json
```

## Key Features Implementation

### Authentication
- Login with username and password
- Session persistence with localStorage
- Auto-redirect for authenticated users
- Server status indicator

### QR Scanner
- Camera access with permission handling
- Real-time QR code detection
- Duplicate scan prevention (5-second debounce)
- Visual and audio feedback
- Progress tracking for 12 patrol points
- Local storage persistence

### Patrol Logs
- Paginated list of patrol records
- Advanced filtering (point, guard, date range)
- Infinite scroll loading
- Click to view details

### Reports
- Summary statistics (total scans, unique points, unique guards)
- Point distribution visualization
- Guard distribution visualization
- PDF export with charts and tables
- Date range filtering

## API Integration

The frontend communicates with the backend API:

- `POST /users?username={username}&password={password}` - Login
- `POST /industerialsecurity` - Create patrol record
- `GET /industerialsecurity?page={page}&limit={limit}` - Get patrol records
- `GET /health` - Check server status

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with camera access

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Adding Sound Files

Replace the placeholder files in `public/sounds/` with actual MP3 files:
- `success.mp3` - Played on successful scan
- `error.mp3` - Played on error

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t janssen-guard-frontend .
docker run -p 3000:3000 janssen-guard-frontend
```

## Troubleshooting

### Camera Not Working
- Ensure HTTPS is enabled (required for camera access)
- Check browser permissions
- Verify camera is not in use by another application

### API Connection Issues
- Verify backend is running
- Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- Check CORS settings on backend

### Build Errors
- Clear `.next` folder and `node_modules`
- Run `npm install` again
- Check Node.js version (18+ required)

## License

Proprietary - Janssen Company

## Support

For issues or questions, contact the development team.

