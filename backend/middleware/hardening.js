import zlib from "zlib";

/**
 * Express 4 does not catch errors thrown inside async route handlers: one bad id
 * (CastError) used to crash the whole Node process, which made Render restart it —
 * that is a big cause of "the site randomly takes a minute to load".
 * This forwards rejected promises to the error handler instead.
 */
export async function installAsyncErrorForwarding() {
  try {
    const { default: Layer } = await import("express/lib/router/layer.js");
    Layer.prototype.handle_request = function handleRequest(req, res, next) {
      const fn = this.handle;
      if (fn.length > 3) return next();
      try {
        const result = fn(req, res, next);
        if (result && typeof result.catch === "function") result.catch(next);
      } catch (err) {
        next(err);
      }
      return undefined;
    };
  } catch (err) {
    console.warn("Async error forwarding not installed:", err.message);
  }
}

function strip(obj) {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) delete obj[key];
    else strip(obj[key]);
  }
}
/** Blocks NoSQL operator injection such as ?category[$ne]=x or {"$gt": ""} bodies. */
export function sanitizeInput(req, res, next) {
  strip(req.body);
  strip(req.query);
  strip(req.params);
  next();
}

/** gzip big JSON responses — far less data over slow mobile connections. */
export function gzipJson(req, res, next) {
  if (!/\bgzip\b/.test(req.headers["accept-encoding"] || "")) return next();
  const original = res.json.bind(res);
  res.json = (body) => {
    if (res.headersSent) return res;
    const text = JSON.stringify(body);
    if (text.length < 1024) return original(body);
    zlib.gzip(text, (err, buf) => {
      if (err) return original(body);
      res.vary("Accept-Encoding");
      res.set({ "Content-Type": "application/json; charset=utf-8", "Content-Encoding": "gzip" });
      return res.send(buf);
    });
    return res;
  };
  return next();
}

export const cacheFor = (seconds) => (req, res, next) => {
  res.set("Cache-Control", `public, max-age=${seconds}, stale-while-revalidate=${seconds * 5}`);
  next();
};

export function errorHandler(maxMb = 50) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err?.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: `File is too large (max ${maxMb} MB).` });
    if (err?.code === "LIMIT_FILE_COUNT" || err?.code === "LIMIT_UNEXPECTED_FILE") return res.status(400).json({ error: "Too many files, or an unexpected file field." });
    if (err?.status && err.status < 500) return res.status(err.status).json({ error: err.message });
    if (err?.name === "CastError") return res.status(400).json({ error: "Invalid id." });
    if (err?.name === "ValidationError") return res.status(400).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: "Something went wrong on the server" });
  };
}
