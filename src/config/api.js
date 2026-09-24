/**
 * Centralized API Base URL Configuration for Bidwise
 * 
 * - In Production: Uses VITE_API_BASE_URL or falls back to deployed Render backend (https://bidwise-azdk.onrender.com)
 * - In Local Development: Defaults to local FastAPI backend (http://127.0.0.1:8000)
 */
export const API_BASE_URL = 
  (import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '') : null) || 
  (import.meta.env.DEV ? 'http://127.0.0.1:8000' : 'https://bidwise-azdk.onrender.com');
