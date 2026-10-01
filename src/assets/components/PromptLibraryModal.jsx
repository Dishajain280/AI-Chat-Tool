import { useState, useMemo } from "react";
import { BUILT_IN_PROMPTS, loadUserPrompts, saveUserPrompts } from "./PromptLibrary";

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
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

export default function PromptLibraryModal({ onSelect, onClose, isDark }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [userPrompts, setUserPrompts] = useState(loadUserPrompts);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newTemplate, setNewTemplate] = useState("");

  const allPrompts = useMemo(() => [...BUILT_IN_PROMPTS, ...userPrompts], [userPrompts]);
  const categories = ["All", ...new Set(allPrompts.map((p) => p.category))];

  const filtered = allPrompts.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = !search || p.label.toLowerCase().includes(search.toLowerCase()) || p.template.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const saveNew = () => {
    if (!newLabel.trim() || !newTemplate.trim()) return;
    const newPrompt = {
      id: `user-${Date.now()}`,
      category: "My Prompts",
      label: newLabel.trim(),
      template: newTemplate.trim() + "\n\n",
    };
    const updated = [newPrompt, ...userPrompts];
    setUserPrompts(updated);
    saveUserPrompts(updated);
    setNewLabel("");
    setNewTemplate("");
    setShowAdd(false);
  };

  const deleteUserPrompt = (id) => {
    const updated = userPrompts.filter((p) => p.id !== id);
    setUserPrompts(updated);
    saveUserPrompts(updated);
  };

  const base = isDark ? "bg-zinc-800 border-zinc-700 text-white" : "bg-white border-slate-200 text-slate-800";
  const inputCls = isDark
    ? "bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500 focus:border-purple-500"
    : "bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-400";
  const mutedCls = isDark ? "text-zinc-400" : "text-slate-500";
  const itemCls = isDark
    ? "bg-zinc-700/50 border-zinc-600 hover:border-purple-500 hover:bg-zinc-700"
    : "bg-slate-50 border-slate-200 hover:border-purple-400 hover:bg-purple-50";
  const catBtn = (active) => active
    ? "bg-purple-600 text-white"
    : isDark ? "bg-zinc-700 text-zinc-300 hover:bg-zinc-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col max-h-[85vh] ${base}`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-zinc-700" : "border-slate-200"}`}>
          <h2 className="text-lg font-bold">Prompt Library</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdd((v) => !v)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 transition-all"
            >
              <PlusIcon /> Save prompt
            </button>
            <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-700" : "text-slate-400 hover:bg-slate-100"}`}>
              <XIcon />
            </button>
          </div>
        </div>

        {/* Add new prompt form */}
        {showAdd && (
          <div className={`px-6 py-4 border-b ${isDark ? "border-zinc-700 bg-zinc-900/50" : "border-slate-200 bg-slate-50"}`}>
            <p className={`text-xs mb-3 font-medium ${mutedCls}`}>Save a custom prompt template</p>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Template name (e.g. Write a regex for…)"
              className={`w-full rounded-lg px-3 py-2 text-sm outline-none border mb-2 transition-colors ${inputCls}`}
            />
            <textarea
              value={newTemplate}
              onChange={(e) => setNewTemplate(e.target.value)}
              placeholder="Template text (e.g. Write a regex that matches…)"
              rows={3}
              className={`w-full rounded-lg px-3 py-2 text-sm outline-none border resize-none transition-colors ${inputCls}`}
            />
            <div className="flex gap-2 mt-2 justify-end">
              <button onClick={() => setShowAdd(false)} className={`text-xs px-3 py-1.5 rounded-lg ${isDark ? "text-zinc-400 hover:bg-zinc-700" : "text-slate-500 hover:bg-slate-100"}`}>Cancel</button>
              <button onClick={saveNew} className="text-xs px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors">Save</button>
            </div>
          </div>
        )}

        {/* Search + category filters */}
        <div className={`px-6 py-3 border-b ${isDark ? "border-zinc-700" : "border-slate-200"}`}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts…"
            className={`w-full rounded-lg px-3 py-2 text-sm outline-none border mb-3 transition-colors ${inputCls}`}
          />
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${catBtn(activeCategory === cat)}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.length === 0 && (
            <p className={`text-sm col-span-2 text-center py-8 ${mutedCls}`}>No prompts found</p>
          )}
          {filtered.map((p) => (
            <div
              key={p.id}
              className={`group relative rounded-xl border p-3 cursor-pointer transition-all ${itemCls}`}
              onClick={() => { onSelect(p.template); onClose(); }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className={`text-xs font-semibold block mb-0.5 ${isDark ? "text-purple-400" : "text-purple-600"}`}>{p.category}</span>
                  <span className={`text-sm font-medium block ${isDark ? "text-white" : "text-slate-800"}`}>{p.label}</span>
                  <span className={`text-xs mt-1 block line-clamp-2 ${mutedCls}`}>{p.template.trim()}</span>
                </div>
                {p.id.startsWith("user-") && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteUserPrompt(p.id); }}
                    className={`flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all p-1 rounded ${isDark ? "text-zinc-500 hover:text-red-400" : "text-slate-400 hover:text-red-500"}`}
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
