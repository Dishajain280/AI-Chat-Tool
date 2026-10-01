import ReactMarkdown from "react-markdown";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import CodeRunner from "./CodeRunner";

// Register only the most common languages to keep bundle small
import js from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import ts from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";

SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("js", js);
SyntaxHighlighter.registerLanguage("typescript", ts);
SyntaxHighlighter.registerLanguage("ts", ts);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("shell", bash);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("sql", sql);

/**
 * Theme-aware markdown renderer.
 * @param {string}  content  - raw markdown string
 * @param {boolean} isDark   - true = dark theme, false = light theme
 */
const MarkdownRenderer = ({ content, isDark = true }) => {
  const codeStyle = isDark ? oneDark : oneLight;
  const inlineCodeCls = isDark
    ? "bg-zinc-900 text-pink-400 px-1.5 py-0.5 rounded text-xs font-mono"
    : "bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded text-xs font-mono";

  return (
    <ReactMarkdown
      components={{
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const lang = match?.[1] || "";
          const isRunnable = ["javascript", "js"].includes(lang);
          const codeStr = String(children).replace(/\n$/, "");

          return !inline && match ? (
            <div>
              <SyntaxHighlighter
                style={codeStyle}
                language={lang}
                PreTag="div"
                className="rounded-lg text-sm my-2"
                {...props}
              >
                {codeStr}
              </SyntaxHighlighter>
              {isRunnable && <CodeRunner code={codeStr} isDark={isDark} />}
            </div>
          ) : (
            <code className={inlineCodeCls} {...props}>
              {children}
            </code>
          );
        },
        h1: ({ children }) => (
          <h1 className="text-xl font-bold mt-4 mb-2 theme-heading">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-bold mt-3 mb-2 theme-heading">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold mt-2 mb-1 theme-subheading">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-sm leading-relaxed mb-2 theme-text">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside text-sm space-y-1 mb-2 pl-2 theme-text">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside text-sm space-y-1 mb-2 pl-2 theme-text">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="theme-text">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold theme-heading">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic theme-muted">{children}</em>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="min-w-full text-sm border theme-border rounded-lg">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="theme-table-head">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y theme-divider">{children}</tbody>
        ),
        tr: ({ children }) => <tr>{children}</tr>,
        th: ({ children }) => (
          <th className="px-3 py-2 text-left font-semibold">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 theme-text">{children}</td>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-purple-500 pl-4 my-2 theme-muted italic">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="theme-divider-solid my-3" />,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
