/* =====================================================================
   セーブ（localStorage）と バックアップコード
   けいさんプリンセスと おなじく、base64 の バックアップコードで 引っこしできる
   ===================================================================== */
import { CARDS, TREE_STAGES } from "./data.js";

export const SAVE_KEY = "nazemori:save:v1";
const MAX_ANSWERS = 300;

export const emptySave = () => ({
  v: 1,
  mi: 0,              // ひかりの み（ごほうび。木が そだつ）
  days: {},           // "YYYY-MM-DD": { cards: [id], ladders: 0 }
  answers: [],        // { d, id, how, text, followText }
  type: null,         // "multi" | "single" | null（おうちのひとが えらぶ）
  ladders: 0,
});

export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalize(d) {
  const base = emptySave();
  if (!d || typeof d !== "object") return base;
  return {
    ...base,
    ...d,
    mi: Number.isFinite(d.mi) ? d.mi : 0,
    days: d.days && typeof d.days === "object" ? d.days : {},
    answers: Array.isArray(d.answers) ? d.answers.slice(-MAX_ANSWERS) : [],
    type: d.type === "multi" || d.type === "single" ? d.type : null,
    ladders: Number.isFinite(d.ladders) ? d.ladders : 0,
  };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return normalize(raw ? JSON.parse(raw) : null);
  } catch (e) {
    return emptySave();
  }
}

export function writeSave(data) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* ほぞんできなくても あそびは とめない */ }
}

export function encodeSave(data) {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify({ app: "nazemori", ...data })))); }
  catch (e) { return ""; }
}

export function decodeSave(code) {
  try {
    const d = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if (!d || d.app !== "nazemori") return null;
    delete d.app;
    return normalize(d);
  } catch (e) { return null; }
}

/* ---- よみとり ---- */
export const dayOf = (save, key = todayKey()) => save.days[key] || { cards: [], ladders: 0 };

export function treeStage(mi) {
  let idx = 0;
  TREE_STAGES.forEach((s, i) => { if (mi >= s.min) idx = i; });
  const next = TREE_STAGES[idx + 1];
  return { idx, stage: TREE_STAGES[idx], next, toNext: next ? next.min - mi : 0 };
}

/* あそんだ 日の かず（スタンプカード用）と れんぞく日数 */
export function playedDays(save) {
  return Object.keys(save.days).filter((k) => {
    const d = save.days[k];
    return (d.cards && d.cards.length) || d.ladders;
  }).sort();
}

export function streak(save, today = new Date()) {
  const set = new Set(playedDays(save));
  let n = 0;
  const d = new Date(today);
  if (!set.has(todayKey(d))) d.setDate(d.getDate() - 1); // きょう まだでも、きのうまでの れんぞくを 見せる
  while (set.has(todayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* きょうの カード：まだ 見て いない カードから、日づけで きまる 1まい */
export function pickCard(save, { cat = null, exclude = [] } = {}) {
  const seen = new Set(save.answers.map((a) => a.id));
  let pool = CARDS.filter((c) => !exclude.includes(c.id) && (!cat || c.cat === cat));
  const fresh = pool.filter((c) => !seen.has(c.id));
  if (fresh.length) pool = fresh;
  if (!pool.length) pool = CARDS.filter((c) => !exclude.includes(c.id));
  if (!pool.length) pool = CARDS;
  const key = todayKey();
  let h = 0;
  for (const ch of key + exclude.length) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
}

export function addAnswer(save, rec, gain) {
  const key = todayKey();
  const day = dayOf(save, key);
  return {
    ...save,
    mi: save.mi + gain,
    days: { ...save.days, [key]: { ...day, cards: [...day.cards, rec.id] } },
    answers: [...save.answers, { d: key, ...rec }].slice(-MAX_ANSWERS),
  };
}

export function addLadder(save, gain) {
  const key = todayKey();
  const day = dayOf(save, key);
  return {
    ...save,
    mi: save.mi + gain,
    ladders: save.ladders + 1,
    days: { ...save.days, [key]: { ...day, ladders: (day.ladders || 0) + 1 } },
  };
}

export const MAX_CARDS_PER_DAY = 3; // 本の「ときおり」に あわせて、1日 3まいまで
