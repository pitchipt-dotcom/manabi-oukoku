/* =====================================================================
   3回てん（『小学生の勉強法』の おぼえかた）
   - おぼえるとは「かく」ことではなく「くりかえし テストする」こと
   - よみ → かき の じゅん
   - 1回目に できた もんだいは、2回目は やらない（まちがえた ものだけ）
   - 3回 やっても まちがえた かん字だけ、3回 書いて おぼえる
   - 3回 まちがえた かん字が テストに でる → だめおしの リストへ
   ===================================================================== */
import { useEffect, useMemo, useRef, useState } from "react";
import { KANJI, byKanji } from "./kanji1.js";
import WritePad from "./WritePad.jsx";
import noa from "./art/noa.webp";

const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const PAD = Math.min(260, Math.floor((typeof window !== "undefined" ? window.innerWidth : 360) - 90));

function Sentence({ item, mode }) {
  return (
    <div className="sentence">
      {item.before}
      {mode === "yomi" ? <span className="hl">{item.k}</span> : <span className="box">{item.yomi}</span>}
      {item.after}
    </div>
  );
}

function YomiQ({ item, onDone }) {
  const choices = useMemo(() => {
    const others = shuffle(KANJI.filter((x) => x.yomi !== item.yomi).map((x) => x.yomi));
    const uniq = [...new Set(others)].slice(0, 3);
    return shuffle([item.yomi, ...uniq]);
  }, [item]);
  const [picked, setPicked] = useState(null);
  const ok = picked === item.yomi;

  const pick = (c) => {
    if (picked) return;
    setPicked(c);
    if (c === item.yomi) setTimeout(() => onDone(true), 650);
  };
  return (
    <>
      <div className="qcard" style={{ borderColor: "#6FA8F0" }}>
        <div className="qkind" style={{ background: "#3F7BD6" }}>読み</div>
        <Sentence item={item} mode="yomi" />
        <div className="q-sub">赤い かん字は 何と 読む？</div>
        <div className="choices grid2">
          {choices.map((c) => (
            <button key={c}
              className={"choice" + (picked && c === item.yomi ? " right" : "") + (picked === c && !ok ? " wrong" : "")}
              onClick={() => pick(c)}>{c}</button>
          ))}
        </div>
        {picked && ok && <div className="ok-mark pop">⭕</div>}
      </div>
      {picked && !ok && (
        <div className="miss-box">
          <div>答えは「<b>{item.yomi}</b>」。まちがえた かん字は、つぎの 回で また 出るよ！</div>
          <button className="btn btn-main" onClick={() => onDone(false)}>つぎへ</button>
        </div>
      )}
    </>
  );
}

