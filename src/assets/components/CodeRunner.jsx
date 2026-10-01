import { useState, useRef } from "react";

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/**
 * Runs JavaScript code in a sandboxed iframe and shows stdout/errors inline.
 * Only rendered for language="javascript" or "js" code blocks.
 */
export default function CodeRunner({ code, isDark }) {
  const [output, setOutput] = useState(null); // null = not run yet
  const [running, setRunning] = useState(false);
  const iframeRef = useRef(null);

  const runCode = () => {
    setRunning(true);
    setOutput(null);

    const lines = [];

    // Build a sandboxed HTML page that captures console.log output
    const html = `<!DOCTYPE html>
<html>
<head><script>
  const _logs = [];
  const _orig = console.log;
  console.log = (...args) => {
    _logs.push(args.map(a => {
      try { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a); }
      catch { return String(a); }
    }).join(' '));
    _orig(...args);
  };
  window.onerror = (msg, src, line, col, err) => {
    parent.postMessage({ type: 'error', text: \`\${msg} (line \${line})\` }, '*');
    return true;
  };
  window.addEventListener('load', () => {
    try {
      ${code}
      parent.postMessage({ type: 'done', logs: _logs }, '*');
    } catch(e) {
      parent.postMessage({ type: 'error', text: e.message }, '*');
    }
  });
<\/script></head>
<body></body>
</html>`;

    const handleMessage = (event) => {
      if (event.data?.type === "done") {
        setOutput({ ok: true, lines: event.data.logs });
      } else if (event.data?.type === "error") {
        setOutput({ ok: false, lines: [event.data.text] });
      }
      setRunning(false);
      window.removeEventListener("message", handleMessage);
    };

    window.addEventListener("message", handleMessage);

    // Safety timeout — remove listener after 5s
    setTimeout(() => {
      window.removeEventListener("message", handleMessage);
      setRunning(false);
    }, 5000);

    if (iframeRef.current) {
      iframeRef.current.srcdoc = html;
    }
  };

  return (
    <div className="mt-1">
      {/* Run button */}
      <div className="flex items-center gap-2">
        <button
          onClick={runCode}
          disabled={running}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
            isDark
              ? "bg-emerald-700/40 text-emerald-300 hover:bg-emerald-700/70 disabled:opacity-40"
              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-40"
          }`}
        >
          <PlayIcon />
          {running ? "Running…" : "Run"}
        </button>
        {output && (
          <button
            onClick={() => setOutput(null)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-all ${
              isDark ? "text-zinc-500 hover:text-zinc-300" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <XIcon /> Clear
          </button>
        )}
      </div>

      {/* Hidden iframe sandbox */}
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts"
        title="code-runner"
        className="hidden"
      />

      {/* Output panel */}
      {output && (
        <div
          className={`mt-2 rounded-lg px-3 py-2 text-xs font-mono whitespace-pre-wrap ${
            output.ok
              ? isDark ? "bg-zinc-900 text-emerald-300 border border-zinc-700" : "bg-slate-50 text-emerald-700 border border-slate-200"
              : isDark ? "bg-red-950/40 text-red-300 border border-red-800" : "bg-red-50 text-red-600 border border-red-200"
          }`}
        >
          {output.lines.length === 0
            ? <span className="opacity-50">// No output</span>
            : output.lines.join("\n")}
        </div>
      )}
    </div>
  );
}
