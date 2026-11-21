/* こたえる はこ：こえ・もじ・「はなした」・「わからない」の どれでも すすめる */
import { useState } from "react";
import { canListen, useListen } from "./speech.js";

export default function AnswerBox({ onAnswer, allowSkip = false, skipLabel = "つぎへ" }) {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState(false);
  const { listening, failed, start, stop } = useListen((t) => { setText(t); setVoice(true); });
  const has = text.trim().length > 0;

  return (
    <div className="ab">
      {canListen && (
        <button className={"ab-mic" + (listening ? " on" : "")} onClick={listening ? stop : start}>
          <span className="ab-mic-icon">🎤</span>
          {listening ? "聞いてるよ… おわったら タップ" : "声で 答える"}
        </button>
      )}
      {failed && <div className="ab-note">声が うまく 聞こえなかったみたい。字でも、おうちの人に 話しても いいよ。</div>}
      <textarea
        className="ab-text"
        rows={2}
        value={text}
        placeholder="ここに 書いても いいよ"
        onChange={(e) => setText(e.target.value)}
      />
      <div className="ab-row">
        <button className="btn btn-main" disabled={!has} onClick={() => onAnswer({ how: voice ? "voice" : "text", text: text.trim() })}>
          答えた！
        </button>
      </div>
      <div className="ab-row ab-row-sub">
        <button className="btn btn-sub" onClick={() => onAnswer({ how: "talk", text: "" })}>話したよ</button>
        <button className="btn btn-sub" onClick={() => onAnswer({ how: "wakaranai", text: "" })}>分からない</button>
      </div>
      {allowSkip && (
        <button className="btn btn-link" onClick={() => onAnswer(null)}>{skipLabel}</button>
      )}
    </div>
  );
}
