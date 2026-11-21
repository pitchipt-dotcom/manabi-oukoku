/* =====================================================================
   チクタの 手ちょう — 時計とうの ようせい チクタと、自分で 書いて 自分で けす 手ちょう
   ===================================================================== */
import { useEffect, useState } from "react";
import KingdomBack from "../KingdomBack.jsx";
import {
  loadSave, writeSave, dateKey, parseKey, dow, weekStart, weekDays, prevWeek, WEEK, ICONS, newId,
  tasksFor, isDone, dayPoints, weekPoints, toggleDone, settle, playedDays, streak, encodeSave, decodeSave,
} from "./store.js";
import chikuta from "./art/chikuta.webp";

const STAMPS_PER_SHEET = 10;
const md = (k) => { const d = parseKey(k); return `${d.getMonth() + 1}月${d.getDate()}日`; };

export default function App() {
  const [save, setSaveState] = useState(loadSave);
  const [screen, setScreen] = useState({ name: "home" });
  const setSave = (s) => { setSaveState(s); writeSave(s); };
  useEffect(() => { window.scrollTo(0, 0); }, [screen.name]);
  const go = (name, extra = {}) => setScreen({ name, ...extra });

  if (screen.name === "edit") return <Shell><EditTasks save={save} setSave={setSave} onBack={() => go("home")} /></Shell>;
  if (screen.name === "week") return <Shell><WeekSummary save={save} setSave={setSave} ws={screen.ws} go={go} /></Shell>;
  if (screen.name === "memories") return <Shell><Memories save={save} onBack={() => go("home")} /></Shell>;
  if (screen.name === "parent") return <Shell><Parent save={save} setSave={setSave} onBack={() => go("home")} /></Shell>;
  return <Shell><Home save={save} setSave={setSave} go={go} /></Shell>;
}

