/* なぜ？カード：とい → こたえる → ほめる＋おいかけの とい（1つ）→ ごほうび */
import { useMemo, useState } from "react";
import { KINDS, PRAISE, PRAISE_WAKARANAI, CATEGORIES } from "./data.js";
import AnswerBox from "./AnswerBox.jsx";
import { speak } from "./speech.js";
import ruu from "./art/ruu.webp";

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default function CardMode({ card, onFinish, onBack }) {
  const [phase, setPhase] = useState("q"); // q | follow | done
  const [first, setFirst] = useState(null);
  const [gain, setGain] = useState(0);
  const kind = KINDS[card.kind];
  const fkind = KINDS[card.follow.kind];

  const praise = useMemo(
    () => (first && first.how === "wakaranai" ? pick(PRAISE_WAKARANAI) : pick(PRAISE)),
    [first]
  );

  const answerFirst = (a) => {
    setFirst(a);
    setGain(1);
    setPhase("follow");
  };

  const answerFollow = (a) => {
    const g = a && a.how !== "wakaranai" ? 2 : 1;
    setGain(g);
    setPhase("done");
    onFinish(
      { id: card.id, how: first.how, text: first.text, followHow: a ? a.how : "skip", followText: a ? a.text : "" },
      g
    );
  };

  return (
    <div className="screen card-screen">
      <div className="topbar">
        <button className="btn-back" onClick={onBack}>← もどる</button>
        <span className="cat-tag">{CATEGORIES[card.cat].icon} {CATEGORIES[card.cat].label}</span>
      </div>

      {phase !== "done" && (
        <div className="qcard" style={{ borderColor: (phase === "q" ? kind : fkind).color }}>
          <div className="qkind" style={{ background: (phase === "q" ? kind : fkind).color }}>
            {(phase === "q" ? kind : fkind).label}
          </div>
          {phase === "follow" && <div className="q-prev">{card.q}</div>}
          <div className="qtext">{phase === "q" ? card.q : card.follow.q}</div>
          <button className="btn-speak" onClick={() => speak(phase === "q" ? card.q : card.follow.q)}>🔊 読んで</button>
        </div>
      )}

      {phase === "follow" && (
        <div className="bubble-row">
          <img src={ruu} alt="" className="ruu-mini" />
          <div className="bubble">{praise}<br />もう 一つ、聞いても いい？</div>
        </div>
      )}

      {phase === "q" && <AnswerBox key="q" onAnswer={answerFirst} />}
      {phase === "follow" && <AnswerBox key="f" onAnswer={answerFollow} allowSkip skipLabel="今日は ここまで（つぎへ）" />}

      {phase === "done" && (
        <div className="done">
          <img src={ruu} alt="" className="ruu-big pop" />
          <div className="bubble big">
            考える まほう、大せいこう！<br />
            光の みを <b>{gain}こ</b> あげるね。
          </div>
          <div className="mi-gain">{Array.from({ length: gain }).map((_, i) => <span key={i} className="mi-dot pop" style={{ animationDelay: `${0.2 + i * 0.25}s` }} />)}</div>
          <button className="btn btn-main" onClick={onBack}>森に もどる</button>
        </div>
      )}
    </div>
  );
}
