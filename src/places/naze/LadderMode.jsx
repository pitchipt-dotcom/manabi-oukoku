/* ことばの はしご：「ようするに？」で 上へ、さいごに「たとえば？」で 下へ
   まちがえても バツに しない（「おしい！」で もう一ど） */
import { useMemo, useState } from "react";
import { LADDERS } from "./data.js";
import ruu from "./art/ruu.webp";

const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
// たべものと のみものは まぎらわしいので、おたがいの まちがい せんたくしに しない
const CONFLICT = { 食べもの: "のみもの", のみもの: "食べもの" };

function makeRound() {
  const li = Math.floor(Math.random() * LADDERS.length);
  const chain = LADDERS[li];
  const others = LADDERS.filter((_, i) => i !== li && !(CONFLICT[chain[0]] === LADDERS[i][0]));
  const steps = [];
  // 下から 上へ
  for (let k = chain.length - 1; k >= 1; k--) {
    const wrong = shuffle(others.filter((c) => c.length > k - 1).map((c) => c[k - 1])).slice(0, 2);
    steps.push({ type: "up", from: chain[k], answer: chain[k - 1], choices: shuffle([chain[k - 1], ...wrong]) });
  }
  // さいごに「たとえば？」
  const t = others[Math.floor(Math.random() * others.length)];
  const tOthers = LADDERS.filter((c) => c !== t && !(CONFLICT[t[0]] === c[0]));
  const wrong = shuffle(tOthers.map((c) => c[1])).slice(0, 2);
  steps.push({ type: "down", from: t[0], answer: t[1], choices: shuffle([t[1], ...wrong]) });
  return { chain, steps };
}

export default function LadderMode({ onFinish, onBack }) {
  const round = useMemo(makeRound, []);
  const [i, setI] = useState(0);
  const [miss, setMiss] = useState(null);
  const [done, setDone] = useState(false);
  const step = round.steps[i];
  const upCount = round.chain.length - 1;
  const climbed = Math.min(i, upCount); // のぼった だんの かず

  const choose = (w) => {
    if (w !== step.answer) { setMiss(w); return; }
    setMiss(null);
    if (i + 1 >= round.steps.length) { setDone(true); onFinish(1); }
    else setI(i + 1);
  };

  return (
    <div className="screen ladder-screen">
      <div className="topbar">
        <button className="btn-back" onClick={onBack}>← もどる</button>
        <span className="cat-tag">🪜 言ばの はしご</span>
      </div>

      <div className="ladder">
        {round.chain.map((w, k) => {
          const shown = k >= round.chain.length - 1 - climbed;
          return (
            <div key={w} className={"rung" + (shown ? " shown" : "")}>
              {shown ? w : "？"}
            </div>
          );
        })}
      </div>

      {!done && (
        <div className="qcard" style={{ borderColor: step.type === "up" ? "#7A5CC8" : "#2FAF8E" }}>
          <div className="qkind" style={{ background: step.type === "up" ? "#7A5CC8" : "#2FAF8E" }}>
            {step.type === "up" ? "ようするに？" : "たとえば？"}
          </div>
          <div className="qtext">
            {step.type === "up"
              ? <>「{step.from}」は、ようするに 何の なか間？</>
              : <>今どは 下へ！「{step.from}」って、たとえば 何？</>}
          </div>
          <div className="choices">
            {step.choices.map((w) => (
              <button key={w} className={"choice" + (miss === w ? " shake" : "")} onClick={() => choose(w)}>{w}</button>
            ))}
          </div>
          {miss && <div className="ab-note">おしい！ もう 一ど 考えて みよう。</div>}
        </div>
      )}

      {done && (
        <div className="done">
          <img src={ruu} alt="" className="ruu-big pop" />
          <div className="bubble big">
            てっぺんまで のぼれたね！<br />
            「ようするに」で まとめて、「たとえば」で ぐたいてきに。<br />
            光の みを <b>1こ</b> あげるね。
          </div>
          <div className="mi-gain"><span className="mi-dot pop" style={{ animationDelay: ".2s" }} /></div>
          <button className="btn btn-main" onClick={onBack}>森に もどる</button>
        </div>
      )}
    </div>
  );
}
