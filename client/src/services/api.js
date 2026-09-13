import axios from 'axios';

import { localRealmEngine } from './localRealmEngine';

// Dynamically resolve base URL:
// 1. Prioritize VITE_API_URL, then VITE_API_BASE_URL (Render backend URL).
// 2. Otherwise fall back to '/api' for relative proxies (Vercel/Netlify rewrites).
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    const cleanUrl = envUrl.trim().replace(/\/$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Request interceptor: attach Guild Pass (JWT) & instant local handling on static hosts
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('liferpg_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // On static hosting (like GitHub Pages) without an external cloud backend URL,
    // route directly through localRealmEngine in-memory for 0ms latency and 0 network failures
    const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
    const isStaticHost =
      typeof window !== 'undefined' &&
      (window.location.hostname.includes('github.io') || window.location.protocol === 'file:');

    if (!envUrl && isStaticHost) {
      config.adapter = async (cfg) => {
        const res = await localRealmEngine.handleRequest(cfg);
        return {
          data: res.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: cfg,
          request: {}
        };
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token expirations and offline cloud fallback
api.interceptors.response.use(
  (response) => {
    // If a static host rewrote an API route to index.html, fall back to localRealmEngine
    if (typeof response.data === 'string' && response.data.toLowerCase().includes('<!doctype html')) {
      return localRealmEngine.handleRequest(response.config);
    }
    return response;
  },
  async (error) => {
    // If unauthorized on real backend, clear token
    if (error.response && error.response.status === 401) {
      if (!error.config?.url?.includes('/auth/login') && !error.config?.url?.includes('/auth/register')) {
        localStorage.removeItem('liferpg_token');
        window.dispatchEvent(new Event('liferpg_logout'));
      }
    }

    // Zero-downtime Cloud Fallback:
    // If the server is offline, spun down, unreachable (ERR_NETWORK), or returns 404/502/503
    // because no local/cloud backend is reachable from this client device,
    // seamlessly handle the request via localRealmEngine!
    const isOfflineOrDegraded =
      !error.response ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.response?.status === 404 ||
      error.response?.status === 502 ||
      error.response?.status === 503 ||
      (typeof error.response?.data === 'string' && error.response.data.toLowerCase().includes('<!doctype html'));

    if (isOfflineOrDegraded && error.config) {
      try {
        return await localRealmEngine.handleRequest(error.config);
      } catch (fallbackError) {
        return Promise.reject(fallbackError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
