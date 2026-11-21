/* =====================================================================
   ペンの 作文ポスト — 話してから 書く
   作文・せつ明文・読書かんそう文：しつもんに 答える → 気もちを えらぶ → メモ → 書く
   ===================================================================== */
import { useEffect, useMemo, useState } from "react";
import KingdomBack from "../KingdomBack.jsx";
import { KINDS, FEELINGS, PRAISE } from "./data.js";
import { loadSave, writeSave, dateKey, playedDays, streak, buildMemo, encodeSave, decodeSave } from "./store.js";
import { canListen, useListen, speak } from "./speech.js";
import Genko, { countChars } from "./Genko.jsx";
import pen from "./art/pen.webp";

const STAMPS_PER_SHEET = 10;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const md = (k) => { const [, m, d] = k.split("-").map(Number); return `${m}月${d}日`; };

export default function App() {
  const [save, setSaveState] = useState(loadSave);
  const [screen, setScreen] = useState({ name: "home" });
  const setSave = (s) => { setSaveState(s); writeSave(s); };
  const go = (name, extra = {}) => setScreen({ name, ...extra });
  useEffect(() => { window.scrollTo(0, 0); }, [screen.name]);

  const setDraft = (draft) => setSave({ ...save, draft });

  if (screen.name === "draft" && save.draft)
    return (
      <Shell>
        <DraftFlow
          draft={save.draft}
          setDraft={setDraft}
          onFinish={(work) => { setSave({ ...save, draft: null, works: [...save.works, work] }); go("done", { work }); }}
          onBack={() => go("home")}
        />
      </Shell>
    );
  if (screen.name === "done") return <Shell><Done work={screen.work} count={save.works.length} go={go} /></Shell>;
  if (screen.name === "works") return <Shell><Works save={save} go={go} /></Shell>;
  if (screen.name === "work") return <Shell><WorkView work={screen.work} onBack={() => go(screen.from || "works")} /></Shell>;
  if (screen.name === "parent") return <Shell><Parent save={save} setSave={setSave} go={go} /></Shell>;

  const start = (kind) => {
    setDraft({ kind, step: KINDS[kind].themes.length ? "theme" : "talk", qi: 0, theme: "", answers: [], feelings: [], memo: null, body: "", startedAt: dateKey() });
    go("draft");
  };
  const n = playedDays(save).length;
  const stampsOnSheet = n === 0 ? 0 : ((n - 1) % STAMPS_PER_SHEET) + 1;
  const sheetNo = n === 0 ? 1 : Math.floor((n - 1) / STAMPS_PER_SHEET) + 1;
  const st = streak(save);

  return (
    <Shell>
      <div className="screen home">
        <KingdomBack />
        <h1 className="title">ペンの 作文ポスト</h1>
        <div className="hero">
          <img src={pen} alt="ようせいの ペン" className="chara-home" />
          <div className="bubble">作文は、いきなり 書かなくて いいんだよ。まずは ぼくと お話し しよう！</div>
        </div>

        {save.draft && (
          <button className="menu-btn main" onClick={() => go("draft")}>
            <span className="menu-icon">✏️</span>
            <span><b>つづきから</b><small>{KINDS[save.draft.kind].label}{save.draft.theme ? `「${save.draft.theme}」` : ""}</small></span>
          </button>
        )}

        <div className="menu">
          {Object.entries(KINDS).map(([k, v]) => (
            <button key={k} className={"menu-btn" + (!save.draft && k === "monogatari" ? " main" : "")} onClick={() => start(k)}>
              <span className="menu-icon">{v.icon}</span>
              <span><b>{v.label}</b><small>{v.sub}</small></span>
            </button>
          ))}
        </div>

        <button className="post" onClick={() => go("works")}>
          <div className="post-box">📮</div>
          <div className="post-info">
            <b>ポストの 中</b>
            <span>書いた 作文 {save.works.length}こ</span>
            <div className="letters">{save.works.slice(-12).map((w) => <span key={w.id}>✉️</span>)}</div>
          </div>
        </button>

        <div className="stamp-card">
          <div className="stamp-head">
            <span>🌟 スタンプカード{sheetNo > 1 ? `（${sheetNo}まい目）` : ""}</span>
            {st > 0 && <span className="streak">れんぞく {st}日</span>}
          </div>
          <div className="stamps">
            {Array.from({ length: STAMPS_PER_SHEET }).map((_, i) => (
              <div key={i} className={"stamp" + (i < stampsOnSheet ? " on" : "")}>{i < stampsOnSheet ? "✒️" : i + 1}</div>
            ))}
          </div>
        </div>

        <button className="parent-link" onClick={() => go("parent")}>👪 おうちの人</button>
      </div>
    </Shell>
  );
}

