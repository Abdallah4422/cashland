// Production backend URL for static hosts (Hugging Face Spaces, Netlify, etc.).
// VITE_API_BASE_URL can override this at build time for other environments.
const configuredBase = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const API_BASE_URL = (configuredBase?.trim() || 'https://db-url-sh27.onrender.com').replace(/\/+$/, '');
