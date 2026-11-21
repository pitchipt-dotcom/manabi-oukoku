/* セーブ（localStorage）と バックアップコード */
export const SAVE_KEY = "sakubun:save:v1";

export const emptySave = () => ({ v: 1, works: [], draft: null });

export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function normalize(d) {
  const base = emptySave();
  if (!d || typeof d !== "object") return base;
  return { ...base, ...d, works: Array.isArray(d.works) ? d.works : [], draft: d.draft && typeof d.draft === "object" ? d.draft : null };
}
export function loadSave() {
  try { const raw = localStorage.getItem(SAVE_KEY); return normalize(raw ? JSON.parse(raw) : null); }
  catch (e) { return emptySave(); }
}
export function writeSave(data) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) {} }
export function encodeSave(data) {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify({ app: "sakubun", ...data })))); } catch (e) { return ""; }
}
export function decodeSave(code) {
  try {
    const d = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if (!d || d.app !== "sakubun") return null;
    delete d.app;
    return normalize(d);
  } catch (e) { return null; }
}

export const playedDays = (save) => [...new Set(save.works.map((w) => w.d))].sort();
export function streak(save, today = new Date()) {
  const set = new Set(playedDays(save));
  let n = 0;
  const d = new Date(today);
  if (!set.has(dateKey(d))) d.setDate(d.getDate() - 1);
  while (set.has(dateKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* こたえ → はじめ／中／おわり の メモ */
export function buildMemo(draft) {
  const memo = { hajime: [], naka: [], owari: [] };
  draft.answers.forEach((a) => { if (a.text && memo[a.part]) memo[a.part].push(a.text); });
  return memo;
}
