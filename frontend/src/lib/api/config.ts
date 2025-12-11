// Get the current hostname/IP to support cross-machine access
const getApiBaseURL = (): string => {
  // If explicitly set via environment variable, use it
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  // For browser environment, detect if we're on HTTPS
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // If accessing via HTTPS (port 443), use HTTPS for API on port 8443
    if (protocol === 'https:' || window.location.port === '443') {
      // Use the same hostname (IP or domain) for API
      return `https://${hostname}:8443`;
    }
    
    // If accessing via HTTP, use HTTP for API
    return `http://${hostname}:8000`;
  }

  // Server-side fallback
  return 'http://localhost:8000';
};

export const API_CONFIG = {
  baseURL: getApiBaseURL(),
  timeout: 10000,
  endpoints: {
    login: '/users',
    patrolRecords: '/industerialsecurity',
    health: '/health',
  },
};

