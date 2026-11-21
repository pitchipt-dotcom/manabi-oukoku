/* =====================================================================
   セーブ（localStorage）と バックアップコード
   ===================================================================== */
import { KANJI } from "./kanji1.js";

export const SAVE_KEY = "kanji3kaiten:save:v1";
const MAX_LOG = 200;

export const emptySave = () => ({
  v: 1,
  kanji: {},   // "山": { yomi: true, kaki: true }  … かきが できたら「きえる」（おぼえた）
  weak: [],    // 3かい まちがえた かんじ（テストまえの だめおし用）
  days: {},    // "YYYY-MM-DD": { sessions: n }
  log: [],     // { d, kind, list, yomiMiss, kakiMiss }
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
    kanji: d.kanji && typeof d.kanji === "object" ? d.kanji : {},
    weak: Array.isArray(d.weak) ? d.weak : [],
    days: d.days && typeof d.days === "object" ? d.days : {},
    log: Array.isArray(d.log) ? d.log.slice(-MAX_LOG) : [],
  };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return normalize(raw ? JSON.parse(raw) : null);
  } catch (e) { return emptySave(); }
}
export function writeSave(data) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) {}
}
export function encodeSave(data) {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify({ app: "kanji3kaiten", ...data })))); } catch (e) { return ""; }
}
export function decodeSave(code) {
  try {
    const d = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if (!d || d.app !== "kanji3kaiten") return null;
    delete d.app;
    return normalize(d);
  } catch (e) { return null; }
}

export const isLearned = (save, k) => !!(save.kanji[k] && save.kanji[k].kaki);
export const learnedCount = (save) => KANJI.filter((x) => isLearned(save, x.k)).length;

export function playedDays(save) {
  return Object.keys(save.days).filter((k) => save.days[k].sessions > 0).sort();
}
export function streak(save, today = new Date()) {
  const set = new Set(playedDays(save));
  let n = 0;
  const d = new Date(today);
  if (!set.has(todayKey(d))) d.setDate(d.getDate() - 1);
  while (set.has(todayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* 3かいてんの けっか を セーブに いれる
   res: { kind: "full" | "dameoshi", list, yomiMiss, kakiMiss }
   - list の うち kakiMiss に ない ものは「かけた」→ おぼえた
   - kakiMiss（3かい まちがえた）は weak に いれる */
export function applyResult(save, res) {
  const kanji = { ...save.kanji };
  const newly = [];
  res.list.forEach((k) => {
    const cur = kanji[k] || {};
    const yomi = cur.yomi || (res.kind === "full" ? !res.yomiMiss.includes(k) : cur.yomi);
    const kaki = cur.kaki || !res.kakiMiss.includes(k);
    if (kaki && !cur.kaki) newly.push(k);
    kanji[k] = { yomi: !!yomi, kaki: !!kaki };
  });
  const weakSet = new Set(save.weak);
  res.list.forEach((k) => { if (!res.kakiMiss.includes(k)) weakSet.delete(k); });
  res.kakiMiss.forEach((k) => weakSet.add(k));
  const key = todayKey();
  const day = save.days[key] || { sessions: 0 };
  return {
    next: {
      ...save,
      kanji,
      weak: [...weakSet],
      days: { ...save.days, [key]: { sessions: day.sessions + 1 } },
      log: [...save.log, { d: key, ...res }].slice(-MAX_LOG),
    },
    newly,
  };
}