/* ---------------- 書く までの ながれ ---------------- */
const STEPS = [["theme", "テーマ"], ["talk", "話す"], ["memo", "メモ"], ["write", "書く"]];

function DraftFlow({ draft, setDraft, onFinish, onBack }) {
  const K = KINDS[draft.kind];
  const up = (p) => setDraft({ ...draft, ...p });
  const stepIdx = { theme: 0, talk: 1, feel: 1, memo: 2, write: 3 }[draft.step];
  useEffect(() => { window.scrollTo(0, 0); }, [draft.step, draft.qi]);

  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn-back" onClick={onBack}>← ホーム</button>
        <span className="cat-tag">{K.icon} {K.label}</span>
      </div>
      <div className="steps">
        {STEPS.filter(([s]) => s !== "theme" || K.themes.length).map(([s, l], i) => {
          const idx = { theme: 0, talk: 1, memo: 2, write: 3 }[s];
          return <span key={s} className={idx === stepIdx ? "now" : idx < stepIdx ? "ok" : ""}>{l}</span>;
        })}
      </div>

      {draft.step === "theme" && <ThemeStep K={K} draft={draft} up={up} />}
      {draft.step === "talk" && <TalkStep key={draft.qi} K={K} draft={draft} up={up} />}
      {draft.step === "feel" && <FeelStep draft={draft} up={up} />}
      {draft.step === "memo" && <MemoStep K={K} draft={draft} up={up} />}
      {draft.step === "write" && <WriteStep K={K} draft={draft} up={up} onFinish={onFinish} />}
    </div>
  );
}

function ThemeStep({ K, draft, up }) {
  const [t, setT] = useState(draft.theme || "");
  return (
    <>
      <Say>何に ついて 書く？ えらんでも、自分で 書いても いいよ。</Say>
      <div className="suggest big">{K.themes.map((x) => <button key={x} className={t === x ? "on" : ""} onClick={() => setT(x)}>{x}</button>)}</div>
      <input className="ab-text" value={t} maxLength={24} placeholder="自分で 書く" onChange={(e) => setT(e.target.value)} />
      <button className="btn btn-main" disabled={!t.trim()} onClick={() => up({ theme: t.trim(), step: "talk", qi: 0 })}>これに する！</button>
    </>
  );
}

