import "./App.css";
import { useRef, useState, useEffect, useCallback } from "react";
import { MAX_CHARS, THEME_KEY, SYSTEM_PROMPT_KEY, PERSONA_KEY } from "./assets/components/constants";
import {
  streamMessage,
  getErrorMessage,
  saveSessions,
  loadSessions,
  fileToGeminiPart,
  exportChat,
  formatTimestamp,
  generateTitle,
} from "./assets/components/helper";
import MarkdownRenderer from "./assets/components/MarkdownRenderer";
import PromptLibraryModal from "./assets/components/PromptLibraryModal";
import { extractFileText, buildFileContext } from "./assets/components/FileProcessor";
import { PERSONAS } from "./assets/components/personas";

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
);
const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 text-green-500">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const RetryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 .49-4" />
  </svg>
);
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);
const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const PinIcon = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <path d="M12 2a5 5 0 0 1 5 5c0 5-5 11-5 11S7 12 7 7a5 5 0 0 1 5-5z" />
    <circle cx="12" cy="7" r="2" fill="currentColor" stroke="none" />
  </svg>
);
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const KeyboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
  </svg>
);
const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const LibraryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const BranchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><circle cx="6" cy="6" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Explain quantum computing in simple terms",
  "Write a Python function to reverse a linked list",
  "What are the SOLID principles in software design?",
  "Compare REST vs GraphQL APIs",
];

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable components
// ─────────────────────────────────────────────────────────────────────────────

