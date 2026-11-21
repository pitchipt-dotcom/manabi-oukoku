/* =====================================================================
   チクタの 手ちょう — セーブ・日づけ・週の しめ
   『小学生の勉強法』の 子ども手帳：
   - 子どもが 自分で 書く（親が 書くと「親が 書かないと しない子」に なる）
   - できたら 自分で けす → けした 分だけ ポイント
   - 毎週末、親子で ポイントを せいさん し、次の 週の よていを 書く
   - 親の コメントは プラスの 言ばだけ。できていない ことは「ワンポイント・アドバイス」に
   ===================================================================== */
export const SAVE_KEY = "kodomotechou:save:v1";

export const WEEK = ["月", "火", "水", "木", "金", "土", "日"]; // 月曜はじまり
export const ICONS = ["📝", "📖", "✏️", "🎒", "🍽️", "🧹", "🛁", "🌙", "☀️", "🪥", "🎹", "⚽", "🐶", "🌱", "🎮", "⭐"];

let seq = 0;
export const newId = () => `t${Date.now().toString(36)}${(seq++).toString(36)}`;

export const DEFAULT_TASKS = () => [
  { id: newId(), title: "しゅくだい", icon: "📝", pt: 2, days: [0, 1, 2, 3, 4] },
  { id: newId(), title: "音読", icon: "📖", pt: 1, days: [0, 1, 2, 3, 4] },
  { id: newId(), title: "明日の じゅんび", icon: "🎒", pt: 1, days: [0, 1, 2, 3, 6] },
  { id: newId(), title: "お手つだい", icon: "🍽️", pt: 1, days: [0, 1, 2, 3, 4, 5, 6] },
  { id: newId(), title: "早おき", icon: "☀️", pt: 1, days: [0, 1, 2, 3, 4, 5, 6] },
];

export const emptySave = () => ({
  v: 1,
  tasks: DEFAULT_TASKS(),
  done: {},        // "YYYY-MM-DD": [{ id, title, icon, pt }]（けした ときの ものを のこす）
  weeks: {},       // 週の はじめ（月曜）"YYYY-MM-DD": { settled, pt, comment, advice }
  stars: 0,        // せいさん した ポイントの ごうけい
  reward: "",      // おうちの人が きめる ごほうびの ルール
});

export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
export const parseKey = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
export const dow = (date) => (date.getDay() + 6) % 7; // 月=0 … 日=6
export function weekStart(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - dow(d));
  return dateKey(d);
}
export function weekDays(ws) {
  const s = parseKey(ws);
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(s); d.setDate(s.getDate() + i); return dateKey(d); });
}
export const prevWeek = (ws) => { const d = parseKey(ws); d.setDate(d.getDate() - 7); return dateKey(d); };

function normalize(d) {
  const base = emptySave();
  if (!d || typeof d !== "object") return base;
  return {
    ...base,
    ...d,
    tasks: Array.isArray(d.tasks) ? d.tasks : base.tasks,
    done: d.done && typeof d.done === "object" ? d.done : {},
    weeks: d.weeks && typeof d.weeks === "object" ? d.weeks : {},
    stars: Number.isFinite(d.stars) ? d.stars : 0,
    reward: typeof d.reward === "string" ? d.reward : "",
  };
}
export function loadSave() {
  try { const raw = localStorage.getItem(SAVE_KEY); return normalize(raw ? JSON.parse(raw) : null); }
  catch (e) { return emptySave(); }
}
export function writeSave(data) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) {} }
export function encodeSave(data) {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify({ app: "kodomotechou", ...data })))); } catch (e) { return ""; }
}
export function decodeSave(code) {
  try {
    const d = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if (!d || d.app !== "kodomotechou") return null;
    delete d.app;
    return normalize(d);
  } catch (e) { return null; }
}

/* ---- よみとり ---- */
export const tasksFor = (save, key) => save.tasks.filter((t) => t.days.includes(dow(parseKey(key))));
export const doneList = (save, key) => save.done[key] || [];
export const isDone = (save, key, id) => doneList(save, key).some((x) => x.id === id);
export const dayPoints = (save, key) => doneList(save, key).reduce((a, x) => a + x.pt, 0);
export const weekPoints = (save, ws) => weekDays(ws).reduce((a, k) => a + dayPoints(save, k), 0);

export function toggleDone(save, key, task) {
  const list = doneList(save, key);
  const next = list.some((x) => x.id === task.id)
    ? list.filter((x) => x.id !== task.id)
    : [...list, { id: task.id, title: task.title, icon: task.icon, pt: task.pt }];
  return { ...save, done: { ...save.done, [key]: next } };
}

export function settle(save, ws, { comment, advice }) {
  const pt = weekPoints(save, ws);
  return {
    ...save,
    stars: save.stars + pt,
    weeks: { ...save.weeks, [ws]: { settled: true, pt, comment, advice, at: dateKey() } },
  };
}

/* スタンプ：1つでも けした 日 */
export const playedDays = (save) => Object.keys(save.done).filter((k) => save.done[k].length > 0).sort();
export function streak(save, today = new Date()) {
  const set = new Set(playedDays(save));
  let n = 0;
  const d = new Date(today);
  if (!set.has(dateKey(d))) d.setDate(d.getDate() - 1);
  while (set.has(dateKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