function TalkStep({ K, draft, up }) {
  const q = K.questions[draft.qi];
  const prev = draft.answers.find((a) => a.qi === draft.qi);
  const [text, setText] = useState(prev ? prev.text : "");
  const [praise, setPraise] = useState(null);
  const { listening, failed, start, stop } = useListen((t) => setText(t));

  useEffect(() => {
    if (q && q.part === "feel") up({ step: "feel" });
  }, [draft.qi]); // eslint-disable-line
  if (!q || q.part === "feel") return null;

  const next = (val) => {
    const answers = [...draft.answers.filter((a) => a.qi !== draft.qi), ...(val ? [{ qi: draft.qi, part: q.part, q: q.q, text: val }] : [])]
      .sort((a, b) => a.qi - b.qi);
    const qi = draft.qi + 1;
    if (qi >= K.questions.length) {
      up({ answers, qi, step: "memo", memo: buildMemo({ answers }) });
    } else {
      if (val) { setPraise(pick(PRAISE)); setTimeout(() => setPraise(null), 1600); }
      setText("");
      up({ answers, qi });
    }
  };

  return (
    <>
      <div className="progress"><div style={{ width: `${(draft.qi / K.questions.length) * 100}%` }} /></div>
      <div className="qcard">
        <div className="qkind">しつもん {draft.qi + 1} / {K.questions.length}</div>
        <div className="qtext">{q.q}</div>
        {q.hint && <div className="q-hint">{q.hint}</div>}
        <button className="btn-speak" onClick={() => speak(q.q)}>🔊 読んで</button>
      </div>
      {praise && <div className="praise pop">{praise}</div>}
      {canListen && (
        <button className={"ab-mic" + (listening ? " on" : "")} onClick={listening ? stop : start}>
          <span className="ab-mic-icon">🎤</span>{listening ? "聞いてるよ… おわったら タップ" : "声で 答える"}
        </button>
      )}
      {failed && <div className="ab-note">声が うまく 聞こえなかったみたい。字で 書いても、おうちの人に 書いて もらっても いいよ。</div>}
      <textarea className="ab-text" rows={3} value={text} placeholder="ここに メモ（かんたんで OK）" onChange={(e) => setText(e.target.value)} />
      <button className="btn btn-main" disabled={!text.trim()} onClick={() => next(text.trim())}>メモした！</button>
      <div className="ab-row">
        {draft.qi > 0 && <button className="btn btn-sub" onClick={() => { setText(""); up({ qi: draft.qi - 1 - (K.questions[draft.qi - 1].part === "feel" ? 1 : 0) }); }}>← 前の しつもん</button>}
        <button className="btn btn-sub" onClick={() => next("")}>つぎへ</button>
      </div>
    </>
  );
}

function FeelStep({ draft, up }) {
  const [sel, setSel] = useState(draft.feelings || []);
  const toggle = (w) => setSel(sel.includes(w) ? sel.filter((x) => x !== w) : sel.length >= 3 ? sel : [...sel, w]);
  return (
    <>
      <Say>その時の 気もちに ぴったりの 言ばを えらぼう。「楽しい」「おもしろい」いがいも あるよ！（3つまで）</Say>
      {FEELINGS.map((g) => (
        <div key={g.group} className="feel-group">
          <div className="feel-head" style={{ background: g.color }}>{g.group}</div>
          <div className="feel-words">
            {g.words.map((w) => (
              <button key={w} className={sel.includes(w) ? "on" : ""} style={sel.includes(w) ? { background: g.color, borderColor: g.color } : undefined} onClick={() => toggle(w)}>{w}</button>
            ))}
          </div>
        </div>
      ))}
      <div className="sticky-bar">
        <button className="btn btn-main" onClick={() => up({ feelings: sel, step: "talk", qi: draft.qi + 1 })}>
          {sel.length ? `「${sel.join("」「")}」で いく！` : "あとで きめる"}
        </button>
      </div>
    </>
  );
}

