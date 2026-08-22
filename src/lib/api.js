import axios from 'axios';
import { supabase } from './supabase';

// Determine the active API base URL:
// In browser web mode: use relative '/api'
// In mobile APK / Capacitor / Cordova / file:// origin mode: route to live cloud server
export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const isApkOrFile = 
      window.location.protocol === 'file:' || 
      window.location.hostname === 'localhost' && window.location.port !== '3000' && window.location.port !== '5173' ||
      window.location.origin.includes('capacitor') ||
      window.location.origin.includes('ionic');

    if (isApkOrFile) {
      // Saved custom API endpoint or live cloud backend URL
      const customApi = localStorage.getItem('custom_api_endpoint');
      return customApi || 'https://ais-dev-3rnhgkd4wautg7ce7ppxv5-820345301761.asia-southeast1.run.app/api';
    }
  }
  return '/api';
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Update baseURL dynamically in case config changed
    if (!config.baseURL || config.baseURL === 'http://localhost:3000/api') {
      config.baseURL = getApiBaseUrl();
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Graceful error logging
    if (error.response) {
      console.warn(`[API Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} => ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.warn(`[API Network Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} => Request unreachable.`);
    }
    return Promise.reject(error);
  }
);

export default api;
