
const configuredBase = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const API_BASE_URL = (
  configuredBase?.trim() || 'https://cashland-1.onrender.com'
).replace(/\/+$/, '');