/* ---------------- ホーム（今日の ページ） ---------------- */
function Home({ save, setSave, go }) {
  const today = dateKey();
  const list = tasksFor(save, today);
  const doneN = list.filter((t) => isDone(save, today, t.id)).length;
  const ws = weekStart();
  const days = weekDays(ws);
  const wpt = weekPoints(save, ws);
  const lastWs = prevWeek(ws);
  const lastUnsettled = !(save.weeks[lastWs] && save.weeks[lastWs].settled) && weekPoints(save, lastWs) > 0;
  const weekend = dow(new Date()) >= 5;
  const [pop, setPop] = useState(null);

  const tap = (t) => {
    const was = isDone(save, today, t.id);
    setSave(toggleDone(save, today, t));
    if (!was) { setPop({ id: t.id, pt: t.pt, k: Date.now() }); setTimeout(() => setPop(null), 900); }
  };

  const line = list.length === 0
    ? "今日の やる ことは まだ ないよ。「やる ことを 書く」で ふやしてね。"
    : doneN === 0
    ? "今日の やる ことを 見てみよう！ できたら タップして けしてね。"
    : doneN < list.length
    ? `いいね！ あと ${list.length - doneN}こ だよ。`
    : "ぜんぶ けせたね！ 今日の きみ、ピカピカだよ！";

  const n = playedDays(save).length;
  const stampsOnSheet = n === 0 ? 0 : ((n - 1) % STAMPS_PER_SHEET) + 1;
  const sheetNo = n === 0 ? 1 : Math.floor((n - 1) / STAMPS_PER_SHEET) + 1;
  const st = streak(save);

  return (
    <div className="screen home">
      <KingdomBack />
        <h1 className="title">チクタの 手ちょう</h1>
      <div className="hero">
        <img src={chikuta} alt="ようせいの チクタ" className="chara-home" />
        <div className="bubble">{line}</div>
      </div>

      <div className="page">
        <div className="page-head">
          <span className="page-date">{md(today)}（{WEEK[dow(new Date())]}）</span>
          <span className="page-count">{doneN} / {list.length}</span>
        </div>
        {list.map((t) => {
          const done = isDone(save, today, t.id);
          return (
            <button key={t.id} className={"task" + (done ? " is-done" : "")} onClick={() => tap(t)}>
              <span className="task-icon">{t.icon}</span>
              <span className="task-title">{t.title}</span>
              <span className="task-pt">{t.pt}pt</span>
              {done && <span className="task-check">✓</span>}
              {pop && pop.id === t.id && <span key={pop.k} className="pt-pop">+{pop.pt}</span>}
            </button>
          );
        })}
        {list.length === 0 && <div className="empty">今日は お休みの 日かな？</div>}
      </div>

      <div className="week-card">
        <div className="week-head"><span>今週の ポイント</span><b>{wpt}pt</b></div>
        <div className="week-row">
          {days.map((k, i) => {
            const p = dayPoints(save, k);
            const isToday = k === today;
            return (
              <div key={k} className={"wday" + (isToday ? " today" : "") + (p > 0 ? " on" : "")}>
                <small>{WEEK[i]}</small>
                <span>{p > 0 ? p : "・"}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="menu">
        {lastUnsettled && (
          <button className="menu-btn main" onClick={() => go("week", { ws: lastWs })}>
            <span className="menu-icon">🕰️</span>
            <span><b>先週の まとめ</b><small>おうちの人と ポイントを せいさん しよう</small></span>
          </button>
        )}
        <button className={"menu-btn" + (weekend && !lastUnsettled ? " main" : "")} onClick={() => go("week", { ws })}>
          <span className="menu-icon">📅</span>
          <span><b>今週の まとめ</b><small>{weekend ? "週まつは おうちの人と せいさんの 日！" : "週まつに おうちの人と せいさん しよう"}</small></span>
        </button>
        <button className="menu-btn" onClick={() => go("edit")}>
          <span className="menu-icon">✏️</span>
          <span><b>やる ことを 書く</b><small>自分で 書くのが ポイントだよ</small></span>
        </button>
        <button className="menu-btn" onClick={() => go("memories")}>
          <span className="menu-icon">💌</span>
          <span><b>おうちの人からの 手紙</b><small>これまでの コメントを 読もう</small></span>
        </button>
      </div>

      <div className="star-card">
        <span>⭐ ためた 星</span><b>{save.stars}</b>
        {save.reward && <small>ごほうび：{save.reward}</small>}
      </div>

      <div className="stamp-card">
        <div className="stamp-head">
          <span>🌟 スタンプカード{sheetNo > 1 ? `（${sheetNo}まい目）` : ""}</span>
          {st > 0 && <span className="streak">れんぞく {st}日</span>}
        </div>
        <div className="stamps">
          {Array.from({ length: STAMPS_PER_SHEET }).map((_, i) => (
            <div key={i} className={"stamp" + (i < stampsOnSheet ? " on" : "")}>{i < stampsOnSheet ? "🕰️" : i + 1}</div>
          ))}
        </div>
      </div>

      <button className="parent-link" onClick={() => go("parent")}>👪 おうちの人</button>
    </div>
  );
}

/* ---------------- やる ことを 書く ---------------- */
const SUGGEST = [
  ["📝", "しゅくだい"], ["📖", "音読"], ["✏️", "計算プリント"], ["🎒", "明日の じゅんび"], ["🍽️", "食べた 後の かたづけ"],
  ["🧹", "へやの そうじ"], ["🛁", "おふろ そうじ"], ["🌙", "9時までに ねる"], ["☀️", "早おき"], ["🪥", "はみがき"],
  ["🎮", "ゲームは 時間を まもる"], ["🌱", "花に 水やり"],
];

function EditTasks({ save, setSave, onBack }) {
  const [form, setForm] = useState(null); // { id?, title, icon, pt, days }
  const blank = { title: "", icon: "⭐", pt: 1, days: [0, 1, 2, 3, 4] };
  const saveForm = () => {
    const t = { ...form, title: form.title.trim() };
    if (!t.title || t.days.length === 0) return;
    const tasks = t.id ? save.tasks.map((x) => (x.id === t.id ? t : x)) : [...save.tasks, { ...t, id: newId() }];
    setSave({ ...save, tasks });
    setForm(null);
  };
  const remove = (id) => { setSave({ ...save, tasks: save.tasks.filter((x) => x.id !== id) }); setForm(null); };

  if (form)
    return (
      <div className="screen">
        <div className="topbar">
          <button className="btn-back" onClick={() => setForm(null)}>← もどる</button>
          <span className="cat-tag">{form.id ? "直す" : "新しく 書く"}</span>
        </div>
        <div className="form">
          <label>何を する？</label>
          <input className="ab-text" value={form.title} maxLength={20} placeholder="れい：音読" onChange={(e) => setForm({ ...form, title: e.target.value })} />
          {!form.id && (
            <div className="suggest">
              {SUGGEST.map(([ic, tt]) => <button key={tt} onClick={() => setForm({ ...form, icon: ic, title: tt })}>{ic} {tt}</button>)}
            </div>
          )}
          <label>マーク</label>
          <div className="icons">{ICONS.map((ic) => <button key={ic} className={form.icon === ic ? "on" : ""} onClick={() => setForm({ ...form, icon: ic })}>{ic}</button>)}</div>
          <label>ポイント</label>
          <div className="pts">{[1, 2, 3].map((p) => <button key={p} className={form.pt === p ? "on" : ""} onClick={() => setForm({ ...form, pt: p })}>{p}pt</button>)}</div>
          <label>やる 曜日</label>
          <div className="days">
            {WEEK.map((w, i) => (
              <button key={w} className={form.days.includes(i) ? "on" : ""}
                onClick={() => setForm({ ...form, days: form.days.includes(i) ? form.days.filter((x) => x !== i) : [...form.days, i].sort() })}>{w}</button>
            ))}
          </div>
          <button className="btn btn-main" disabled={!form.title.trim() || form.days.length === 0} onClick={saveForm}>きめた！</button>
          {form.id && <button className="btn btn-link" onClick={() => remove(form.id)}>この やる ことを なくす</button>}
        </div>
      </div>
    );

  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn-back" onClick={onBack}>← もどる</button>
        <span className="cat-tag">✏️ やる こと</span>
      </div>
      <div className="bubble-row">
        <img src={chikuta} alt="" className="chara-mini" />
        <div className="bubble">やる ことは、自分で 書くのが ひみつだよ。タップすると 直せるよ。</div>
      </div>
      <div className="page">
        {save.tasks.map((t) => (
          <button key={t.id} className="task edit" onClick={() => setForm({ ...t })}>
            <span className="task-icon">{t.icon}</span>
            <span className="task-title">{t.title}<small>{t.days.length === 7 ? "毎日" : t.days.map((d) => WEEK[d]).join("・")}{t.auto ? "　🏰 王国で やると 自動で きえる" : ""}</small></span>
            <span className="task-pt">{t.pt}pt</span>
          </button>
        ))}
      </div>
      <button className="btn btn-main" onClick={() => setForm(blank)}>＋ やる ことを ふやす</button>
    </div>
  );
}

/* ---------------- 週の まとめ（せいさん） ---------------- */
const COMMENTS = ["毎日 よく がんばったね！", "自分で 書けたね。すごい！", "お手つだい ありがとう。たすかったよ！", "先週より ふえたね！", "早おき できて かっこいい！"];
const ADVICE = ["ねる 前に 明日の じゅんびを すると、朝 楽ちんだよ", "しゅくだいは 帰って すぐに すると、早く おわるよ", "できたら すぐ けすと、もっと 楽しいよ", "むずかしい 日は、1つだけでも OKだよ"];

function WeekSummary({ save, setSave, ws, go }) {
  const days = weekDays(ws);
  const total = weekPoints(save, ws);
  const max = Math.max(1, ...days.map((k) => dayPoints(save, k)));
  const rec = save.weeks[ws];
  const [comment, setComment] = useState("");
  const [advice, setAdvice] = useState("");
  const [justDone, setJustDone] = useState(false);
  const isThis = ws === weekStart();

  const doSettle = () => {
    setSave(settle(save, ws, { comment: comment.trim(), advice: advice.trim() }));
    setJustDone(true);
    window.scrollTo(0, 0);
  };

  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn-back" onClick={() => go("home")}>← もどる</button>
        <span className="cat-tag">📅 {isThis ? "今週" : "先週"}の まとめ</span>
      </div>

      {justDone && (
        <div className="done">
          <img src={chikuta} alt="" className="chara-big pop" />
          <div className="bubble big">せいさん かんりょう！<br />星が <b>{total}こ</b> ふえたよ。<br />つぎの 週の よていも 書いて おこう！</div>
          <button className="btn btn-main" onClick={() => go("edit")}>つぎの 週の よていを 書く</button>
          <button className="btn btn-link" onClick={() => go("home")}>手ちょうに もどる</button>
        </div>
      )}

      {!justDone && (
        <>
          <div className="week-card">
            <div className="week-head"><span>{md(days[0])}〜{md(days[6])}</span><b>{total}pt</b></div>
            <div className="bars">
              {days.map((k, i) => {
                const p = dayPoints(save, k);
                return (
                  <div key={k} className="bar">
                    <span className="bar-n">{p || ""}</span>
                    <div className="bar-fill" style={{ height: `${(p / max) * 100}%` }} />
                    <small>{WEEK[i]}</small>
                  </div>
                );
              })}
            </div>
          </div>

          {rec && rec.settled ? (
            <div className="letter">
              <div className="letter-head">💌 おうちの人から</div>
              {rec.comment && <div className="letter-body">{rec.comment}</div>}
              {rec.advice && <div className="letter-advice">💡 ワンポイント：{rec.advice}</div>}
              <div className="pnote center">この 週は せいさん ずみ（星 {rec.pt}こ）</div>
            </div>
          ) : (
            <div className="psec">
              <h3>👪 おうちの人と いっしょに</h3>
              <div className="pnote">
                子どもと一緒にグラフを見て、できたことを言葉にしてあげてください。<br />
                コメントはプラスの言葉だけ。できていないことは「ワンポイント・アドバイス」として、どうすればうまくいくかを書きます。
              </div>
              <label className="plabel">ほめる コメント</label>
              <div className="suggest">{COMMENTS.map((c) => <button key={c} onClick={() => setComment(c)}>{c}</button>)}</div>
              <textarea className="ab-text" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="自由に書いてもOK" />
              <label className="plabel">ワンポイント・アドバイス（なくてもOK）</label>
              <div className="suggest">{ADVICE.map((c) => <button key={c} onClick={() => setAdvice(c)}>{c}</button>)}</div>
              <textarea className="ab-text" rows={2} value={advice} onChange={(e) => setAdvice(e.target.value)} placeholder="「〜すると、〜だよ」の形がおすすめ" />
              {save.reward && <div className="pnote">ごほうびの ルール：<b>{save.reward}</b></div>}
              <button className="btn btn-main" onClick={doSettle}>せいさん する！（星 ＋{total}）</button>
              {isThis && dow(new Date()) < 5 && <div className="pnote small">※週の と中でも せいさん できます。ふつうは 土・日に します。</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------- おうちの人からの 手紙 ---------------- */
function Memories({ save, onBack }) {
  const list = Object.entries(save.weeks).filter(([, w]) => w.settled).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn-back" onClick={onBack}>← もどる</button>
        <span className="cat-tag">💌 手紙</span>
      </div>
      {list.length === 0 && <div className="bubble">まだ 手紙は ないよ。週まつに せいさん すると とどくよ！</div>}
      {list.map(([ws, w]) => (
        <div key={ws} className="letter">
          <div className="letter-head">{md(ws)}の 週　⭐ {w.pt}</div>
          {w.comment ? <div className="letter-body">{w.comment}</div> : <div className="letter-body">よく がんばったね！</div>}
          {w.advice && <div className="letter-advice">💡 ワンポイント：{w.advice}</div>}
        </div>
      ))}
    </div>
  );
}

/* ---------------- おうちの人 ---------------- */
function Parent({ save, setSave, onBack }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const copyCode = async () => {
    const c = encodeSave(save); setCode(c);
    try { await navigator.clipboard.writeText(c); setMsg("コピーしました。どこかにメモしておいてください。"); }
    catch (e) { setMsg("コピーできなかったら、下の枠を長押ししてコピーしてください。"); }
  };
  const restore = () => {
    const d = decodeSave(code);
    if (!d) { setMsg("コードが正しくないようです。もう一度確かめてください。"); return; }
    setSave(d); setMsg("元に戻しました！");
  };
  return (
    <div className="screen parent-screen">
      <div className="topbar">
        <button className="btn-back" onClick={onBack}>← もどる</button>
        <span className="cat-tag">👪 おうちの人</span>
      </div>
      <section className="psec">
        <h3>子ども手帳の使い方</h3>
        <div className="pnote">
          ・やることは子どもが自分で書きます。親が書くと「親が書かないとしない子」になりやすいので、書くのを手伝う程度にしてください<br />
          ・できたら子どもが自分でタップして消します。消した分だけポイントになります<br />
          ・週末に親子でポイントを精算し、次の週の予定を一緒に書きます<br />
          ・コメントはプラスの言葉だけ。できていないことは責めずに「ワンポイント・アドバイス」にします<br />
          ・子どもを管理するための手帳ではなく、子どもが自分を管理するための手帳です
        </div>
      </section>
      <section className="psec">
        <h3>ごほうびのルール</h3>
        <div className="pnote">ポイント（星）を何と交換できるか、親子で決めて書いておきます。例：「10星で ゲーム10分」</div>
        <input className="ab-text" value={save.reward} maxLength={40} placeholder="10星で ゲーム10分" onChange={(e) => setSave({ ...save, reward: e.target.value })} />
        <div className="pnote">いまの 星：{save.stars}</div>
      </section>
      <section className="psec backup-sec">
        <h3>📋 バックアップ</h3>
        <div className="pnote">機種変更やブラウザのデータ削除の前に、コードを取っておいてください。</div>
        <button className="btn btn-sub" onClick={copyCode}>バックアップコードを出す</button>
        <textarea className="ab-text code" rows={3} value={code} onChange={(e) => setCode(e.target.value)} placeholder="元に戻すときは、ここにコードを貼り付け" />
        <button className="btn btn-sub" onClick={restore}>元に戻す</button>
        {msg && <div className="pnote">{msg}</div>}
      </section>
    </div>
  );
}

function Shell({ children }) { return <div className="shell">{children}</div>; }
