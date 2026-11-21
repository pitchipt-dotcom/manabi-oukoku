/* =====================================================================
   まなびの 王国 — 4つの 場所を つなぐ しくみ
   - 場所ごとの セーブは そのまま（キーを かえない）
   - スタンプカードは 1まいに まとめる（どこかで 1つ やった 日）
   - 手ちょうの「自動で きえる」やる こと
   - おうちの人アプリ むけの「レポートコード」（QR）と、まるごとの バックアップ
   ===================================================================== */
import LZString from "lz-string";
import { dateKey } from "./places/techou/store.js";

export const KINGDOM_KEY = "manabioukoku:save:v1";
export const PLACE_KEYS = {
  naze: "nazemori:save:v1",
  kanji: "kanji3kaiten:save:v1",
  techou: "kodomotechou:save:v1",
  sakubun: "sakubun:save:v1",
};

const readJSON = (key) => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
const writeJSON = (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} };

export const loadKingdom = () => ({ v: 1, seeded: false, lastPlace: null, ...(readJSON(KINGDOM_KEY) || {}) });
export const saveKingdom = (k) => writeJSON(KINGDOM_KEY, k);

/* ---- どの 日に 何を したか ---- */
export function activity(key = dateKey()) {
  const naze = readJSON(PLACE_KEYS.naze);
  const kanji = readJSON(PLACE_KEYS.kanji);
  const techou = readJSON(PLACE_KEYS.techou);
  const sakubun = readJSON(PLACE_KEYS.sakubun);
  const nd = naze && naze.days && naze.days[key];
  return {
    naze: !!(nd && ((nd.cards && nd.cards.length) || nd.ladders)),
    kanji: !!(kanji && kanji.days && kanji.days[key] && kanji.days[key].sessions > 0),
    techou: !!(techou && techou.done && techou.done[key] && techou.done[key].length),
    sakubun: !!(sakubun && Array.isArray(sakubun.works) && sakubun.works.some((w) => w.d === key)),
  };
}

export function playedDays() {
  const set = new Set();
  const naze = readJSON(PLACE_KEYS.naze);
  const kanji = readJSON(PLACE_KEYS.kanji);
  const techou = readJSON(PLACE_KEYS.techou);
  const sakubun = readJSON(PLACE_KEYS.sakubun);
  if (naze && naze.days) Object.entries(naze.days).forEach(([k, d]) => { if ((d.cards && d.cards.length) || d.ladders) set.add(k); });
  if (kanji && kanji.days) Object.entries(kanji.days).forEach(([k, d]) => { if (d.sessions > 0) set.add(k); });
  if (techou && techou.done) Object.entries(techou.done).forEach(([k, d]) => { if (d && d.length) set.add(k); });
  if (sakubun && sakubun.works) sakubun.works.forEach((w) => set.add(w.d));
  return [...set].sort();
}
export function streak(today = new Date()) {
  const set = new Set(playedDays());
  let n = 0;
  const d = new Date(today);
  if (!set.has(dateKey(d))) d.setDate(d.getDate() - 1);
  while (set.has(dateKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* ---- 手ちょうの「自動で きえる」やる こと ---- */
const AUTO_TASKS = [
  { auto: "naze", title: "なぜ？カード", icon: "🃏", pt: 1, days: [0, 1, 2, 3, 4, 5, 6] },
  { auto: "kanji", title: "かん字 3回てん", icon: "📖", pt: 2, days: [0, 1, 2, 3, 4] },
];

/* はじめて 王国を ひらいた ときに、手ちょうへ 自動の やる ことを 入れる（1回だけ） */
export function seedAutoTasks(kingdom, makeTechouSave) {
  if (kingdom.seeded) return kingdom;
  const t = readJSON(PLACE_KEYS.techou) || makeTechouSave();
  const have = new Set((t.tasks || []).map((x) => x.auto).filter(Boolean));
  const add = AUTO_TASKS.filter((a) => !have.has(a.auto)).map((a, i) => ({ ...a, id: `auto-${a.auto}-${i}` }));
  writeJSON(PLACE_KEYS.techou, { ...t, tasks: [...add, ...(t.tasks || [])] });
  const k = { ...kingdom, seeded: true };
  saveKingdom(k);
  return k;
}

/* 今日 王国で やった ことを、手ちょうに 自動で けす */
export function syncAutoDone(key = dateKey()) {
  const t = readJSON(PLACE_KEYS.techou);
  if (!t || !Array.isArray(t.tasks)) return;
  const act = activity(key);
  const dow = (new Date().getDay() + 6) % 7;
  const done = (t.done && t.done[key]) || [];
  let changed = false;
  const next = [...done];
  t.tasks.forEach((task) => {
    if (!task.auto || !act[task.auto] || !task.days.includes(dow)) return;
    if (next.some((x) => x.id === task.id)) return;
    next.push({ id: task.id, title: task.title, icon: task.icon, pt: task.pt, auto: true });
    changed = true;
  });
  if (changed) writeJSON(PLACE_KEYS.techou, { ...t, done: { ...(t.done || {}), [key]: next } });
}

/* ---- まるごと バックアップ ---- */
export function exportAll() {
  const saves = {};
  [KINGDOM_KEY, ...Object.values(PLACE_KEYS)].forEach((k) => { const v = readJSON(k); if (v) saves[k] = v; });
  return LZString.compressToEncodedURIComponent(JSON.stringify({ app: "manabioukoku", v: 1, saves }));
}
export function importAll(code) {
  try {
    const d = JSON.parse(LZString.decompressFromEncodedURIComponent(code.trim()));
    if (!d || d.app !== "manabioukoku" || !d.saves) return false;
    Object.entries(d.saves).forEach(([k, v]) => writeJSON(k, v));
    return true;
  } catch (e) { return false; }
}

/* ---- おうちの人アプリ むけ レポートコード ----
   QR に のる 大きさに するため、まとめた 数字と さいきんの ものだけ 入れる */
const lastDays = (n) => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (n - 1 - i)); return dateKey(d); });
const cut = (s, n) => (s && s.length > n ? s.slice(0, n) + "…" : s || "");

