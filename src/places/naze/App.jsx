/* =====================================================================
   なぜなぜのもり — みならい まじょ ルゥと「なぜ？」を かんがえる
   ===================================================================== */
import { useEffect, useMemo, useState } from "react";
import KingdomBack from "../KingdomBack.jsx";
import { CATEGORIES } from "./data.js";
import {
  loadSave, writeSave, dayOf, treeStage, playedDays, streak, pickCard, addAnswer, addLadder, MAX_CARDS_PER_DAY,
} from "./store.js";
import Tree from "./Tree.jsx";
import CardMode from "./CardMode.jsx";
import LadderMode from "./LadderMode.jsx";
import ParentMode from "./ParentMode.jsx";
import ruu from "./art/ruu.webp";

const STAMPS_PER_SHEET = 10;

export default function App() {
  const [save, setSaveState] = useState(loadSave);
  const [screen, setScreen] = useState({ name: "home" });
  const setSave = (s) => { setSaveState(s); writeSave(s); };

  useEffect(() => { window.scrollTo(0, 0); }, [screen.name]);

  const today = dayOf(save);
  const cardsToday = today.cards.length;
  const todayCard = useMemo(() => pickCard(save, { exclude: today.cards }), [save, today.cards]);
  const tree = treeStage(save.mi);
  const days = playedDays(save);
  const n = days.length;
  const stampsOnSheet = n === 0 ? 0 : ((n - 1) % STAMPS_PER_SHEET) + 1;
  const sheetNo = n === 0 ? 1 : Math.floor((n - 1) / STAMPS_PER_SHEET) + 1;
  const st = streak(save);
  const canMore = cardsToday < MAX_CARDS_PER_DAY;

  const startCard = (cat = null) => {
    const card = cat ? pickCard(save, { cat, exclude: today.cards }) : todayCard;
    setScreen({ name: "card", card });
  };

  if (screen.name === "card")
    return (
      <Shell>
        <CardMode
          card={screen.card}
          onFinish={(rec, gain) => setSave(addAnswer(save, rec, gain))}
          onBack={() => setScreen({ name: "home" })}
        />
      </Shell>
    );
  if (screen.name === "ladder")
    return (
      <Shell>
        <LadderMode onFinish={(gain) => setSave(addLadder(save, gain))} onBack={() => setScreen({ name: "home" })} />
      </Shell>
    );
  if (screen.name === "parent")
    return (
      <Shell>
        <ParentMode save={save} setSave={setSave} todayCard={todayCard} onBack={() => setScreen({ name: "home" })} />
      </Shell>
    );

  const line =
    cardsToday === 0
      ? "今日も いっしょに「なぜ？」を さがそう！"
      : canMore
      ? "すてきな 考え、ありがとう！ もう1まい やってみる？"
      : "今日の カードは おしまい！ また 明日 ふしぎを さがそうね。";

  return (
    <Shell>
      <div className="screen home">
        <KingdomBack />
        <h1 className="title">なぜなぜの 森</h1>

        <div className="hero">
          <img src={ruu} alt="まじょの ルゥ" className="ruu-home" />
          <div className="bubble">{line}</div>
        </div>

        {save.type === "multi" && (
          <div className="plan">
            <div className="plan-title">📅 今日の よてい</div>
            <div className={"plan-item" + (cardsToday > 0 ? " ok" : "")}>{cardsToday > 0 ? "✅" : "⬜"} なぜ？カード 1まい　<small>→ 光の みが 1〜2こ ふえる</small></div>
            <div className={"plan-item" + (today.ladders ? " ok" : "")}>{today.ladders ? "✅" : "⬜"} 言ばの はしご 1回　<small>→ 光の みが 1こ ふえる</small></div>
          </div>
        )}

        <div className="menu">
          {cardsToday === 0 && (
            <button className="menu-btn main" onClick={() => startCard()}>
              <span className="menu-icon">🃏</span>
              <span><b>今日の なぜ？カード</b><small>ルゥからの しつもんに 答えよう</small></span>
            </button>
          )}
          {cardsToday > 0 && canMore && save.type !== "single" && (
            <button className="menu-btn main" onClick={() => startCard()}>
              <span className="menu-icon">🃏</span>
              <span><b>もう1まい</b><small>今日は あと {MAX_CARDS_PER_DAY - cardsToday}まい</small></span>
            </button>
          )}
          {cardsToday > 0 && canMore && save.type === "single" && (
            <div className="cat-pick">
              <div className="cat-pick-title">すきな なか間から えらんでね（あと {MAX_CARDS_PER_DAY - cardsToday}まい）</div>
              <div className="cat-grid">
                {Object.entries(CATEGORIES).map(([k, c]) => (
                  <button key={k} className="cat-btn" onClick={() => startCard(k)}>{c.icon}<br />{c.label}</button>
                ))}
              </div>
            </div>
          )}
          <button className="menu-btn" onClick={() => setScreen({ name: "ladder" })}>
            <span className="menu-icon">🪜</span>
            <span><b>言ばの はしご</b><small>「ようするに？」「たとえば？」で のぼろう</small></span>
          </button>
        </div>

        <div className="tree-card">
          <Tree stage={tree.idx} mi={save.mi} size={190} />
          <div className="tree-info">
            <div className="tree-name">{tree.stage.name}</div>
            <div className="mi-count"><span className="mi-dot" /> 光の み {save.mi}こ</div>
            {tree.next && <div className="tree-next">あと {tree.toNext}こで「{tree.next.name}」</div>}
          </div>
        </div>

        <div className="stamp-card">
          <div className="stamp-head">
            <span>🌟 スタンプカード{sheetNo > 1 ? `（${sheetNo}まいめ）` : ""}</span>
            {st > 0 && <span className="streak">れんぞく {st}日</span>}
          </div>
          <div className="stamps">
            {Array.from({ length: STAMPS_PER_SHEET }).map((_, i) => (
              <div key={i} className={"stamp" + (i < stampsOnSheet ? " on" : "")}>{i < stampsOnSheet ? "🍀" : i + 1}</div>
            ))}
          </div>
        </div>

        <button className="parent-link" onClick={() => setScreen({ name: "parent" })}>👪 おうちの人</button>
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return <div className="shell">{children}</div>;
}
