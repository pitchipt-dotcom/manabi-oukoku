/* ゆび・ペンで かく マス（田の字の ガイドつき）
   guide に かんじを わたすと、うすく お手本を 下に しく（「3かい かく」用） */
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const WritePad = forwardRef(function WritePad({ size = 260, guide = null, onStroke }, ref) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const count = useRef(0);

  const ctx = () => canvasRef.current && canvasRef.current.getContext("2d");
  const clear = () => {
    const c = canvasRef.current; if (!c) return;
    ctx().clearRect(0, 0, c.width, c.height);
    count.current = 0;
  };
  useImperativeHandle(ref, () => ({ clear, strokes: () => count.current }));

  useEffect(() => {
    const c = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    c.width = size * dpr; c.height = size * dpr;
    const g = ctx(); g.scale(dpr, dpr);
    g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = "#26324A"; g.lineWidth = size / 22;
  }, [size]);

  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return [(e.clientX - r.left) * (size / r.width), (e.clientY - r.top) * (size / r.height)];
  };
  const down = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture && canvasRef.current.setPointerCapture(e.pointerId);
    drawing.current = true; last.current = pos(e);
    const g = ctx(); const [x, y] = last.current;
    g.beginPath(); g.arc(x, y, g.lineWidth / 2, 0, Math.PI * 2); g.fillStyle = "#26324A"; g.fill();
  };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const p = pos(e); const g = ctx();
    g.beginPath(); g.moveTo(...last.current); g.lineTo(...p); g.stroke();
    last.current = p;
  };
  const up = () => {
    if (drawing.current) { count.current += 1; onStroke && onStroke(count.current); }
    drawing.current = false;
  };

  return (
    <div className="pad" style={{ width: size, height: size }}>
      <svg className="pad-grid" viewBox="0 0 100 100" width={size} height={size}>
        <line x1="50" y1="0" x2="50" y2="100" />
        <line x1="0" y1="50" x2="100" y2="50" />
      </svg>
      {guide && <div className="pad-guide" style={{ fontSize: size * 0.78 }}>{guide}</div>}
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
      />
    </div>
  );
});

export default WritePad;
