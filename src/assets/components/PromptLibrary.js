export const PROMPT_LIBRARY_KEY = "prompt_library";

// ── Built-in prompt templates ─────────────────────────────────────────────────
export const BUILT_IN_PROMPTS = [
  // Code
  { id: "bt-1", category: "Code", label: "Write unit tests",       template: "Write unit tests for the following code:\n\n" },
  { id: "bt-2", category: "Code", label: "Review this code",        template: "Review this code for bugs, performance issues, and best practices:\n\n" },
  { id: "bt-3", category: "Code", label: "Explain this code",       template: "Explain what this code does step by step:\n\n" },
  { id: "bt-4", category: "Code", label: "Refactor this code",      template: "Refactor this code to be cleaner and more maintainable:\n\n" },
  { id: "bt-5", category: "Code", label: "Find bugs",               template: "Find all bugs in this code and explain how to fix them:\n\n" },
  { id: "bt-6", category: "Code", label: "Convert to TypeScript",   template: "Convert the following JavaScript code to TypeScript with proper types:\n\n" },
  // Writing
  { id: "bt-7", category: "Writing", label: "Improve my writing",   template: "Improve the clarity and flow of this text:\n\n" },
  { id: "bt-8", category: "Writing", label: "Summarize",            template: "Summarize the following in 3-5 bullet points:\n\n" },
  { id: "bt-9", category: "Writing", label: "Make it professional", template: "Rewrite the following in a professional tone:\n\n" },
  // Explain
  { id: "bt-10", category: "Explain", label: "ELI5",                template: "Explain the following like I'm 5 years old:\n\n" },
  { id: "bt-11", category: "Explain", label: "Pros and cons",       template: "List the pros and cons of:\n\n" },
  { id: "bt-12", category: "Explain", label: "Compare two things",  template: "Compare and contrast the following two things:\n\n" },
  // Productivity
  { id: "bt-13", category: "Productivity", label: "Create a plan",  template: "Create a step-by-step plan for:\n\n" },
  { id: "bt-14", category: "Productivity", label: "Brainstorm ideas", template: "Brainstorm 10 creative ideas for:\n\n" },
  { id: "bt-15", category: "Productivity", label: "Write an email",  template: "Write a professional email about:\n\n" },
];

export function loadUserPrompts() {
  try {
    return JSON.parse(localStorage.getItem(PROMPT_LIBRARY_KEY)) || [];
  } catch { return []; }
}

export function saveUserPrompts(prompts) {
  try {
    localStorage.setItem(PROMPT_LIBRARY_KEY, JSON.stringify(prompts));
  } catch { /* quota */ }
}

export function getAllPrompts() {
  return [...BUILT_IN_PROMPTS, ...loadUserPrompts()];
}
