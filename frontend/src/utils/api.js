const FALLBACK_RENDER_BASE = "https://tech-genie-backend.onrender.com";

export function resolveApiBase() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) return envUrl.trim().replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const { origin, hostname } = window.location;
    if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(hostname)) {
      return "http://localhost:5050";
    }
    if (hostname.endsWith(".onrender.com")) {
      return FALLBACK_RENDER_BASE;
    }
    return origin.replace(/\/$/, "");
  }

  return FALLBACK_RENDER_BASE;
}

export function buildApiUrl(path = "") {
  const base = resolveApiBase();
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path;

  const cleanedBase = base.replace(/\/$/, "");
  const cleanedPath = path.startsWith("/") ? path : `/${path}`;

  if (cleanedBase.endsWith("/api") && cleanedPath.startsWith("/api")) {
    return `${cleanedBase}${cleanedPath.replace(/^\/api/, "")}` || `${cleanedBase}/`;
  }

  return `${cleanedBase}${cleanedPath}`;
}
