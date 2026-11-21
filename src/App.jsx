/* =====================================================================
   まなびの 王国 — けいさんプリンセスと 同じ 王国の 4つの 場所
   タイトル → ホーム（今日の 手ちょう＋どこから はじめよう？）→ 場所
   ===================================================================== */
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { KingdomCtx } from "./places/KingdomBack.jsx";
import NazeApp from "./places/naze/App.jsx";
import KanjiApp from "./places/kanji/App.jsx";
import TechouApp from "./places/techou/App.jsx";
import SakubunApp from "./places/sakubun/App.jsx";
import { CARDS } from "./places/naze/data.js";
import { KANJI } from "./places/kanji/kanji1.js";
import { KINDS as SAKUBUN_KINDS } from "./places/sakubun/data.js";
import { loadSave as loadTechou, emptySave as emptyTechou, tasksFor, isDone, dateKey, dow, WEEK } from "./places/techou/store.js";
import {
  loadKingdom, saveKingdom, seedAutoTasks, syncAutoDone, playedDays, streak, exportAll, importAll, buildReport,
} from "./kingdom.js";
import ruu from "./places/naze/art/ruu.webp";
import noa from "./places/kanji/art/noa.webp";
import chikuta from "./places/techou/art/chikuta.webp";
import pen from "./places/sakubun/art/pen.webp";

/* けいさんプリンセスの 場所（本番の URL に かえる） */
export const KEISAN_URL = "https://play.google.com/store/apps/details?id=jp.pitchpt.keisanprincess";

const PLACES = [
  { id: "naze", label: "考える 森", sub: "なぜ？カード・言ばの はしご", who: "ルゥ", art: ruu, color: "#3FA04F", bg: "#ECF8E6", App: NazeApp },
  { id: "kanji", label: "図書かん", sub: "かん字 3回てん・だめおし", who: "ノア", art: noa, color: "#3F7BD6", bg: "#EAF3FF", App: KanjiApp },
  { id: "sakubun", label: "ゆうびんきょく", sub: "作文・せつ明文・読書かんそう文", who: "ペン", art: pen, color: "#2D9CC0", bg: "#E6F7FB", App: SakubunApp },
  { id: "techou", label: "時計とう", sub: "手ちょう・週の まとめ・手紙", who: "チクタ", art: chikuta, color: "#E8821C", bg: "#FFF3E6", App: TechouApp },
];
const STAMPS_PER_SHEET = 10;

export default function App() {
  const [kingdom, setKingdom] = useState(() => seedAutoTasks(loadKingdom(), emptyTechou));
  const [screen, setScreen] = useState({ name: "title" });
  const [tick, setTick] = useState(0); // 場所から もどった ときに よみなおす
  const setK = (k) => { setKingdom(k); saveKingdom(k); };

  useEffect(() => { window.scrollTo(0, 0); }, [screen.name, screen.place]);

  const openPlace = (id) => { setK({ ...kingdom, lastPlace: id }); setScreen({ name: "place", place: id }); };
  const backHome = () => { syncAutoDone(); setTick(tick + 1); setScreen({ name: "home" }); };

  if (screen.name === "place") {
    const P = PLACES.find((p) => p.id === screen.place);
    return (
      <KingdomCtx.Provider value={{ onExit: backHome }}>
        <div className={`kingdom pl-${P.id}`}><P.App /></div>
      </KingdomCtx.Provider>
    );
  }
  if (screen.name === "parent") return <div className="kingdom k-bg"><Parent onBack={backHome} /></div>;
  if (screen.name === "title")
    return (
      <div className="kingdom k-bg">
        <div className="k-shell k-title">
          <div className="k-crown">👑</div>
          <h1 className="k-logo">まなびの 王国</h1>
          <div className="k-sub">けいさんプリンセスの なか間たちと、考える 力を そだてよう</div>
          <div className="k-cast">
            {PLACES.map((p, i) => <img key={p.id} src={p.art} alt={p.who} className={`k-cast-${i}`} />)}
          </div>
          <button className="k-start" onClick={() => { syncAutoDone(); setScreen({ name: "home" }); }}>はじめる！</button>
        </div>
      </div>
    );
  return <div className="kingdom k-bg"><Home key={tick} kingdom={kingdom} openPlace={openPlace} goParent={() => setScreen({ name: "parent" })} /></div>;
}

