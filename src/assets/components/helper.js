import { STREAM_URL, STANDARD_URL } from "./constants";

// ── Error handling ────────────────────────────────────────────────────────────

export function getErrorMessage(error) {
  const msg = error?.message || "";
  // Pass through real Gemini error messages directly
  if (msg.startsWith("GEMINI:")) return msg.replace("GEMINI:", "").trim();
  if (msg === "QUOTA_EXCEEDED")
    return "API quota exceeded. Please wait a moment and try again.";
  if (msg === "AUTH_ERROR")
    return "Invalid API key — please set a valid AIzaSy... key in your .env file.";
  if (msg === "BAD_REQUEST")
    return "Bad request (400). Check browser console for details.";
  if (msg === "EMPTY_RESPONSE")
    return "Gemini returned an empty response. Please try again.";
  if (msg.startsWith("HTTP_ERROR"))
    return `Server error (${msg.replace("HTTP_ERROR_", "")}). Please try again later.`;
  if (!navigator.onLine)
    return "You appear to be offline. Check your internet connection.";
  return msg || "Something went wrong. Please try again.";
}

/**
 * Reads the response body for the real Gemini error message before throwing.
 */
async function throwForStatus(response) {
  if (response.ok) return;
  let detail = "";
  try {
    const errData = await response.clone().json();
    detail = errData?.error?.message || errData?.message || "";
  } catch {
    try { detail = await response.clone().text(); } catch { /* ignore */ }
  }
  console.error(`Gemini API error ${response.status}:`, detail);

  if (response.status === 400) throw new Error(detail ? `GEMINI: ${detail}` : "BAD_REQUEST");
  if (response.status === 401 || response.status === 403) throw new Error("AUTH_ERROR");
  if (response.status === 429) throw new Error("QUOTA_EXCEEDED");
  throw new Error(`HTTP_ERROR_${response.status}`);
}

// ── Build request body ────────────────────────────────────────────────────────

function buildGeminiBody(history, systemPrompt) {
  // This is the exact format Gemini expects — used in both dev (direct proxy) and prod (via /api/chat)
  const body = { contents: history };
  if (systemPrompt?.trim()) {
    body.system_instruction = { parts: [{ text: systemPrompt.trim() }] };
  }
  return body;
}

// ── Standard (non-streaming) ──────────────────────────────────────────────────

export async function sendMessage(history, systemPrompt = "") {
  const body = buildGeminiBody(history, systemPrompt);

  const response = await fetch(STANDARD_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  await throwForStatus(response);

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("EMPTY_RESPONSE");
  return text;
}

// ── Streaming ─────────────────────────────────────────────────────────────────

export async function streamMessage(history, systemPrompt = "", onChunk, signal) {
  const body = buildGeminiBody(history, systemPrompt);

  const response = await fetch(STREAM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  await throwForStatus(response);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // hold incomplete last line

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr || jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);

        // Surface any error embedded in the SSE stream
        if (parsed?.error) {
          const errMsg = parsed.error.message || "Unknown stream error";
          console.error("Gemini stream error:", errMsg);
          throw new Error(`GEMINI: ${errMsg}`);
        }

        const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (chunk) {
          fullText += chunk;
          onChunk(fullText);
        }
      } catch (e) {
        if (e.message?.startsWith("GEMINI:")) throw e; // re-throw real errors
        // otherwise malformed chunk — skip
      }
    }
  }

  if (!fullText) throw new Error("EMPTY_RESPONSE");
  return fullText;
}

// ── Image encoding ────────────────────────────────────────────────────────────

export async function fileToGeminiPart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve({ inline_data: { mime_type: file.type, data: base64 } });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Session persistence ───────────────────────────────────────────────────────

export function saveSessions(sessions) {
  try {
    localStorage.setItem("chat_sessions", JSON.stringify(sessions));
  } catch { /* quota exceeded */ }
}

export function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem("chat_sessions")) || [];
  } catch { return []; }
}

// ── Chat export ───────────────────────────────────────────────────────────────

export function exportChat(messages, format = "md", title = "conversation") {
  const lines = [];
  if (format === "md") {
    lines.push(`# ${title}`, "", `*Exported on ${new Date().toLocaleString()}*`, "");
    for (const msg of messages) {
      const ts = msg.timestamp ? ` *(${msg.timestamp})*` : "";
      lines.push(
        msg.role === "user" ? `### 🧑 You${ts}` : `### 🤖 Assistant${ts}`,
        "", msg.content, "", "---", ""
      );
    }
  } else {
    lines.push(`Conversation: ${title}`, `Exported: ${new Date().toLocaleString()}`, "=".repeat(60), "");
    for (const msg of messages) {
      const ts = msg.timestamp ? ` [${msg.timestamp}]` : "";
      lines.push(`${msg.role === "user" ? "You" : "Assistant"}${ts}:`, msg.content, "");
    }
  }
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, "_").slice(0, 40)}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Auto-rename session title via Gemini ─────────────────────────────────────

export async function generateTitle(userMsg, assistantMsg) {
  const prompt = `Based on this conversation, generate a short 4-6 word title. Reply with ONLY the title, no punctuation, no quotes.\n\nUser: ${userMsg}\nAssistant: ${assistantMsg.slice(0, 200)}`;
  try {
    const body = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
    const response = await fetch(STANDARD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const title = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return title && title.length < 80 ? title : null;
  } catch {
    return null;
  }
}

export function formatTimestamp(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
