import { useEffect, useState } from "react";
import { useRoomStore } from "../../store/roomStore";

interface Props {
  onStop?: () => void;
}

export const Timer = ({ onStop }: Props) => {
  const { timerActive, timerEndsAt, isInterviewer } = useRoomStore();
  const [remaining, setRemaining] = useState<number>(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!timerActive || !timerEndsAt) {
      setExpired(false);
      return;
    }

    const tick = () => {
      const diff = Math.max(0, Math.floor((timerEndsAt - Date.now()) / 1000));
      setRemaining(diff);
      if (diff === 0) setExpired(true);
    };

    tick(); // run immediately
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [timerActive, timerEndsAt]);

  if (!timerActive) return null;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const color =
    expired || remaining <= 30
      ? "#ef4444"
      : remaining <= 120
      ? "#f59e0b"
      : "#22c55e";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      {/* Clock icon (SVG) */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        style={{ flexShrink: 0 }}
      >
        <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5" />
        <path
          d="M8 4.5V8L10.5 10"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Time display */}
      <span
        style={{
          fontFamily: "monospace",
          fontSize: "18px",
          fontWeight: 600,
          color,
          letterSpacing: "0.05em",
          animation: expired ? "pulse 1s ease-in-out infinite" : undefined,
        }}
      >
        {expired ? "Time's up" : formatted}
      </span>

      {/* Stop button — interviewer only */}
      {isInterviewer && onStop && (
        <button
          onClick={onStop}
          style={{
            background: "transparent",
            border: `1px solid #555`,
            color: "#aaa",
            borderRadius: "4px",
            padding: "2px 8px",
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          Stop
        </button>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};