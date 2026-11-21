/* ひかりの みで そだつ 木（SVG で かく。ステージ 0〜6） */
export default function Tree({ stage, mi, size = 200 }) {
  const fruits = Math.min(Math.max(mi, 0), 14);
  const fruitSpots = [
    [72, 70], [128, 66], [100, 52], [86, 92], [116, 90], [58, 96], [142, 96],
    [100, 78], [78, 54], [122, 50], [64, 78], [136, 78], [94, 104], [108, 40],
  ];
  const s = stage;
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label="光の 木">
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF7B0" />
          <stop offset="60%" stopColor="#FFD84D" />
          <stop offset="100%" stopColor="#F2A93B" />
        </radialGradient>
        <radialGradient id="aura" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#FFF6C8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFF6C8" stopOpacity="0" />
        </radialGradient>
      </defs>
      {s >= 6 && <circle cx="100" cy="80" r="95" fill="url(#aura)" />}
      <ellipse cx="100" cy="182" rx="80" ry="14" fill="#8BC77A" stroke="#4F8A45" strokeWidth="3" />
      {s === 0 && (
        <g>
          <ellipse cx="100" cy="172" rx="13" ry="9" fill="#A86B3C" stroke="#5B3A1E" strokeWidth="3" />
          <path d="M96 168 q4 -6 8 0" stroke="#FFD84D" strokeWidth="2" fill="none" />
        </g>
      )}
      {s === 1 && (
        <g stroke="#2F5D3A" strokeWidth="3">
          <path d="M100 178 V150" fill="none" />
          <ellipse cx="88" cy="146" rx="13" ry="7" fill="#7FD06A" transform="rotate(-25 88 146)" />
          <ellipse cx="112" cy="146" rx="13" ry="7" fill="#7FD06A" transform="rotate(25 112 146)" />
        </g>
      )}
      {s >= 2 && (
        <g stroke="#5B3A1E" strokeWidth="4" strokeLinejoin="round">
          <path
            d={s === 2 ? "M94 180 L97 120 L103 120 L106 180 Z" : "M86 180 Q94 150 92 110 L108 110 Q106 150 114 180 Z"}
            fill="#A86B3C"
          />
          {s >= 3 && <path d="M97 132 L76 112 M103 128 L126 108" fill="none" />}
        </g>
      )}
      {s === 2 && (
        <g stroke="#2F5D3A" strokeWidth="3">
          <circle cx="100" cy="104" r="26" fill="#7FD06A" />
          <circle cx="84" cy="114" r="14" fill="#6BC25A" />
          <circle cx="117" cy="114" r="14" fill="#6BC25A" />
        </g>
      )}
      {s >= 3 && (
        <g stroke="#2F5D3A" strokeWidth="3">
          <circle cx="100" cy={s >= 4 ? 70 : 82} r={s >= 4 ? 50 : 40} fill="#6BC25A" />
          <circle cx={s >= 4 ? 60 : 70} cy="92" r={s >= 4 ? 30 : 24} fill="#7FD06A" />
          <circle cx={s >= 4 ? 140 : 130} cy="92" r={s >= 4 ? 30 : 24} fill="#7FD06A" />
          <circle cx="100" cy={s >= 4 ? 46 : 60} r={s >= 4 ? 30 : 22} fill="#8EDB78" />
        </g>
      )}
      {s >= 5 &&
        [[66, 62], [134, 60], [100, 30], [52, 104], [148, 104], [100, 96]].map(([x, y], i) => (
          <g key={"f" + i} transform={`translate(${x} ${y})`}>
            {[0, 72, 144, 216, 288].map((r) => (
              <ellipse key={r} cx="0" cy="-5" rx="3.6" ry="5" fill="#FF9EC4" stroke="#E8618C" strokeWidth="1" transform={`rotate(${r})`} />
            ))}
            <circle r="2.4" fill="#FFD84D" />
          </g>
        ))}
      {s >= 2 &&
        fruitSpots.slice(0, s === 2 ? Math.min(fruits, 3) : fruits).map(([x, y], i) => {
          const yy = s === 2 ? 100 + (i - 1) * 4 : s === 3 ? y + 12 : y;
          const xx = s === 2 ? 88 + i * 12 : s === 3 ? 100 + (x - 100) * 0.8 : x;
          return <circle key={i} className="tree-fruit" cx={xx} cy={yy} r="5.5" fill="url(#glow)" stroke="#C9821B" strokeWidth="1.5" style={{ animationDelay: `${i * 0.2}s` }} />;
        })}
    </svg>
  );
}