function KakiQ({ item, onDone }) {
  const padRef = useRef(null);
  const [shown, setShown] = useState(false);
  return (
    <>
      <div className="qcard" style={{ borderColor: "#F2A93B" }}>
        <div className="qkind" style={{ background: "#E8912B" }}>書き</div>
        <Sentence item={item} mode="kaki" />
        <div className="q-sub">□の ところを かん字で 書こう</div>
        <div className="pad-row">
          <WritePad ref={padRef} size={PAD} />
        </div>
        {shown && <div className="model pop"><small>答え</small><span>{item.k}</span></div>}
        {!shown && (
          <div className="ab-row">
            <button className="btn btn-sub" onClick={() => padRef.current.clear()}>けす</button>
            <button className="btn btn-main" onClick={() => setShown(true)}>答えを 見る</button>
          </div>
        )}
        {shown && (
          <>
            <div className="q-sub">自分で 丸つけ しよう</div>
            <div className="ab-row">
              <button className="btn btn-ok" onClick={() => onDone(true)}>⭕ 書けた！</button>
              <button className="btn btn-sub" onClick={() => onDone(false)}>まちがえた</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Practice({ list, onDone }) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  const padRef = useRef(null);
  const item = byKanji[list[i]];
  const next = () => {
    padRef.current.clear();
    if (n + 1 < 3) { setN(n + 1); return; }
    setN(0);
    if (i + 1 < list.length) setI(i + 1); else onDone();
  };
  return (
    <div className="qcard" style={{ borderColor: "#E8618C" }}>
      <div className="qkind" style={{ background: "#E8618C" }}>3回 書こう</div>
      <Sentence item={item} mode="yomi" />
      <div className="q-sub">お手本を なぞって 書こう（{n + 1} / 3 回目）</div>
      <div className="pad-row"><WritePad key={list[i]} ref={padRef} size={PAD} guide={item.k} /></div>
      <div className="dots">{[0, 1, 2].map((d) => <span key={d} className={d < n ? "on" : d === n ? "now" : ""} />)}</div>
      <button className="btn btn-main" onClick={next}>書けた！</button>
    </div>
  );
}

export default function Session({ list, kind = "full", onFinish, onBack }) {
  const maxRounds = kind === "full" ? 3 : 1;
  const [phase, setPhase] = useState(kind === "full" ? "intro" : "kaki");
  const [round, setRound] = useState(1);
  const [queue, setQueue] = useState(() => shuffle(list));
  const [idx, setIdx] = useState(0);
  const [wrong, setWrong] = useState([]);
  const [between, setBetween] = useState(null);
  const [yomiMiss, setYomiMiss] = useState([]);
  const [kakiMiss, setKakiMiss] = useState([]);
  const [result, setResult] = useState(null);
  const finished = useRef(false);

  const startRound = (type, r, items) => {
    setPhase(type); setRound(r); setQueue(shuffle(items)); setIdx(0); setWrong([]); setBetween(null);
  };

  const endRound = (type, wrongList) => {
    if (wrongList.length && round < maxRounds) {
      setBetween({ type, round, wrong: wrongList, next: () => startRound(type, round + 1, wrongList) });
      setPhase("between");
      return;
    }
    if (type === "yomi") {
      setYomiMiss(wrongList);
      setBetween({ type: "toKaki", wrong: wrongList, next: () => startRound("kaki", 1, list) });
      setPhase("between");
      return;
    }
    setKakiMiss(wrongList);
    if (wrongList.length) { setPhase("practice"); return; }
    setPhase("result");
  };

  const answer = (ok) => {
    const w = ok ? wrong : [...wrong, queue[idx]];
    setWrong(w);
    if (idx + 1 < queue.length) setIdx(idx + 1);
    else endRound(phase, w);
  };

  useEffect(() => {
    if (phase === "result" && !finished.current) {
      finished.current = true;
      setResult(onFinish({ kind, list, yomiMiss, kakiMiss }));
    }
  }, [phase]); // eslint-disable-line

  useEffect(() => { window.scrollTo(0, 0); }, [phase, idx]);

  const typeLabel = phase === "yomi" ? "読み" : "書き";

  return (
    <div className="screen session">
      <div className="topbar">
        <button className="btn-back" onClick={onBack}>← やめる</button>
        {(phase === "yomi" || phase === "kaki") && (
          <span className="cat-tag">{typeLabel} {round}回目　{idx + 1} / {queue.length}</span>
        )}
        {phase === "practice" && <span className="cat-tag">3回 書いて おぼえる</span>}
      </div>

      {(phase === "yomi" || phase === "kaki") && (
        <div className="progress"><div style={{ width: `${(idx / queue.length) * 100}%` }} /></div>
      )}

      {phase === "intro" && (
        <div className="done">
          <img src={noa} alt="" className="noa-big pop" />
          <div className="bubble big">
            今日の かん字は {list.length}こ！<br />
            「読む」→「書く」の じゅんに、<b>3回てん</b> するよ。<br />
            1回で できた かん字は、もう 出ないからね。
          </div>
          <div className="kanji-chips">{list.map((k) => <span key={k}>{k}</span>)}</div>
          <button className="btn btn-main" onClick={() => startRound("yomi", 1, list)}>はじめる！</button>
        </div>
      )}

      {phase === "yomi" && <YomiQ key={`y${round}-${idx}`} item={byKanji[queue[idx]]} onDone={answer} />}
      {phase === "kaki" && <KakiQ key={`k${round}-${idx}`} item={byKanji[queue[idx]]} onDone={answer} />}

      {phase === "between" && between && (
        <div className="done">
          <img src={noa} alt="" className="noa-big pop" />
          <div className="bubble big">
            {between.type === "toKaki" ? (
              <>読み、おわり！<br />つぎは「書く」テスト。<br />{list.length}こ ぜんぶ やってみよう！</>
            ) : (
              <>
                {between.type === "yomi" ? "読み" : "書き"} {between.round}回目 おわり！<br />
                できた かん字は、もう 出ないよ。<br />
                まちがえた <b>{between.wrong.length}こ</b>だけ、もう 一ど！
              </>
            )}
          </div>
          {between.type !== "toKaki" && <div className="kanji-chips">{between.wrong.map((k) => <span key={k}>{k}</span>)}</div>}
          <button className="btn btn-main" onClick={between.next}>つぎへ</button>
        </div>
      )}

      {phase === "practice" && (
        <>
          <div className="bubble-row">
            <img src={noa} alt="" className="noa-mini" />
            <div className="bubble">
              {kind === "full" ? "3回 やっても まちがえた" : "まちがえた"} かん字は、テストに 出やすい かん字！ ここで はじめて「書いて」おぼえよう。
            </div>
          </div>
          <Practice list={kakiMiss} onDone={() => setPhase("result")} />
        </>
      )}

      {phase === "result" && (
        <div className="done">
          <img src={noa} alt="" className="noa-big pop" />
          <div className="bubble big">
            {kind === "full" ? "3回てん、かんりょう！" : "だめおし、かんりょう！"}<br />
            {result && result.newly.length > 0
              ? <>新しく おぼえた かん字 <b>{result.newly.length}こ</b>。<br />図書かんに 本が ふえたよ！</>
              : <>さい後まで やりきったね！</>}
          </div>
          {result && result.newly.length > 0 && (
            <div className="new-books">{result.newly.map((k, i) => <span key={k} className="book pop" style={{ animationDelay: `${0.2 + i * 0.12}s` }}>{k}</span>)}</div>
          )}
          {kakiMiss.length > 0 && (
            <div className="weak-box">
              <b>テスト前の だめおし リスト</b>
              <div className="kanji-chips">{kakiMiss.map((k) => <span key={k}>{k}</span>)}</div>
              <small>テストの 前に「だめおし」で もう 一ど やろう！</small>
            </div>
          )}
          <button className="btn btn-main" onClick={onBack}>図書かんに もどる</button>
        </div>
      )}
    </div>
  );
}