function MemoStep({ K, draft, up }) {
  const memo = draft.memo || { hajime: [], naka: [], owari: [] };
  const setLine = (part, i, v) => up({ memo: { ...memo, [part]: memo[part].map((x, j) => (j === i ? v : x)) } });
  const addLine = (part) => up({ memo: { ...memo, [part]: [...memo[part], ""] } });
  const delLine = (part, i) => up({ memo: { ...memo, [part]: memo[part].filter((_, j) => j !== i) } });
  return (
    <>
      <Say>メモが できたよ！ この じゅん番に 書くと、作文に なるんだ。直したい ところは 直してね。</Say>
      {Object.entries(K.parts).map(([part, label]) => (
        <div key={part} className={"memo-box part-" + part}>
          <div className="memo-head">{label}</div>
          {memo[part].map((line, i) => (
            <div key={i} className="memo-line">
              <span>・</span>
              <input value={line} onChange={(e) => setLine(part, i, e.target.value)} />
              <button onClick={() => delLine(part, i)} aria-label="けす">×</button>
            </div>
          ))}
          {part === "naka" && draft.feelings.length > 0 && (
            <div className="memo-feel">つかいたい 気もち：{draft.feelings.map((f) => <b key={f}>{f}</b>)}</div>
          )}
          <button className="memo-add" onClick={() => addLine(part)}>＋ ふやす</button>
        </div>
      ))}
      {draft.kind === "kansou" && <div className="tip-box">💡 かんそう文は「あらすじ」を 長く 書かないのが コツ。「中」を 一番 長く 書こう！</div>}
      <button className="btn btn-main" onClick={() => up({ step: "write" })}>メモを 見ながら 書こう！</button>
    </>
  );
}

function WriteStep({ K, draft, up, onFinish }) {
  const [mode, setMode] = useState(draft.mode || "paper");
  const [showMemo, setShowMemo] = useState(true);
  const title = draft.kind === "kansou" ? (draft.answers.find((a) => a.qi === 0) || {}).text || "" : draft.theme;
  const body = draft.body || "";
  const chars = countChars(body);
  const memo = draft.memo;

  const finish = () => onFinish({
    id: `w${Date.now().toString(36)}`, d: dateKey(), kind: draft.kind, title, memo, feelings: draft.feelings,
    body: mode === "app" ? body : "", mode,
  });

  return (
    <>
      <button className="memo-toggle" onClick={() => setShowMemo(!showMemo)}>{showMemo ? "▼ メモを とじる" : "▶ メモを 見る"}</button>
      {showMemo && (
        <div className="memo-mini">
          {Object.entries(K.parts).map(([part, label]) => (
            <div key={part}><b>{label}</b>{memo[part].filter(Boolean).map((l, i) => <div key={i}>・{l}</div>)}{part === "naka" && draft.feelings.length > 0 && <div className="memo-feel">気もち：{draft.feelings.join("、")}</div>}</div>
          ))}
        </div>
      )}
      <div className="tabs">
        <button className={mode === "paper" ? "on" : ""} onClick={() => { setMode("paper"); up({ mode: "paper" }); }}>✏️ 紙に 書く</button>
        <button className={mode === "app" ? "on" : ""} onClick={() => { setMode("app"); up({ mode: "app" }); }}>📱 ここで 書く</button>
      </div>
      {mode === "paper" ? (
        <div className="paper-tips">
          <Say>げんこう用紙を よういしてね。メモを 上から じゅん番に 文に して いこう。</Say>
          <ul>
            <li>1行目に だい名（上を 2マス あける）</li>
            <li>2行目に 名前（下を 1マス あける）</li>
            <li>だんらくの はじめは 1マス あける</li>
            <li>「はじめ」「中」「おわり」で だんらくを 分けよう</li>
          </ul>
        </div>
      ) : (
        <>
          <textarea className="ab-text write" rows={8} value={body} placeholder="メモを 見ながら 書こう。だんらくを かえる ときは 行を かえてね。" onChange={(e) => up({ body: e.target.value })} />
          <div className="chars">{chars}字</div>
          <Genko title={title} body={body} />
        </>
      )}
      <button className="btn btn-main" disabled={mode === "app" && chars === 0} onClick={finish}>書けた！ ポストに 入れる</button>
    </>
  );
}