/* ---------------- ホーム ---------------- */
function Home({ kingdom, openPlace, goParent }) {
  const techou = loadTechou();
  const today = dateKey();
  const list = tasksFor(techou, today);
  const doneN = list.filter((t) => isDone(techou, today, t.id)).length;
  const n = playedDays().length;
  const stampsOnSheet = n === 0 ? 0 : ((n - 1) % STAMPS_PER_SHEET) + 1;
  const sheetNo = n === 0 ? 1 : Math.floor((n - 1) / STAMPS_PER_SHEET) + 1;
  const st = streak();
  const d = new Date();

  return (
    <div className="k-shell">
      <div className="k-head">
        <h1 className="k-logo small">まなびの 王国</h1>
      </div>

      <button className="k-techou" onClick={() => openPlace("techou")}>
        <div className="k-techou-head">
          <img src={chikuta} alt="" />
          <div>
            <b>今日の 手ちょう</b>
            <small>{d.getMonth() + 1}月{d.getDate()}日（{WEEK[dow(d)]}）　{doneN} / {list.length}</small>
          </div>
        </div>
        <div className="k-techou-list">
          {list.slice(0, 5).map((t) => {
            const done = isDone(techou, today, t.id);
            return (
              <div key={t.id} className={"k-ti" + (done ? " done" : "")}>
                <span>{done ? "✅" : "⬜"}</span>{t.icon} {t.title}{t.auto && !done ? <em>🏰</em> : null}
              </div>
            );
          })}
          {list.length > 5 && <div className="k-ti more">ほか {list.length - 5}こ</div>}
          {list.length === 0 && <div className="k-ti">今日の やる ことは まだ ないよ</div>}
        </div>
      </button>

      <h2 className="k-h2">どこから はじめよう？</h2>
      <div className="mg-groups">
        {PLACES.map((p) => (
          <button key={p.id} className={"mg-group" + (kingdom.lastPlace === p.id ? " mg-group-last" : "")}
            style={{ "--mg-color": p.color, "--mg-bg": p.bg }} onClick={() => openPlace(p.id)}>
            {kingdom.lastPlace === p.id && <span className="mg-last-badge">前に あそんだ ところ</span>}
            <span className="mg-art"><img src={p.art} alt="" /></span>
            <span className="mg-text"><b>{p.label}</b><small>{p.who}と {p.sub}</small></span>
          </button>
        ))}
        <a className="mg-group mg-keisan" href={KEISAN_URL} target="_blank" rel="noreferrer" style={{ "--mg-color": "#C0568A", "--mg-bg": "#FFF0F7" }}>
          <span className="mg-icon">👑</span>
          <span className="mg-text"><b>けいさんプリンセス</b><small>九九・くりあがり・まいにち けいさん（べつの アプリ）</small></span>
        </a>
      </div>

      <div className="k-stamp">
        <div className="k-stamp-head">
          <span>🌟 王国の スタンプカード{sheetNo > 1 ? `（${sheetNo}まい目）` : ""}</span>
          {st > 0 && <span className="k-streak">れんぞく {st}日</span>}
        </div>
        <div className="k-stamps">
          {Array.from({ length: STAMPS_PER_SHEET }).map((_, i) => (
            <div key={i} className={"k-st" + (i < stampsOnSheet ? " on" : "")}>{i < stampsOnSheet ? "👑" : i + 1}</div>
          ))}
        </div>
        <small className="k-stamp-note">どこかで 1つ やった 日に 1こ たまるよ</small>
      </div>

      <button className="k-parent-link" onClick={goParent}>👪 おうちの人</button>
    </div>
  );
}

/* ---------------- おうちの人 ---------------- */
function Parent({ onBack }) {
  const report = useMemo(() => buildReport({
    nazeCards: CARDS, kanjiList: KANJI.map((x) => x.k),
    sakubunKinds: Object.fromEntries(Object.entries(SAKUBUN_KINDS).map(([k, v]) => [k, v.label])),
  }), []);
  const [qr, setQr] = useState("");
  const [qrErr, setQrErr] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    QRCode.toDataURL([{ data: report, mode: "byte" }], { errorCorrectionLevel: "L", margin: 2, width: 400 }) // byte に そろえる（まぜると 読めない アプリが ある）
      .then(setQr).catch(() => setQrErr("データが 多くて QR に できませんでした。下の コードを コピーして ください。"));
  }, [report]);

  const copy = async (text, ok) => {
    try { await navigator.clipboard.writeText(text); setMsg(ok); } catch (e) { setMsg("コピーできなかったら、枠を長押ししてコピーしてください。"); }
  };
  const restore = () => {
    if (!importAll(code)) { setMsg("コードが正しくないようです。もう一度確かめてください。"); return; }
    setMsg("元に戻しました！ ホームに戻ると反映されます。");
  };

  return (
    <div className="k-shell">
      <div className="k-topbar">
        <button className="k-back" onClick={onBack}>← もどる</button>
        <span className="k-tag">👪 おうちの人</span>
      </div>

      <section className="k-psec">
        <h3>📊 おうちの人アプリに 送る</h3>
        <div className="k-pnote">保護者アプリの「読み込む」で、このQRを読み取ってください。直近2週間のまとめと、最近の記録だけが入ります（作文の本文などは入りません）。</div>
        {qr && <img className="k-qr" src={qr} alt="レポートのQRコード" />}
        {qrErr && <div className="k-pnote">{qrErr}</div>}
        <div className="k-pnote small">QRが読めないときは、コードをコピーして保護者アプリに貼り付けてください（{report.length}文字）。</div>
        <button className="k-btn" onClick={() => copy(report, "レポートコードをコピーしました。")}>レポートコードを コピー</button>
      </section>

      <section className="k-psec">
        <h3>それぞれの場所の設定</h3>
        <div className="k-pnote">
          ・考える森：子どものタイプ（マルチ／シングル）、答えの記録<br />
          ・図書かん：覚え方の説明、最近の記録<br />
          ・時計とう：ごほうびのルール、週末の精算<br />
          ・ゆうびんきょく：書いたもの<br />
          各場所の「おうちの人」から開けます。
        </div>
      </section>

      <section className="k-psec">
        <h3>📋 まるごとバックアップ（4つの場所すべて）</h3>
        <div className="k-pnote">機種変更やブラウザのデータ削除の前に、コードを取っておいてください。</div>
        <button className="k-btn" onClick={() => { const c = exportAll(); setCode(c); copy(c, "バックアップコードをコピーしました。どこかにメモしておいてください。"); }}>バックアップコードを出す</button>
        <textarea className="k-text" rows={3} value={code} onChange={(e) => setCode(e.target.value)} placeholder="元に戻すときは、ここにコードを貼り付け" />
        <button className="k-btn" onClick={restore}>元に戻す</button>
        {msg && <div className="k-pnote">{msg}</div>}
      </section>
    </div>
  );
}
