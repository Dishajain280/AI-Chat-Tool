/**
 * Vercel Serverless Function — Gemini API proxy
 * API key lives only on the server, never in the browser bundle.
 * 
 * Routes:
 *   POST /api/chat?stream=true  → streamGenerateContent (SSE)
 *   POST /api/chat?stream=false → generateContent (JSON)
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API_KEY not configured on server." });
  }

  const { contents, system_instruction } = req.body;
  if (!contents || !Array.isArray(contents)) {
    return res.status(400).json({ error: "Invalid request body: missing contents array." });
  }

  const geminiBody = { contents };
  if (system_instruction) geminiBody.system_instruction = system_instruction;

  const useStream = req.query.stream !== "false";

  try {
    const geminiUrl = useStream
      ? `${GEMINI_BASE}:streamGenerateContent?alt=sse&key=${apiKey}`
      : `${GEMINI_BASE}:generateContent?key=${apiKey}`;

    const upstream = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json({
        error: err?.error?.message || "Upstream Gemini error",
      });
    }

    if (useStream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
      res.end();
    } else {
      const data = await upstream.json();
      return res.status(200).json(data);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
