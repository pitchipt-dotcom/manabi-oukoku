/* こえ：よみあげ（speechSynthesis）と こえで こたえる（SpeechRecognition）
   つかえない たんまつでも あそびを とめない */
import { useEffect, useRef, useState } from "react";

export function speak(text) {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\s+/g, ""));
    u.lang = "ja-JP";
    u.rate = 0.95;
    u.pitch = 1.15;
    window.speechSynthesis.speak(u);
  } catch (e) { /* よみあげ できなくても だいじょうぶ */ }
}

const Rec = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
export const canListen = !!Rec;

export function useListen(onText) {
  const [listening, setListening] = useState(false);
  const [failed, setFailed] = useState(false);
  const recRef = useRef(null);
  const cbRef = useRef(onText);
  cbRef.current = onText;

  useEffect(() => () => { try { recRef.current && recRef.current.abort(); } catch (e) {} }, []);

  const start = () => {
    if (!Rec) { setFailed(true); return; }
    try {
      const r = new Rec();
      r.lang = "ja-JP";
      r.interimResults = true;
      r.continuous = false;
      r.onresult = (ev) => {
        let t = "";
        for (let i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript;
        cbRef.current(t);
      };
      r.onerror = () => { setFailed(true); setListening(false); };
      r.onend = () => setListening(false);
      recRef.current = r;
      setFailed(false);
      setListening(true);
      r.start();
    } catch (e) { setFailed(true); setListening(false); }
  };
  const stop = () => { try { recRef.current && recRef.current.stop(); } catch (e) {} setListening(false); };
  return { listening, failed, start, stop };
}
