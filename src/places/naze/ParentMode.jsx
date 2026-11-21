/* おうちのひと：タイプ・きょうの といかけ・こたえの きろく・バックアップ */
import { useState } from "react";
import { CARDS, KINDS } from "./data.js";
import { encodeSave, decodeSave, todayKey } from "./store.js";

const HOW = { voice: "🎤 声", text: "✏️ 文字", talk: "🗣️ 話した", wakaranai: "🤔 分からない", skip: "—" };
const cardById = Object.fromEntries(CARDS.map((c) => [c.id, c]));

const TYPES = {
  multi: {
    label: "マルチタスク型",
    desc: "何でもまんべんなくこなす。損か得かで動く。予定ややり方が好き。",
    app: "ホームに「きょうのよてい」を出し、やると光の実が増えることを見せます。",
  },
  single: {
    label: "シングルタスク型",
    desc: "好きなことに一点集中。好きか嫌いかで動く。",
    app: "2枚目からは、好きなジャンルを自分で選べるようにします。",
  },
};

export default function ParentMode({ save, setSave, todayCard, onBack }) {
  // きょう こたえた カードが あれば その カード、なければ きょうの カード
  const lastToday = [...save.answers].reverse().find((a) => a.d === todayKey());
  const tipCard = (lastToday && cardById[lastToday.id]) || todayCard;
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const recent = [...save.answers].reverse().slice(0, 30);

  const copyCode = async () => {
    const c = encodeSave(save);
    setCode(c);
    try { await navigator.clipboard.writeText(c); setMsg("コピーしました。どこかにメモしておいてください。"); }
    catch (e) { setMsg("コピーできなかったら、下の枠を長押ししてコピーしてください。"); }
  };
  const restore = () => {
    const d = decodeSave(code);
    if (!d) { setMsg("コードが正しくないようです。もう一度確かめてください。"); return; }
    setSave(d);
    setMsg("元に戻しました！");
  };

  return (
    <div className="screen parent-screen">
      <div className="topbar">
        <button className="btn-back" onClick={onBack}>← もどる</button>
        <span className="cat-tag">👪 おうちの人</span>
      </div>

      <section className="psec">
        <h3>今日の問いかけ（ごはんやお風呂で）</h3>
        <div className="ptip-q">{tipCard.q}</div>
        <div className="ptip">{tipCard.tip}</div>
        <div className="pnote">
          答えの中身はどうでも大丈夫。頭が動くことが目的です。
          子どもが乗ってこないときは、おうちの人が自分の考えを言うだけでOK。
          5つ全部使わなくても、「なぜだろう？」「要するに？」の2つだけでも十分です。
        </div>
      </section>

      <section className="psec">
        <h3>子どものタイプ</h3>
        <div className="type-row">
          {Object.entries(TYPES).map(([k, t]) => (
            <button key={k} className={"type-btn" + (save.type === k ? " on" : "")} onClick={() => setSave({ ...save, type: k })}>
              <b>{t.label}</b>
              <small>{t.desc}</small>
            </button>
          ))}
        </div>
        {save.type && <div className="pnote">アプリでは：{TYPES[save.type].app}</div>}
        <div className="pnote small">10歳ごろまでは、どの子もシングルタスク型に見えやすいといわれます。迷ったらシングルタスク型で始めてみてください。</div>
      </section>

      <section className="psec">
        <h3>答えの記録（最近30件）</h3>
        {recent.length === 0 && <div className="pnote">まだありません。</div>}
        {recent.map((a, i) => {
          const c = cardById[a.id];
          return (
            <div key={i} className="log">
              <div className="log-d">{a.d}　{HOW[a.how] || ""}</div>
              <div className="log-q">{c ? c.q : a.id}</div>
              {a.text && <div className="log-a">「{a.text}」</div>}
              {c && a.followHow && a.followHow !== "skip" && (
                <div className="log-f">
                  <span style={{ color: KINDS[c.follow.kind].color }}>{c.follow.q}</span>
                  {a.followText ? <>　「{a.followText}」</> : <>　{HOW[a.followHow]}</>}
                </div>
              )}
            </div>
          );
        })}
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
