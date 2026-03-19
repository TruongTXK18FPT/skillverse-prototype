import { useState, useEffect } from "react";
import { Brain, ChevronDown } from "lucide-react";
import "../../styles/MessageRenderer.css";

const PHRASES = [
  "\u0110ang ph\u00e2n t\u00edch ng\u1eef c\u1ea3nh v\u00e0 \u00fd \u0111\u1ecbnh c\u1ee7a b\u1ea1n...",
  "\u0110ang truy xu\u1ea5t d\u1eef li\u1ec7u th\u1ecb tr\u01b0\u1eddng lao \u0111\u1ed9ng v\u00e0 xu h\u01b0\u1edbng 2026...",
  "\u0110ang k\u00edch ho\u1ea1t m\u1ea1ng n\u01a1-ron chuy\u00ean gia...",
  "\u0110ang tra c\u1ee9u y\u00eau c\u1ea7u k\u1ef9 n\u0103ng v\u00e0 l\u1ed9 tr\u00ecnh th\u0103ng ti\u1ebfn...",
  "\u0110ang so s\u00e1nh m\u1ee9c l\u01b0\u01a1ng v\u00e0 c\u01a1 h\u1ed9i vi\u1ec7c l\u00e0m th\u1ef1c t\u1ebf...",
  "\u0110ang t\u1ed5ng h\u1ee3p c\u00e1c t\u00e0i nguy\u00ean h\u1ecdc t\u1eadp uy t\u00edn nh\u1ea5t...",
  "\u0110ang x\u00e2y d\u1ef1ng chi\u1ebfn l\u01b0\u1ee3c ph\u00e1t tri\u1ec3n c\u00e1 nh\u00e2n h\u00f3a...",
  "\u0110ang ki\u1ec3m ch\u1ee9ng th\u00f4ng tin v\u00e0 \u0111\u00e1nh gi\u00e1 r\u1ee7i ro...",
  "\u0110ang so\u1ea1n th\u1ea3o c\u00e2u tr\u1ea3 l\u1eddi chi ti\u1ebft...",
];

export const ThinkingIndicator = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="msg-thinking-block" style={{ margin: 0, width: "100%", maxWidth: "100%" }}>
      <div className="msg-thinking-header">
        <Brain size={16} className="thinking-icon" />
        <span>Thinking Process</span>
        <ChevronDown size={16} />
      </div>
      <div className="msg-thinking-content">
        <p style={{ display: "flex", alignItems: "center" }}>
          {PHRASES[phraseIndex]}
          <span className="thinking-cursor">...</span>
        </p>
      </div>
    </div>
  );
};
