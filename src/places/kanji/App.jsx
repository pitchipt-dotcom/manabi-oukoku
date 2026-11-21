/* =====================================================================
   かん字3回てん — 図書かんの きし ノアと、よむ→かくの 3回てんで かん字を おぼえる
   ===================================================================== */
import { useEffect, useState } from "react";
import KingdomBack from "../KingdomBack.jsx";
import { KANJI, GROUPS } from "./kanji1.js";
import {
  loadSave, writeSave, isLearned, learnedCount, playedDays, streak, applyResult, todayKey, encodeSave, decodeSave,
} from "./store.js";
import Session from "./Session.jsx";
import noa from "./art/noa.webp";

const STAMPS_PER_SHEET = 10;
const SPINES = ["#E8618C", "#3F7BD6", "#F2A93B", "#2FAF8E", "#7A5CC8", "#E85F4B", "#5BB8D9", "#C9821B"];

export default function App() {
  const [save, setSaveState] = useState(loadSave);
  const [screen, setScreen] = useState({ name: "home" });
  const setSave = (s) => { setSaveState(s); writeSave(s); };
  useEffect(() => { window.scrollTo(0, 0); }, [screen.name]);

  const learned = learnedCount(save);
  const nextList = (() => {
    const rest = KANJI.filter((x) => !isLearned(save, x.k)).map((x) => x.k);
    if (rest.length) return rest.slice(0, 10);
    return [...KANJI].sort(() => Math.random() - 0.5).slice(0, 10).map((x) => x.k);
  })();
  const allDone = learned === KANJI.length;
  const today = save.days[todayKey()];
  const days = playedDays(save);
  const n = days.length;
  const stampsOnSheet = n === 0 ? 0 : ((n - 1) % STAMPS_PER_SHEET) + 1;
  const sheetNo = n === 0 ? 1 : Math.floor((n - 1) / STAMPS_PER_SHEET) + 1;
  const st = streak(save);

  const start = (list, kind = "full") => setScreen({ name: "session", list, kind, key: Date.now() });
  const home = () => setScreen({ name: "home" });

  if (screen.name === "session")
    return (
      <Shell>
        <Session
          key={screen.key}
          list={screen.list}
          kind={screen.kind}
          onFinish={(res) => { const { next, newly } = applyResult(save, res); setSave(next); return { newly }; }}
          onBack={home}
        />
      </Shell>
    );

  if (screen.name === "board")
    return (
      <Shell>
        <div className="screen">
          <div className="topbar">
            <button className="btn-back" onClick={home}>← もどる</button>
            <span className="cat-tag">📋 1年生の かん字 {learned} / {KANJI.length}</span>
          </div>
          <div className="pnote center">おぼえた かん字は 赤せんで けして いくよ。<br />なか間の はこを タップすると、その 10こで 3回てん できるよ。</div>
          {GROUPS.map((g, gi) => {
            const done = g.filter((k) => isLearned(save, k)).length;
            return (
              <button key={gi} className="group" onClick={() => start(g)}>
                <div className="group-head"><b>{gi * 10 + 1}〜{gi * 10 + g.length}</b><span>{done} / {g.length}</span></div>
                <div className="tiles">
                  {g.map((k) => (
                    <span key={k} className={"tile" + (isLearned(save, k) ? " done" : "") + (save.weak.includes(k) ? " weak" : "")}>{k}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </Shell>
    );

  if (screen.name === "parent")
    return <Shell><Parent save={save} setSave={setSave} onBack={home} /></Shell>;

  const line = !today
    ? "今日も 3回てんで、かん字を ふやそう！"
    : allDone
    ? "1年生の かん字、ぜんぶ おぼえたね！ ときどき ふくしゅう しよう。"
    : "今日も がんばったね！ もう 1回 やっても いいよ。";

  return (
    <Shell>
      <div className="screen home">
        <KingdomBack />
        <h1 className="title">かん字 3回てん</h1>
        <div className="hero">
          <img src={noa} alt="きしの ノア" className="noa-home" />
          <div className="bubble">{line}</div>
        </div>

        <div className="menu">
          <button className="menu-btn main" onClick={() => start(nextList)}>
            <span className="menu-icon">📖</span>
            <span>
              <b>{allDone ? "ふくしゅうの 3回てん" : "今日の 3回てん"}</b>
              <small className="chips-inline">{nextList.join(" ")}</small>
            </span>
          </button>
          {save.weak.length > 0 && (
            <button className="menu-btn warn" onClick={() => start(save.weak.slice(0, 10), "dameoshi")}>
              <span className="menu-icon">🛡️</span>
              <span><b>テスト前の だめおし</b><small>3回 まちがえた かん字 {save.weak.length}こ</small></span>
            </button>
          )}
          <button className="menu-btn" onClick={() => setScreen({ name: "board" })}>
            <span className="menu-icon">📋</span>
            <span><b>かん字 ひょう</b><small>おぼえた かん字を けして いこう（{learned} / {KANJI.length}）</small></span>
          </button>
        </div>

        <div className="library">
          <div className="lib-head"><span>📚 ノアの 図書かん</span><span>本 {learned}さつ</span></div>
          <div className="shelves">
            {Array.from({ length: 4 }).map((_, row) => (
              <div key={row} className="shelf">
                {Array.from({ length: 20 }).map((_, i) => {
                  const idx = row * 20 + i;
                  return <span key={i} className={"spine" + (idx < learned ? " on" : "")} style={idx < learned ? { background: SPINES[idx % SPINES.length], height: `${78 + ((idx * 7) % 22)}%` } : undefined} />;
                })}
              </div>
            ))}
          </div>
          <div className="lib-note">{allDone ? "たなが いっぱいに なった！" : `あと ${KANJI.length - learned}さつで たなが いっぱい！`}</div>
        </div>

        <div className="stamp-card">
          <div className="stamp-head">
            <span>🌟 スタンプカード{sheetNo > 1 ? `（${sheetNo}まいめ）` : ""}</span>
            {st > 0 && <span className="streak">れんぞく {st}日</span>}
          </div>
          <div className="stamps">
            {Array.from({ length: STAMPS_PER_SHEET }).map((_, i) => (
              <div key={i} className={"stamp" + (i < stampsOnSheet ? " on" : "")}>{i < stampsOnSheet ? "🛡️" : i + 1}</div>
            ))}
          </div>
        </div>

        <button className="parent-link" onClick={() => setScreen({ name: "parent" })}>👪 おうちの人</button>
      </div>
    </Shell>
  );
}

function Parent({ save, setSave, onBack }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const recent = [...save.log].reverse().slice(0, 15);
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
        <h3>このアプリの覚え方</h3>
        <div className="pnote">
          覚えるとは「書くこと」ではなく「繰り返しテストすること」。<br />
          ・「読み」→「書き」の順にテストします（読みで何度も字を見るので、書きは半分くらいできた状態から始まります）<br />
          ・1回目にできた字は、2回目には出しません。間違えた字だけを3回転させます<br />
          ・3回やっても間違えた字だけを、3回書いて覚えます<br />
          ・3回間違えた字はテストに出やすい字。テスト直前に「だめおし」でもう一度やります<br />
          ・覚えた字は表から消していき、ゴールまでの残りを見える化します
        </div>
        <div className="pnote">書きは子どもが自分で丸つけします。ズルをしても責めずに、「自分でテストできたね」と声をかけてください。</div>
      </section>
      <section className="psec">
        <h3>最近の記録</h3>
        {recent.length === 0 && <div className="pnote">まだありません。</div>}
        {recent.map((r, i) => (
          <div key={i} className="log">
            <div className="log-d">{r.d}　{r.kind === "full" ? "3回転" : "だめおし"}　{r.list.join("")}</div>
            {r.kind === "full" && <div>読み 3回間違い：{r.yomiMiss.length ? r.yomiMiss.join("") : "なし"}</div>}
            <div>書き {r.kind === "full" ? "3回" : ""}間違い：{r.kakiMiss.length ? <b className="log-a">{r.kakiMiss.join("")}</b> : "なし"}</div>
          </div>
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

function Shell({ children }) { return <div className="shell">{children}</div>; }
