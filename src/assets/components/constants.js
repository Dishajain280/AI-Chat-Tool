const apiKey = import.meta.env.VITE_API_KEY || "";

export const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
