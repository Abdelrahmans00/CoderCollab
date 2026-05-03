import { useState } from "react";
import { useRoomStore } from "../../store/roomStore";

interface Props {
  onStartTimer: (duration: number) => void;
  onStopTimer: () => void;
  onSetRole: (userId: string, role: "interviewer" | "candidate") => void;
}

const PRESETS_MIN = [15, 20, 30, 45, 60];

export const InterviewControls = ({
  onStartTimer,
  onStopTimer,
  onSetRole,
}: Props) => {
  const { isInterviewer, timerActive, users } = useRoomStore();
  const [customMin, setCustomMin] = useState(30);

  if (!isInterviewer) return null;

  return (
    <div
      style={{
        padding: "14px",
        borderBottom: "1px solid #333",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {/* Timer section */}
      <div>
        <p
          style={{
            margin: "0 0 8px",
            color: "#888",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Timer
        </p>

        {/* Preset buttons */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
          {PRESETS_MIN.map((m) => (
            <button
              key={m}
              onClick={() => onStartTimer(m * 60)}
              disabled={timerActive}
              style={{
                background: timerActive ? "#1a1a1a" : "#2d2d2d",
                border: "1px solid #444",
                borderRadius: "6px",
                color: timerActive ? "#555" : "#ccc",
                padding: "4px 10px",
                fontSize: "12px",
                cursor: timerActive ? "default" : "pointer",
              }}
            >
              {m}m
            </button>
          ))}
        </div>

        {/* Custom duration */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <input
            type="number"
            min={1}
            max={180}
            value={customMin}
            onChange={(e) => setCustomMin(Number(e.target.value))}
            style={{
              width: "56px",
              background: "#2d2d2d",
              border: "1px solid #444",
              borderRadius: "6px",
              color: "#ccc",
              padding: "4px 8px",
              fontSize: "12px",
              outline: "none",
            }}
          />
          <span style={{ color: "#666", fontSize: "12px" }}>min</span>
          <button
            onClick={() => onStartTimer(customMin * 60)}
            disabled={timerActive}
            style={{
              background: timerActive ? "#1a1a1a" : "#1d4ed8",
              border: "none",
              borderRadius: "6px",
              color: timerActive ? "#555" : "#fff",
              padding: "4px 12px",
              fontSize: "12px",
              cursor: timerActive ? "default" : "pointer",
            }}
          >
            Start
          </button>
          {timerActive && (
            <button
              onClick={onStopTimer}
              style={{
                background: "#7f1d1d",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                padding: "4px 12px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Role assignment section */}
      {users.length > 1 && (
        <div>
          <p
            style={{
              margin: "0 0 8px",
              color: "#888",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Roles
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {users.map((u) => (
              <div
                key={u.userId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: u.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: "#ccc", fontSize: "12px" }}>
                    {u.userName}
                  </span>
                </div>
                <select
                  value={u.role ?? "candidate"}
                  onChange={(e) =>
                    onSetRole(u.userId, e.target.value as "interviewer" | "candidate")
                  }
                  style={{
                    background: "#2d2d2d",
                    border: "1px solid #444",
                    borderRadius: "4px",
                    color: "#ccc",
                    fontSize: "11px",
                    padding: "2px 6px",
                    cursor: "pointer",
                  }}
                >
                  <option value="candidate">Candidate</option>
                  <option value="interviewer">Interviewer</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};