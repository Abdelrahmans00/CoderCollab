import { useState, useRef, useEffect } from "react";
import { useRoomStore } from "../../store/roomStore";
import { useAuthStore } from "../../store/authStore";

interface Props {
  onSend: (message: string) => void;
}

export const ChatBox = ({ onSend }: Props) => {
  const { messages } = useRoomStore();
  const { user } = useAuthStore();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#1e1e1e",
        borderLeft: "1px solid #333",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid #333",
          color: "#999",
          fontSize: "12px",
          fontWeight: 500,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        Chat
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {messages.length === 0 && (
          <p
            style={{
              color: "#555",
              fontSize: "12px",
              textAlign: "center",
              marginTop: "20px",
            }}
          >
            No messages yet
          </p>
        )}
        {messages.map((msg) => {
          // ── System message ─────────────────────────────────
          if (msg.isSystem) {
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "2px 0",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: "rgba(255,255,255,0.06)",
                  }}
                />
                <span
                  style={{
                    color: "#555",
                    fontSize: "11px",
                    fontFamily: "'Space Mono', monospace",
                    whiteSpace: "nowrap",
                    fontStyle: "italic",
                  }}
                >
                  {msg.message}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: "rgba(255,255,255,0.06)",
                  }}
                />
              </div>
            );
          }

          // ── Regular message ────────────────────────────────
          const isMe = msg.userId === user?.id;
          return (
            <div
              key={msg.id}
              style={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              <div
                style={{ display: "flex", alignItems: "baseline", gap: "6px" }}
              >
                <span
                  style={{
                    color: isMe ? "#60a5fa" : "#a78bfa",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  {isMe ? "You" : msg.userName}
                </span>
                <span style={{ color: "#555", fontSize: "10px" }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p
                style={{
                  color: "#d4d4d4",
                  fontSize: "13px",
                  margin: 0,
                  lineHeight: 1.5,
                  wordBreak: "break-word",
                }}
              >
                {msg.message}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "10px 12px",
          borderTop: "1px solid #333",
          display: "flex",
          gap: "8px",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Message..."
          style={{
            flex: 1,
            background: "#2d2d2d",
            border: "1px solid #444",
            borderRadius: "6px",
            color: "#fff",
            fontSize: "13px",
            padding: "6px 10px",
            outline: "none",
          }}
        />
        <button
          onClick={handleSend}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "6px 12px",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};
