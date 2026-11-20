// Thin Gemini client (Google AI Studio). The API key lives ONLY in the server environment.
const base = () => process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta";
const key = () => process.env.GEMINI_API_KEY;
export const aiEnabled = () => Boolean(key());

async function call(path, { method = "POST", body, timeoutMs = 45000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${base()}/${path}`, {
      method,
      headers: { "Content-Type": "application/json", "x-goog-api-key": key() },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not json */ }
    if (!res.ok) {
      const err = new Error(json?.error?.message || `Gemini HTTP ${res.status}`);
      err.upstreamStatus = res.status;
      throw err;
    }
    return json;
  } catch (e) {
    if (e.name === "AbortError") { const err = new Error("AI timed out"); err.upstreamStatus = 504; throw err; }
    throw e;
  } finally { clearTimeout(timer); }
}

/** Map any upstream failure to a safe, friendly HTTP error (never leak the raw upstream message). */
export function toHttpError(err) {
  const s = err?.upstreamStatus;
  if (err?.status && err.status < 500) return { status: err.status, message: err.message };
  if (s === 429) return { status: 429, message: "The AI is busy right now. Please try again in a minute." };
  if (s === 503) return { status: 503, message: "The AI is very busy right now (high demand at Google). Please try again in a minute." };
  if (s === 400 || s === 401 || s === 403 || s === 404) { console.error("[AI] configuration/upstream error:", err.message); return { status: 503, message: "The AI assistant isn't available right now." }; }
  console.error("[AI] upstream failure:", err?.message);
  return { status: 502, message: "The AI service didn't respond. Please try again." };
}

// ---- model discovery: model names change often, so pick from what the key can actually use ----
let cache = { at: 0, chat: null, chatChain: [], embed: null };
const ver = (n) => Number((String(n).match(/(\d+(?:\.\d+)?)/) || [0, 0])[1]);
export function pickModels(models, env = {}) {
  const gen = models.filter((m) => m.supportedGenerationMethods?.includes("generateContent")).map((m) => m.name.replace(/^models\//, ""));
  const emb = models.filter((m) => m.supportedGenerationMethods?.some((x) => /embed/i.test(x))).map((m) => m.name.replace(/^models\//, ""));
  const byVer = (a, b) => ver(b) - ver(a);
  const flash = gen.filter((n) => /^gemini-[\d.]+-flash$/.test(n)).sort(byVer);
  const lite = gen.filter((n) => /^gemini-[\d.]+-flash-lite$/.test(n)).sort(byVer);
  const loose = gen.find((n) => /flash/.test(n) && !/(lite|image|tts|live|audio|preview|exp|thinking|robotics)/.test(n));
  // Ordered fallback chain: if one model is overloaded ("high demand") the next one is tried automatically.
  const chain = [...new Set([env.chat, ...flash.slice(0, 2), gen.includes("gemini-flash-latest") && "gemini-flash-latest", gen.includes("gemini-flash-lite-latest") && "gemini-flash-lite-latest", lite[0], loose].filter(Boolean))];
  const embeds = emb.filter((n) => /embedding/.test(n));
  const stable = embeds.filter((n) => !/(preview|exp)/.test(n)).sort(byVer); // previews are less reliable
  return { chat: chain[0] || "gemini-flash-latest", chatChain: chain.length ? chain : ["gemini-flash-latest"], embed: env.embed || stable[0] || embeds.sort(byVer)[0] || "gemini-embedding-001" };
}
export async function resolveModels() {
  if (cache.chat && Date.now() - cache.at < 6 * 3600 * 1000) return cache;
  const env = { chat: process.env.GEMINI_MODEL, embed: process.env.GEMINI_EMBED_MODEL };
  try {
    const list = await call("models?pageSize=200", { method: "GET", timeoutMs: 15000 });
    cache = { at: Date.now(), ...pickModels(list.models || [], env) };
  } catch {
    cache = { at: Date.now(), chat: env.chat || "gemini-flash-latest", chatChain: [env.chat || "gemini-flash-latest"], embed: env.embed || "gemini-embedding-001" };
  }
  console.log(`[AI] chat models (in order): ${cache.chatChain.join(", ")} | embedding model: ${cache.embed}`);
  return cache;
}
export const resetModelCache = () => { cache = { at: 0, chat: null, chatChain: [], embed: null }; };

const normalize = (v) => { const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1; return v.map((x) => x / n); };

export async function embedTexts(texts, taskType = "RETRIEVAL_DOCUMENT") {
  const { embed } = await resolveModels();
  const dim = Number(process.env.GEMINI_EMBED_DIM || 256);
  const out = [];
  for (let i = 0; i < texts.length; i += 40) {
    const batch = texts.slice(i, i + 40);
    const mk = (extra) => ({ requests: batch.map((t) => ({ model: `models/${embed}`, content: { parts: [{ text: t.slice(0, 8000) }] }, ...extra })) });
    let res;
    try { res = await call(`models/${embed}:batchEmbedContents`, { body: mk({ taskType, outputDimensionality: dim }) }); }
    catch (e) { if (e.upstreamStatus === 400) res = await call(`models/${embed}:batchEmbedContents`, { body: mk({}) }); else throw e; }
    (res.embeddings || []).forEach((e) => out.push(normalize(e.values)));
  }
  if (out.length !== texts.length) throw new Error("Embedding count mismatch");
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const RETRY = [429, 500, 503, 504];

export async function generate({ system, messages, temperature = 0.4, maxOutputTokens = 2048 }) {
  const { chatChain } = await resolveModels();
  const started = Date.now();
  let lastErr;
  for (const model of chatChain.slice(0, 3)) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (Date.now() - started > 50000) throw lastErr || new Error("AI timed out");
      try {
        const res = await call(`models/${model}:generateContent`, {
          timeoutMs: 30000,
          body: {
            systemInstruction: { parts: [{ text: system }] },
            contents: messages.map((m) => ({ role: m.role === "model" ? "model" : "user", parts: [{ text: m.text }] })),
            generationConfig: { temperature, maxOutputTokens },
          },
        });
        if (res.promptFeedback?.blockReason) { const e = new Error("I can't help with that request."); e.status = 422; throw e; }
        const text = (res.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
        if (!text) { const e = new Error("The AI returned an empty answer. Try rephrasing."); e.status = 422; throw e; }
        return text;
      } catch (e) {
        lastErr = e;
        if (e.upstreamStatus === 404) break;                       // model not available for this key: next model
        if (!RETRY.includes(e.upstreamStatus)) throw e;            // real errors (bad key, blocked content…) stop here
        if (attempt === 0) await sleep(500 + Math.random() * 400); // brief pause, one retry on the same model
      }
    }
    console.warn(`[AI] ${model} is busy or unavailable, trying the next model`);
  }
  throw lastErr;
}
