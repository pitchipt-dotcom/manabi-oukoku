// 4つの 場所の CSS を、それぞれ .pl-<場所> の 中だけに きくように する（クラス名の ぶつかりを ふせぐ）
import fs from "node:fs";
import postcss from "postcss";
import prefixer from "postcss-prefix-selector";

const PLACES = ["naze", "kanji", "techou", "sakubun"];
for (const p of PLACES) {
  const src = `src/places/${p}/app.css`;
  const css = fs.readFileSync(src, "utf8");
  const out = postcss([
    prefixer({
      prefix: `.pl-${p}`,
      transform(prefix, selector, prefixed) {
        // ページ全体の きほんは 王国の CSS に まかせる
        if (/^(html|body|#root|\*)\b/.test(selector) || selector.startsWith("html,")) return `${prefix} .__none`;
        return prefixed;
      },
    }),
  ]).process(css, { from: src }).css;
  fs.writeFileSync(`src/places/${p}/app.scoped.css`, out);
}
console.log("scoped:", PLACES.join(", "));