export function buildReport({ nazeCards, kanjiList, sakubunKinds }) {
  const days = lastDays(14);
  const naze = readJSON(PLACE_KEYS.naze);
  const kanji = readJSON(PLACE_KEYS.kanji);
  const techou = readJSON(PLACE_KEYS.techou);
  const sakubun = readJSON(PLACE_KEYS.sakubun);
  const cardQ = Object.fromEntries(nazeCards.map((c) => [c.id, c.q]));
  const r = { app: "manabioukoku-report", v: 1, at: new Date().toISOString(), from: days[0] };

  if (naze) {
    r.naze = {
      mi: naze.mi || 0,
      type: naze.type || null,
      ladders: naze.ladders || 0,
      cards: days.map((k) => (naze.days[k] && naze.days[k].cards ? naze.days[k].cards.length : 0)),
      recent: (naze.answers || []).slice(-6).map((a) => ({ d: a.d, q: cut(cardQ[a.id] || a.id, 40), how: a.how, a: cut(a.text, 40), f: cut(a.followText, 30) })),
    };
  }
  if (kanji) {
    const learned = kanjiList.filter((k) => kanji.kanji && kanji.kanji[k] && kanji.kanji[k].kaki).join("");
    r.kanji = {
      total: kanjiList.length,
      learned,
      weak: (kanji.weak || []).join(""),
      sessions: days.map((k) => (kanji.days[k] ? kanji.days[k].sessions : 0)),
      recent: (kanji.log || []).slice(-5).map((l) => ({ d: l.d, k: l.kind === "full" ? "3" : "d", list: l.list.join(""), y: l.yomiMiss.join(""), w: l.kakiMiss.join("") })),
    };
  }
  if (techou) {
    r.techou = {
      stars: techou.stars || 0,
      reward: techou.reward || "",
      tasks: (techou.tasks || []).map((t) => ({ t: cut(t.title, 16), p: t.pt, n: t.days.length })),
      points: days.map((k) => ((techou.done && techou.done[k]) || []).reduce((a, x) => a + x.pt, 0)),
      letters: Object.entries(techou.weeks || {}).filter(([, w]) => w.settled).slice(-3).map(([k, w]) => ({ w: k, pt: w.pt, c: cut(w.comment, 30), a: cut(w.advice, 30) })),
    };
  }
  if (sakubun) {
    r.sakubun = {
      count: (sakubun.works || []).length,
      recent: (sakubun.works || []).slice(-4).map((w) => ({
        d: w.d, k: sakubunKinds[w.kind] || w.kind, t: cut(w.title, 20),
        c: w.body ? [...w.body.replace(/\s/g, "")].length : 0,
        f: (w.feelings || []).join("・"),
      })),
      draft: !!sakubun.draft,
    };
  }
  return LZString.compressToEncodedURIComponent(JSON.stringify(r));
}
