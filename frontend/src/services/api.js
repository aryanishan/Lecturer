const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const TOKEN_KEY = "lecturer-auth-token";
export function getAuthToken() { return window.localStorage.getItem(TOKEN_KEY); }
export function setAuthToken(token) { window.localStorage.setItem(TOKEN_KEY, token); }
export function clearAuthToken() { window.localStorage.removeItem(TOKEN_KEY); }
async function request(path, options = {}) {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Request failed.");
  return body;
}
export function registerAccount(credentials) { return request("/auth/register", { method: "POST", body: JSON.stringify(credentials) }); }
export function loginAccount(credentials) { return request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }); }
export function getAccountData() { return request("/data"); }
export function saveAccountData(data) { return request("/data", { method: "PUT", body: JSON.stringify(data) }); }