function CopyButton({ text, isDark }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
        isDark
          ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700"
          : "text-slate-400 hover:text-slate-600 hover:bg-slate-200"
      }`}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function TypingIndicator({ isDark }) {
  return (
    <div className="flex justify-start">
      <div className={`px-4 py-3 rounded-lg rounded-bl-none flex items-center gap-1.5 ${isDark ? "bg-zinc-700/60" : "bg-slate-200"}`}>
        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function EmptyState({ onSuggestion, isDark }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-12">
      <div>
        <div className="text-5xl mb-3">✨</div>
        <h2 className={`text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-slate-800"}`}>How can I help you?</h2>
        <p className={`text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>Ask anything — code, science, writing, math, and more.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className={`text-left text-sm rounded-xl px-4 py-3 border transition-all ${
              isDark
                ? "text-zinc-300 bg-zinc-800 border-zinc-700 hover:border-purple-500 hover:text-white"
                : "text-slate-600 bg-white border-slate-200 hover:border-purple-400 hover:text-slate-900 shadow-sm"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function ErrorBanner({ message, onDismiss }) {
  return (
    <div className="flex items-start gap-3 bg-red-900/40 border border-red-700 text-red-200 text-sm px-4 py-3 rounded-lg mb-3">
      <span className="text-red-400 mt-0.5">⚠</span>
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-200 ml-2 font-bold leading-none">×</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// System Prompt Modal
// ─────────────────────────────────────────────────────────────────────────────
function SystemPromptModal({ value, onSave, onClose, isDark }) {
  const [draft, setDraft] = useState(value);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl ${isDark ? "bg-zinc-800 border border-zinc-700" : "bg-white border border-slate-200"}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-800"}`}>System Prompt</h2>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-700" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}>
            <XIcon />
          </button>
        </div>
        <p className={`text-xs mb-3 ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
          Set a persona or context for the AI. e.g. "You are a senior React developer. Be concise and use code examples."
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          className={`w-full rounded-xl px-4 py-3 text-sm outline-none resize-none border transition-colors ${
            isDark
              ? "bg-zinc-900 text-white border-zinc-700 focus:border-purple-500 placeholder-zinc-500"
              : "bg-slate-50 text-slate-800 border-slate-300 focus:border-purple-400 placeholder-slate-400"
          }`}
          placeholder="Leave empty for default Gemini behavior…"
        />
        <div className="flex gap-3 mt-4 justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-700" : "text-slate-500 hover:bg-slate-100"}`}
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(draft); onClose(); }}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export Modal
// ─────────────────────────────────────────────────────────────────────────────
function ExportModal({ messages, sessionTitle, onClose, isDark }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl ${isDark ? "bg-zinc-800 border border-zinc-700" : "bg-white border border-slate-200"}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Export Chat</h2>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-700" : "text-slate-400 hover:bg-slate-100"}`}>
            <XIcon />
          </button>
        </div>
        <p className={`text-sm mb-5 ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
          Download this conversation in your preferred format.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => { exportChat(messages, "md", sessionTitle); onClose(); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
              isDark
                ? "border-zinc-700 text-zinc-200 hover:border-purple-500 hover:bg-zinc-700"
                : "border-slate-200 text-slate-700 hover:border-purple-400 hover:bg-slate-50"
            }`}
          >
            <DownloadIcon /> Markdown (.md)
          </button>
          <button
            onClick={() => { exportChat(messages, "txt", sessionTitle); onClose(); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
              isDark
                ? "border-zinc-700 text-zinc-200 hover:border-purple-500 hover:bg-zinc-700"
                : "border-slate-200 text-slate-700 hover:border-purple-400 hover:bg-slate-50"
            }`}
          >
            <DownloadIcon /> Plain text (.txt)
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard Shortcuts Modal
// ─────────────────────────────────────────────────────────────────────────────
const SHORTCUTS = [
  { keys: ["Ctrl", "K"],       desc: "New chat" },
  { keys: ["Ctrl", "/"],       desc: "Focus input" },
  { keys: ["Ctrl", "E"],       desc: "Export chat" },
  { keys: ["Ctrl", "B"],       desc: "Toggle sidebar" },
  { keys: ["Enter"],           desc: "Send message" },
  { keys: ["Shift", "Enter"],  desc: "New line in input" },
  { keys: ["Escape"],          desc: "Close modal / stop" },
  { keys: ["?"],               desc: "Show this panel" },
];

function ShortcutsModal({ onClose, isDark }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${isDark ? "bg-zinc-800 border border-zinc-700" : "bg-white border border-slate-200"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-800"}`}>Keyboard Shortcuts</h2>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-700" : "text-slate-400 hover:bg-slate-100"}`}>
            <XIcon />
          </button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map(({ keys, desc }) => (
            <div key={desc} className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? "text-zinc-300" : "text-slate-600"}`}>{desc}</span>
              <div className="flex items-center gap-1">
                {keys.map((k, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${isDark ? "bg-zinc-700 text-zinc-200 border border-zinc-600" : "bg-slate-100 text-slate-700 border border-slate-300"}`}>
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className={`text-xs mt-5 ${isDark ? "text-zinc-500" : "text-slate-400"}`}>Press <kbd className={`px-1.5 py-0.5 rounded font-mono ${isDark ? "bg-zinc-700 text-zinc-300" : "bg-slate-100 text-slate-600"}`}>?</kbd> anywhere to toggle this panel.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [geminiHistory, setGeminiHistory] = useState([]);
  const [streaming, setStreaming] = useState(false);       // true while streaming
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionTitle, setSessionTitle] = useState("New Chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Feature-specific state
  const [isDark, setIsDark] = useState(() => localStorage.getItem(THEME_KEY) !== "light");
  const [systemPrompt, setSystemPrompt] = useState(() => localStorage.getItem(SYSTEM_PROMPT_KEY) || "");
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isListening, setIsListening] = useState(false);

  // Phase 1 feature state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchInputRef = useRef(null);

  // Phase 2 feature state
  const [activePersona, setActivePersona] = useState(
    () => PERSONAS.find((p) => p.id === (localStorage.getItem(PERSONA_KEY) || "default")) || PERSONAS[0]
  );
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [docFile, setDocFile] = useState(null);       // attached doc (PDF/TXT/CSV/MD)
  const [docContext, setDocContext] = useState(null);  // extracted text context
  const [slashMenu, setSlashMenu] = useState(false);   // / command menu open
  const [slashFilter, setSlashFilter] = useState(""); // filter string after /
  const docInputRef = useRef(null);

  // Refs
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);
  const abortRef = useRef(null);          // AbortController for streaming
  const recognitionRef = useRef(null);    // SpeechRecognition instance

  // ── Theme ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("light", !isDark);
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  // ── Global keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      // Don't fire inside text inputs/textareas (except specific combos)
      const inInput = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);

      if (e.key === "?" && !inInput) {
        e.preventDefault();
        setShowShortcuts((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        setShowShortcuts(false);
        setShowSearch(false);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        startNewChat();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setSidebarOpen((v) => !v);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "e" && messages.length > 0) {
        e.preventDefault();
        setShowExportModal(true);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streaming]);

  // ── Persist sessions ───────────────────────────────────────────────────────
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const charCount = question.length;
  const overLimit = charCount > MAX_CHARS;

  // ── Send / stream message ──────────────────────────────────────────────────
  const askQuestion = useCallback(async (text) => {
    const q = (text || question).trim();
    if (!q || streaming || overLimit) return;

    setError(null);
    setQuestion("");

    const ts = new Date().toISOString();
    const userMsg = { role: "user", content: q, timestamp: ts, image: imagePreview || null };

    // Build Gemini parts — support image + doc context if attached
    const userParts = [{ text: docContext ? `${docContext}\n\n---\n\n${q}` : q }];
    if (docContext) {
      // Clear doc after first use
      setDocFile(null);
      setDocContext(null);
    }
    // Effective system prompt = persona prompt OR custom system prompt
    const effectiveSystemPrompt = activePersona.prompt || systemPrompt;
    if (imageFile) {
      try {
        imagePart = await fileToGeminiPart(imageFile);
        userParts.unshift(imagePart); // image before text
      } catch {
        // image encoding failed — send text only
      }
      setImageFile(null);
      setImagePreview(null);
    }

    setMessages((prev) => [...prev, userMsg]);

    const updatedHistory = [
      ...geminiHistory,
      { role: "user", parts: userParts },
    ];
    setGeminiHistory(updatedHistory);
    setStreaming(true);

    // Add a placeholder model message that we'll update chunk by chunk
    const modelMsgId = Date.now();
    setMessages((prev) => [...prev, { role: "model", content: "", timestamp: new Date().toISOString(), id: modelMsgId }]);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const fullText = await streamMessage(
        updatedHistory,
        systemPrompt,
        (accumulated) => {
          // Update the last (placeholder) model message in-place
          setMessages((prev) =>
            prev.map((m) => (m.id === modelMsgId ? { ...m, content: accumulated } : m))
          );
        },
        abort.signal
      );

      const finalHistory = [
        ...updatedHistory,
        { role: "model", parts: [{ text: fullText }] },
      ];
      setGeminiHistory(finalHistory);

      // Persist session
      setSessions((prev) => {
        const title = q.length > 50 ? q.slice(0, 50) + "…" : q;
        setSessionTitle(title);
        if (activeSessionId) {
          return prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, title, updatedAt: new Date().toISOString() }
              : s
          );
        } else {
          const newId = Date.now() + 1;
          setActiveSessionId(newId);
          return [{ id: newId, title, createdAt: new Date().toISOString() }, ...prev];
        }
      });

      // Auto-rename: only on the FIRST exchange (1 user + 1 model message)
      const isFirstExchange = geminiHistory.length === 1; // only user msg was there before
      if (isFirstExchange) {
        generateTitle(q, fullText).then((aiTitle) => {
          if (!aiTitle) return;
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSessionId || (!activeSessionId && prev[0]?.id)
                ? { ...s, title: aiTitle }
                : s
            )
          );
          setSessionTitle(aiTitle);
        });
      }
    } catch (err) {
      if (err.name === "AbortError") {
        // User stopped generation — keep partial text as-is
      } else {
        setError(getErrorMessage(err));
        setMessages((prev) => prev.slice(0, -2)); // remove user + empty model bubble
        setGeminiHistory(updatedHistory.slice(0, -1));
        setQuestion(q);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }, [question, streaming, overLimit, geminiHistory, systemPrompt, imageFile, imagePreview, activeSessionId]);

  // ── Stop streaming ─────────────────────────────────────────────────────────
  const stopGeneration = () => {
    abortRef.current?.abort();
  };

  // ── Regenerate last response ───────────────────────────────────────────────
  const regenerate = useCallback(async () => {
    if (streaming || messages.length < 2) return;
    // Remove the last model message
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setMessages((prev) => prev.slice(0, -1));
    const historyWithoutLast = geminiHistory.slice(0, -1);
    setGeminiHistory(historyWithoutLast);
    // Re-send last user question (only text, no image for regen)
    await askQuestion(lastUser.content);
  }, [streaming, messages, geminiHistory, askQuestion]);

  // ── Keyboard handler ───────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  // ── New chat ───────────────────────────────────────────────────────────────
  const startNewChat = () => {
    setMessages([]);
    setGeminiHistory([]);
    setActiveSessionId(null);
    setSessionTitle("New Chat");
    setError(null);
    setQuestion("");
    setImageFile(null);
    setImagePreview(null);
    inputRef.current?.focus();
  };

  // ── Load session ───────────────────────────────────────────────────────────
  const loadSession = (session) => {
    setMessages(session.messages || []);
    setGeminiHistory(session.history || []);
    setActiveSessionId(session.id);
    setSessionTitle(session.title);
    setError(null);
    setQuestion("");
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  // ── Delete session ─────────────────────────────────────────────────────────
  const deleteSession = (e, id) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) startNewChat();
  };

  // ── Pin / unpin session ────────────────────────────────────────────────────
  const togglePin = (e, id) => {
    e.stopPropagation();
    setSessions((prev) => {
      const updated = prev.map((s) => s.id === id ? { ...s, pinned: !s.pinned } : s);
      // Pinned sessions float to top
      return [
        ...updated.filter((s) => s.pinned),
        ...updated.filter((s) => !s.pinned),
      ];
    });
  };

  // ── Search filter ──────────────────────────────────────────────────────────
  const filteredSessions = searchQuery.trim()
    ? sessions.filter((s) =>
        s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.messages?.some((m) => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : sessions;

  // Focus search input when shown
  useEffect(() => {
    if (showSearch) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [showSearch]);
  // We store messages+history inside each session on every update
  useEffect(() => {
    if (!activeSessionId || messages.length === 0) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, messages, history: geminiHistory }
          : s
      )
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // ── Image selection ────────────────────────────────────────────────────────
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Only image files are supported.");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // ── Voice input (Web Speech API) ───────────────────────────────────────────
  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      setQuestion(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
    inputRef.current?.focus();
  };

  // ── Theme-dependent CSS classes (avoids repeating in JSX) ─────────────────
  const bg = isDark ? "bg-zinc-900" : "bg-slate-50";
  const sidebarBg = isDark ? "bg-gradient-to-b from-zinc-800 to-zinc-900 border-zinc-700" : "bg-white border-slate-200";
  const headerBg = isDark ? "border-zinc-700 bg-zinc-900" : "border-slate-200 bg-white";
  const inputAreaBg = isDark ? "border-zinc-700 bg-zinc-900" : "border-slate-200 bg-white";
  const inputBg = isDark ? "bg-zinc-800 border-zinc-700" : "bg-white border-slate-300 shadow-sm";
  const inputFocus = overLimit ? "border-red-500" : isDark ? "hover:border-purple-500 focus-within:border-purple-500" : "hover:border-purple-400 focus-within:border-purple-400";
  const textColor = isDark ? "text-white" : "text-slate-800";
  const mutedText = isDark ? "text-zinc-500" : "text-slate-400";
  const sessionItemBase = isDark ? "border-zinc-800 hover:bg-zinc-700" : "border-slate-100 hover:bg-slate-50";
  const sessionActiveExtra = isDark ? "bg-zinc-700 border-l-purple-500" : "bg-purple-50 border-l-purple-500";

  return (
    <div className={`flex h-screen ${bg} overflow-hidden transition-colors duration-300`}>

      {/* ── System Prompt Modal ──────────────────────────────────────────────── */}
      {showSystemModal && (
        <SystemPromptModal
          value={systemPrompt}
          onSave={(val) => {
            setSystemPrompt(val);
            localStorage.setItem(SYSTEM_PROMPT_KEY, val);
          }}
          onClose={() => setShowSystemModal(false)}
          isDark={isDark}
        />
      )}

      {/* ── Export Modal ─────────────────────────────────────────────────────── */}
      {showExportModal && (
        <ExportModal
          messages={messages}
          sessionTitle={sessionTitle}
          onClose={() => setShowExportModal(false)}
          isDark={isDark}
        />
      )}

      {/* ── Shortcuts Modal ──────────────────────────────────────────────────── */}
      {showShortcuts && (
        <ShortcutsModal onClose={() => setShowShortcuts(false)} isDark={isDark} />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside
        className={`
          ${sidebarOpen ? "w-64" : "w-0"}
          transition-all duration-300 overflow-hidden flex-shrink-0
          border-r ${sidebarBg} flex flex-col
          absolute md:relative z-20 h-full md:h-auto
        `}
      >
        {/* Sidebar header */}
        <div className={`p-4 border-b ${isDark ? "border-zinc-700" : "border-slate-200"} flex items-center justify-between min-w-0`}>
          <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 truncate">
            Chat History
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setShowSearch((v) => !v)}
              title="Search chats"
              className={`p-1.5 rounded-lg transition-colors ${
                showSearch
                  ? "text-purple-400 bg-purple-900/30"
                  : isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-700" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <SearchIcon />
            </button>
            <button
              onClick={startNewChat}
              title="New chat (Ctrl+K)"
              className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-700" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}
            >
              <PlusIcon />
            </button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className={`px-3 py-2 border-b ${isDark ? "border-zinc-700" : "border-slate-200"}`}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-slate-50 border-slate-300"}`}>
              <SearchIcon />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations…"
                className={`flex-1 bg-transparent text-xs outline-none ${isDark ? "text-white placeholder-zinc-500" : "text-slate-800 placeholder-slate-400"}`}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className={isDark ? "text-zinc-500 hover:text-zinc-300" : "text-slate-400 hover:text-slate-600"}>
                  <XIcon />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Session list */}
        <ul className="flex-1 overflow-y-auto text-sm">
          {filteredSessions.length === 0 && (
            <li className={`p-4 text-xs text-center ${mutedText}`}>
              {searchQuery ? "No results found" : "No conversations yet"}
            </li>
          )}
          {filteredSessions.map((session) => (
            <li
              key={session.id}
              onClick={() => loadSession(session)}
              className={`
                group flex items-center gap-2 px-3 py-3 cursor-pointer
                border-b ${sessionItemBase} transition-colors
                ${activeSessionId === session.id ? `border-l-2 ${sessionActiveExtra}` : ""}
              `}
            >
              {/* Pin indicator */}
              {session.pinned && (
                <span className="text-purple-400 flex-shrink-0">
                  <PinIcon filled />
                </span>
              )}
              <span className={`flex-1 truncate text-xs ${isDark ? "text-zinc-300 group-hover:text-white" : "text-slate-600 group-hover:text-slate-900"}`}>
                {session.title}
              </span>
              {/* Action buttons — reveal on hover */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0 transition-all">
                <button
                  onClick={(e) => togglePin(e, session.id)}
                  title={session.pinned ? "Unpin" : "Pin"}
                  className={`p-0.5 rounded transition-colors ${
                    session.pinned
                      ? "text-purple-400"
                      : isDark ? "text-zinc-500 hover:text-purple-400" : "text-slate-400 hover:text-purple-500"
                  }`}
                >
                  <PinIcon filled={session.pinned} />
                </button>
                <button
                  onClick={(e) => deleteSession(e, session.id)}
                  title="Delete"
                  className={`p-0.5 rounded transition-colors ${isDark ? "text-zinc-500 hover:text-red-400" : "text-slate-400 hover:text-red-500"}`}
                >
                  <TrashIcon />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-10" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main area ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className={`flex items-center gap-2 px-4 md:px-6 py-3 border-b ${headerBg} flex-shrink-0`}>
          <button onClick={() => setSidebarOpen((v) => !v)} className={`p-2 rounded-lg transition-colors ${isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-700" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`} title="Toggle sidebar">
            <MenuIcon />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 truncate">
              Ask Me Anything
            </h1>
            <p className={`text-xs ${mutedText}`}>Gemini 3.8 Flash{systemPrompt ? " · Custom persona active" : ""}</p>
          </div>

          {/* Header action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* System prompt */}
            <button
              onClick={() => setShowSystemModal(true)}
              title="System prompt / persona"
              className={`p-2 rounded-lg transition-colors ${
                systemPrompt
                  ? "text-purple-400 bg-purple-900/30"
                  : isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-700" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <SettingsIcon />
            </button>

            {/* Export — only when there are messages */}
            {messages.length > 0 && (
              <button
                onClick={() => setShowExportModal(true)}
                title="Export chat"
                className={`p-2 rounded-lg transition-colors ${isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-700" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}
              >
                <DownloadIcon />
              </button>
            )}

            {/* Theme toggle */}
            <button
              onClick={() => setIsDark((v) => !v)}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className={`p-2 rounded-lg transition-colors ${isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-700" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Keyboard shortcuts */}
            <button
              onClick={() => setShowShortcuts(true)}
              title="Keyboard shortcuts (?)"
              className={`p-2 rounded-lg transition-colors ${isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-700" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}
            >
              <KeyboardIcon />
            </button>

            {/* New chat */}
            {messages.length > 0 && (
              <button
                onClick={startNewChat}
                className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${isDark ? "text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-500" : "text-slate-500 border-slate-300 hover:text-slate-700 hover:bg-slate-100"}`}
              >
                <PlusIcon /> New
              </button>
            )}
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div className="px-4 md:px-6 pt-3 flex-shrink-0">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
          {messages.length === 0 ? (
            <EmptyState onSuggestion={(s) => askQuestion(s)} isDark={isDark} />
          ) : (
            messages.map((msg, index) => (
              <div key={msg.id || index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "user" ? (
                  /* User bubble */
                  <div className="max-w-xs md:max-w-md lg:max-w-xl">
                    {/* Image preview in bubble */}
                    {msg.image && (
                      <div className="mb-2 rounded-xl overflow-hidden">
                        <img src={msg.image} alt="Attached" className="max-h-48 rounded-xl object-cover" />
                      </div>
                    )}
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm px-4 py-3 rounded-2xl rounded-br-sm">
                      {msg.content}
                    </div>
                    {/* Timestamp */}
                    {msg.timestamp && (
                      <p className={`text-xs mt-1 text-right ${mutedText}`}>{formatTimestamp(msg.timestamp)}</p>
                    )}
                  </div>
                ) : (
                  /* Model bubble */
                  <div className="max-w-xs md:max-w-xl lg:max-w-3xl w-full">
                    <div className={`text-sm px-4 py-3 rounded-2xl rounded-bl-sm border ${isDark ? "bg-zinc-800 border-zinc-700" : "bg-white border-slate-200 shadow-sm"}`}>
                      {msg.content
                        ? <MarkdownRenderer content={msg.content} isDark={isDark} />
                        : <TypingIndicator isDark={isDark} />
                      }
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      {/* Timestamp */}
                      {msg.timestamp && (
                        <span className={`text-xs ${mutedText} px-2`}>{formatTimestamp(msg.timestamp)}</span>
                      )}
                      <CopyButton text={msg.content} isDark={isDark} />
                      {/* Regenerate — only on last model message */}
                      {index === messages.length - 1 && !streaming && (
                        <button
                          onClick={regenerate}
                          title="Regenerate response"
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200"}`}
                        >
                          <RetryIcon /> Retry
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          {/* Show TypingIndicator at bottom only while waiting for first chunk */}
          {streaming && messages[messages.length - 1]?.content === "" && (
            <TypingIndicator isDark={isDark} />
          )}
        </div>

        {/* Input area */}
        <div className={`px-4 md:px-6 py-4 border-t ${inputAreaBg} flex-shrink-0`}>

          {/* Image preview strip */}
          {imagePreview && (
            <div className="flex items-center gap-3 mb-3 max-w-4xl mx-auto">
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="h-14 w-14 rounded-lg object-cover border border-purple-500" />
                <button
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs leading-none"
                >
                  ×
                </button>
              </div>
              <span className={`text-xs ${mutedText}`}>{imageFile?.name}</span>
            </div>
          )}

          <div className="flex gap-2 items-end max-w-4xl mx-auto">
            {/* Image upload button */}
            <button
              onClick={() => imageInputRef.current?.click()}
              title="Attach image"
              className={`p-3 rounded-xl border transition-colors flex-shrink-0 self-end ${
                imageFile
                  ? "border-purple-500 text-purple-400 bg-purple-900/20"
                  : isDark
                  ? "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 bg-zinc-800"
                  : "border-slate-300 text-slate-400 hover:text-slate-700 hover:border-slate-400 bg-white"
              }`}
            >
              <ImageIcon />
            </button>
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

            {/* Voice button */}
            <button
              onClick={toggleVoice}
              title={isListening ? "Stop recording" : "Voice input"}
              className={`p-3 rounded-xl border transition-colors flex-shrink-0 self-end ${
                isListening
                  ? "border-red-500 text-red-400 bg-red-900/20 animate-pulse"
                  : isDark
                  ? "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 bg-zinc-800"
                  : "border-slate-300 text-slate-400 hover:text-slate-700 hover:border-slate-400 bg-white"
              }`}
            >
              <MicIcon />
            </button>

            {/* Text input */}
            <div className="flex-1 flex flex-col">
              <div className={`flex items-center border rounded-xl px-4 py-3 transition-colors ${inputBg} ${inputFocus}`}>
                <textarea
                  ref={inputRef}
                  value={question}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={1}
                  className={`w-full bg-transparent outline-none text-sm resize-none max-h-32 overflow-y-auto placeholder-opacity-60 ${textColor} ${isDark ? "placeholder-zinc-500" : "placeholder-slate-400"}`}
                  placeholder="Ask me anything… (Enter to send, Shift+Enter for new line)"
                  style={{ fieldSizing: "content" }}
                />
              </div>
              {charCount > 0 && (
                <div className={`text-xs mt-1 text-right pr-1 ${overLimit ? "text-red-400" : mutedText}`}>
                  {charCount} / {MAX_CHARS}{overLimit && " — message too long"}
                </div>
              )}
            </div>

            {/* Send / Stop button */}
            {streaming ? (
              <button
                onClick={stopGeneration}
                title="Stop generation"
                className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all flex-shrink-0 self-end"
              >
                <StopIcon />
                <span className="hidden sm:inline">Stop</span>
              </button>
            ) : (
              <button
                onClick={() => askQuestion()}
                disabled={(!question.trim() && !imageFile) || overLimit}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 self-end"
              >
                <SendIcon />
                <span className="hidden sm:inline">Send</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
