import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from './config';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('auth_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Log validation errors for debugging
        if (error.response?.status === 422) {
          const errorData = error.response.data;
          const requestConfig = error.config;
          
          // Extract error details - FastAPI validation errors are typically in errorData.detail
          const errorDetails = errorData?.detail || errorData?.message || errorData?.errors || errorData;
          
          console.error('Validation error (422):', {
            status: error.response.status,
            statusText: error.response.statusText,
            url: requestConfig?.url,
            method: requestConfig?.method,
          });
          
          // Log the actual validation error details
          if (Array.isArray(errorDetails)) {
            console.error('Validation errors:', errorDetails);
            errorDetails.forEach((err: any, idx: number) => {
              console.error(`  Error ${idx + 1}:`, {
                field: err.loc?.join('.') || err.field || 'unknown',
                message: err.msg || err.message || 'Validation failed',
                value: err.input || err.value,
              });
            });
          } else if (typeof errorDetails === 'object') {
            console.error('Validation error details:', JSON.stringify(errorDetails, null, 2));
          } else {
            console.error('Validation error message:', errorDetails);
          }
          
          // For GET requests, log params; for POST/PUT, log data
          if (requestConfig) {
            if (requestConfig.method?.toLowerCase() === 'get') {
              console.error('Request params:', requestConfig.params);
            } else {
              console.error('Request data:', requestConfig.data);
            }
          }
        }
        
        if (error.response?.status === 401) {
          // Handle unauthorized
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 3000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export const apiClient = new ApiClient();