/* ---------------- おわり・作品 ---------------- */
function Done({ work, count, go }) {
  return (
    <div className="screen">
      <div className="done">
        <img src={pen} alt="" className="chara-big pop" />
        <div className="bubble big">
          ポストに とどいたよ！<br />
          話して、メモして、書く。<br />
          これで <b>{count}こ目</b>の 作文だね！
        </div>
        <div className="envelope pop">✉️</div>
        <button className="btn btn-main" onClick={() => go("home")}>ホームに もどる</button>
        <button className="btn btn-link" onClick={() => go("work", { work, from: "home" })}>書いた ものを 見る</button>
      </div>
    </div>
  );
}

function Works({ save, go }) {
  const list = [...save.works].reverse();
  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn-back" onClick={() => go("home")}>← もどる</button>
        <span className="cat-tag">📮 ポストの 中</span>
      </div>
      {list.length === 0 && <Say>まだ 何も 入って いないよ。さいしょの 作文を 書いて みよう！</Say>}
      {list.map((w) => (
        <button key={w.id} className="work-item" onClick={() => go("work", { work: w })}>
          <span className="menu-icon">{KINDS[w.kind].icon}</span>
          <span><b>{w.title || KINDS[w.kind].label}</b><small>{md(w.d)}　{KINDS[w.kind].label}{w.body ? `　${countChars(w.body)}字` : "　紙に 書いた"}</small></span>
        </button>
      ))}
    </div>
  );
}

function WorkView({ work, onBack }) {
  const K = KINDS[work.kind];
  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn-back" onClick={onBack}>← もどる</button>
        <span className="cat-tag">{K.icon} {md(work.d)}</span>
      </div>
      <div className="memo-mini">
        <div className="memo-title">{work.title || K.label} の メモ</div>
        {Object.entries(K.parts).map(([part, label]) => (
          <div key={part}><b>{label}</b>{(work.memo[part] || []).filter(Boolean).map((l, i) => <div key={i}>・{l}</div>)}</div>
        ))}
        {work.feelings && work.feelings.length > 0 && <div className="memo-feel">気もち：{work.feelings.join("、")}</div>}
      </div>
      {work.body ? <Genko title={work.title} body={work.body} /> : <Say>この 作文は 紙に 書いたよ。紙も 大切に とっておこうね。</Say>}
    </div>
  );
}

/* ---------------- おうちの人 ---------------- */
function Parent({ save, setSave, go }) {
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
        <button className="btn-back" onClick={() => go("home")}>← もどる</button>
        <span className="cat-tag">👪 おうちの人</span>
      </div>
      <section className="psec">
        <h3>このアプリの進め方</h3>
        <div className="pnote">
          作文は「書く」から始めるとハードルが高すぎます。<br />
          ・まず質問に口で答えます（話す）。声入力が使えないときは、おうちの人が子どもの言葉をメモしてもOKです<br />
          ・答えが「はじめ・中・おわり」のメモに並びます<br />
          ・気持ちの言葉は、書く前にリストから選びます（「楽しい」「おもしろい」だけにならないように）<br />
          ・メモを見ながら、原稿用紙かアプリに書きます<br />
          ・読書感想文は、あらすじを書かないのがコツ。「一番印象に残ったところ」と「なぜ」「自分だったら」を厚くします
        </div>
      </section>
      <section className="psec">
        <h3>書いたもの（{save.works.length}）</h3>
        {save.works.length === 0 && <div className="pnote">まだありません。</div>}
        {[...save.works].reverse().slice(0, 20).map((w) => (
          <button key={w.id} className="work-item small" onClick={() => go("work", { work: w, from: "parent" })}>
            <span>{KINDS[w.kind].icon}</span>
            <span><b>{w.title || KINDS[w.kind].label}</b><small>{w.d}　{w.body ? `${countChars(w.body)}字` : "紙"}</small></span>
          </button>
        ))}
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

function Say({ children }) {
  return (
    <div className="bubble-row">
      <img src={pen} alt="" className="chara-mini" />
      <div className="bubble">{children}</div>
    </div>
  );
}
function Shell({ children }) { return <div className="shell">{children}</div>; }
