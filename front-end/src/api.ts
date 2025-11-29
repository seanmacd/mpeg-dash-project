/**
 * API fetch wrapper
 */
export const api = <T = any>(endpoint: string, opts?: RequestInit) =>
  fetch(`${window.env.API_URL}/api/${endpoint}`, opts).then(res => res.json() as T)
