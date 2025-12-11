# Frontend Environment Configuration

## Setup Instructions

1. Create a `.env.local` file in the `frontend` directory
2. Copy the configuration below and update with your values

## Configuration Template

```env
# API Base URL
# Option 1: Auto-detect (recommended for local network)
# Leave empty to auto-detect based on current hostname
NEXT_PUBLIC_API_BASE_URL=

# Option 2: Explicit configuration (recommended for iPhone HTTPS access)
# Replace YOUR_IP with your server's IP address
NEXT_PUBLIC_API_BASE_URL=http://YOUR_IP:8000

# Example:
# NEXT_PUBLIC_API_BASE_URL=http://192.168.1.225:8000

# Application Name
NEXT_PUBLIC_APP_NAME=Janssen Guard

# Company Name
NEXT_PUBLIC_COMPANY_NAME=Janssen
```

## iPhone HTTPS Access Configuration

If you're accessing the frontend via HTTPS on iPhone and experiencing connection issues:

1. **Set explicit API URL**: Set `NEXT_PUBLIC_API_BASE_URL` to your server's HTTP endpoint
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://192.168.1.225:8000
   ```

2. **Why HTTP for API?**: The backend runs on HTTP (port 8000), not HTTPS. iPhone Safari allows mixed content (HTTPS page → HTTP API) for local network IPs.

3. **If you have HTTPS backend**: If your backend has SSL configured, use:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://192.168.1.225:8443
   ```

## Troubleshooting

### Server appears offline on iPhone
- Check that `NEXT_PUBLIC_API_BASE_URL` is set correctly
- Verify the backend is running and accessible
- Check CORS settings on backend (should allow `["*"]` or include your HTTPS origin)

### Connection works on other devices but not iPhone
- iPhone Safari is stricter about SSL certificates
- Solution: Use HTTP for API URL (as shown above)
- Ensure backend CORS allows all origins: `ALLOWED_ORIGINS=["*"]`

