import axios from "axios";
import { auth } from "../firebase.js";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000", timeout: 60000 });
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) config.headers.Authorization = `Bearer ${await user.getIdToken()}`;
  return config;
});

const cache = new Map();
const inflight = new Map();
export function cachedGet(url, { params, ttl = 60000 } = {}) {
  const key = url + JSON.stringify(params || {});
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return Promise.resolve(hit.data);
  if (inflight.has(key)) return inflight.get(key);
  const p = api.get(url, { params }).then((r) => { cache.set(key, { at: Date.now(), data: r.data }); return r.data; }).finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
export const clearApiCache = () => cache.clear();

export function errorMessage(err, t) {
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.code === "ECONNABORTED") return t("err.timeout");
  if (err?.code === "ERR_NETWORK" || err?.message === "Network Error") return t("err.network");
  if (err?.response?.status === 413) return t("err.tooLarge");
  if (err?.response?.status === 429) return t("err.rate");
  return err?.message && !String(err.message).startsWith("Request failed") ? err.message : t("err.generic");
}
export default api;
