// No API key in the browser at all.
// Dev:  Vite proxy forwards /api/gemini* → Gemini (key stays in vite.config.js server-side)
// Prod: Vercel serverless /api/chat.js forwards → Gemini (key stays in Vercel env vars)

const isProd = import.meta.env.PROD;

export const STREAM_URL  = isProd ? "/api/chat?stream=true"  : "/api/gemini-stream";
export const STANDARD_URL = isProd ? "/api/chat?stream=false" : "/api/gemini";
export const IS_PROXY    = isProd; // only prod uses the /api/chat wrapper body format

export const MAX_CHARS         = 2000;
export const THEME_KEY         = "chat_theme";
export const SYSTEM_PROMPT_KEY = "sys_prompt";
export const PERSONA_KEY       = "active_persona";
