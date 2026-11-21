/* げんこう用紙（たて書き・1行 20マス）。だん落の はじめは 1マス あける */
const ROWS = 20;

export function layout(title, body) {
  const cols = [];
  const push = (line) => {
    const chars = [...line];
    if (chars.length === 0) { cols.push([]); return; }
    for (let i = 0; i < chars.length; i += ROWS) cols.push(chars.slice(i, i + ROWS));
  };
  if (title) push("　　" + title.replace(/[ 　]/g, ""));
  body.replace(/\r/g, "").split("\n").forEach((p) => {
    const t = p.replace(/[ 　]/g, "");
    if (!t) return;
    push("　" + t);
  });
  return cols;
}

export const countChars = (body) => [...body.replace(/\s/g, "")].length;

export default function Genko({ title, body, minCols = 10 }) {
  const cols = layout(title, body);
  while (cols.length < minCols) cols.push([]);
  return (
    <div className="genko-wrap">
      <div className="genko">
        {cols.map((col, ci) => (
          <div key={ci} className="genko-col">
            {Array.from({ length: ROWS }).map((_, ri) => (
              <span key={ri} className="genko-cell">{col[ri] || ""}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
