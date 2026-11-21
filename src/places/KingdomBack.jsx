/* 王国に もどる ボタン（統合アプリの 中で だけ 出る） */
import { createContext, useContext } from "react";

export const KingdomCtx = createContext({ onExit: null });

export default function KingdomBack() {
  const { onExit } = useContext(KingdomCtx);
  if (!onExit) return null;
  return <button className="kingdom-back" onClick={onExit}>🏰 王国に もどる</button>;
}
