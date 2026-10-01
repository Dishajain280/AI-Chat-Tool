/**
 * Extracts plain text from uploaded files (PDF, TXT, CSV, MD).
 * Returns a string that gets injected into the Gemini context.
 */

/**
 * @param {File} file
 * @returns {Promise<{text: string, name: string, type: string}>}
 */
export async function extractFileText(file) {
  const name = file.name;
  const ext = name.split(".").pop().toLowerCase();

  if (["txt", "md", "csv", "json", "js", "ts", "py", "html", "css"].includes(ext)) {
    const text = await file.text();
    return { text, name, type: ext };
  }

  if (ext === "pdf") {
    // Read as ArrayBuffer then extract text via basic PDF parsing
    // We use a simple approach: extract readable text from the raw PDF bytes
    const buffer = await file.arrayBuffer();
    const text = extractPdfText(buffer);
    return { text, name, type: "pdf" };
  }

  throw new Error(`Unsupported file type: .${ext}. Supported: PDF, TXT, MD, CSV, JSON, JS, TS, PY`);
}

/**
 * Minimal PDF text extractor — pulls out plain text streams from PDF binary.
 * Not as accurate as pdf.js but keeps the bundle tiny (zero deps).
 */
function extractPdfText(buffer) {
  const bytes = new Uint8Array(buffer);
  const str = new TextDecoder("latin1").decode(bytes);

  const texts = [];

  // Extract text from BT...ET blocks (PDF text operators)
  const btEtRegex = /BT([\s\S]*?)ET/g;
  let match;
  while ((match = btEtRegex.exec(str)) !== null) {
    const block = match[1];
    // Extract strings from Tj, TJ, ' operators
    const strRegex = /\(([^)]*)\)\s*(?:Tj|')/g;
    let strMatch;
    while ((strMatch = strRegex.exec(block)) !== null) {
      const decoded = strMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "")
        .replace(/\\t/g, " ")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\");
      if (decoded.trim()) texts.push(decoded);
    }
    // TJ arrays: [(text) n (text)]
    const tjRegex = /\[([\s\S]*?)\]\s*TJ/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      const inner = tjMatch[1];
      const innerStr = /\(([^)]*)\)/g;
      let innerMatch;
      while ((innerMatch = innerStr.exec(inner)) !== null) {
        if (innerMatch[1].trim()) texts.push(innerMatch[1]);
      }
    }
  }

  const result = texts.join(" ").replace(/\s+/g, " ").trim();
  return result || "[Could not extract text from PDF. Try copy-pasting the content instead.]";
}

/**
 * Formats extracted file content for injection into the Gemini prompt.
 */
export function buildFileContext(fileData) {
  const header = `[Attached file: ${fileData.name} (${fileData.type.toUpperCase()})]`;
  const content = fileData.text.slice(0, 8000); // cap at ~8k chars to stay within context
  const truncNote = fileData.text.length > 8000 ? "\n[... content truncated to first 8000 characters ...]" : "";
  return `${header}\n\n${content}${truncNote}`;
}
