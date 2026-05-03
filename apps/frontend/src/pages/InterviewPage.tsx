import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ChevronRight, UserPlus, LogIn } from "lucide-react";
import { Navbar } from "../components/Layout/Navbar";
import { Footer } from "../components/Layout/Footer";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";

interface Room { id: string; name: string; createdAt: string; }

// ── Syntax token types ─────────────────────────────────────────
type TT = "keyword" | "fn" | "plain" | "string" | "number" | "comment" | "type" | "param";
interface Tok { text: string; t: TT; }
interface Line { indent: number; tokens: Tok[]; }

const TC: Record<TT, string> = {
  keyword: "#c678dd", fn: "#61afef", plain: "#abb2bf",
  string: "#98c379", number: "#d19a66", comment: "#5c6370",
  type: "#e5c07b", param: "#d19a66",
};

const INTERVIEW_CODE: Line[] = [
  { indent: 0, tokens: [{ text: "// Two Sum — Interview Problem", t: "comment" }] },
  { indent: 0, tokens: [{ text: "function", t: "keyword" }, { text: " ", t: "plain" }, { text: "twoSum", t: "fn" }, { text: "(", t: "plain" }, { text: "nums", t: "param" }, { text: ", ", t: "plain" }, { text: "target", t: "param" }, { text: ") {", t: "plain" }] },
  { indent: 1, tokens: [{ text: "const", t: "keyword" }, { text: " map = ", t: "plain" }, { text: "new", t: "keyword" }, { text: " ", t: "plain" }, { text: "Map", t: "fn" }, { text: "();", t: "plain" }] },
  { indent: 1, tokens: [{ text: "for", t: "keyword" }, { text: " (", t: "plain" }, { text: "let", t: "keyword" }, { text: " i = ", t: "plain" }, { text: "0", t: "number" }, { text: "; i < nums.length; i++) {", t: "plain" }] },
  { indent: 2, tokens: [{ text: "const", t: "keyword" }, { text: " complement = target - nums[i];", t: "plain" }] },
  { indent: 2, tokens: [{ text: "if", t: "keyword" }, { text: " (map.", t: "plain" }, { text: "has", t: "fn" }, { text: "(complement))", t: "plain" }] },
  { indent: 3, tokens: [{ text: "return", t: "keyword" }, { text: " [map.", t: "plain" }, { text: "get", t: "fn" }, { text: "(complement), i];", t: "plain" }] },
  { indent: 2, tokens: [{ text: "map.", t: "plain" }, { text: "set", t: "fn" }, { text: "(nums[i], i);", t: "plain" }] },
  { indent: 1, tokens: [{ text: "}", t: "plain" }] },
  { indent: 0, tokens: [{ text: "}", t: "plain" }] },
  { indent: 0, tokens: [{ text: "", t: "plain" }] },
  { indent: 0, tokens: [{ text: "// Time O(n) · Space O(n)", t: "comment" }] },
];

function CodePreview({ lines, title, lang }: { lines: Line[]; title: string; lang: string }) {
  const [cursorLine, setCursorLine] = useState(3);
  const [cursorCol, setCursorCol] = useState(8);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const blinkT = setInterval(() => setBlink((v) => !v), 530);
    const moveT = setInterval(() => {
      setCursorLine((l) => {
        const next = l + 1;
        return next >= lines.length ? 1 : next;
      });
      setCursorCol(Math.floor(Math.random() * 12));
    }, 1400);
    return () => { clearInterval(blinkT); clearInterval(moveT); };
  }, [lines.length]);

  return (
    <div style={{
      background: "#1e1e1e",
      border: "1px solid #2a2a3a",
      borderRadius: "12px",
      overflow: "hidden",
      fontFamily: "'Cascadia Code','Fira Code','Consolas',monospace",
      fontSize: "12px",
      lineHeight: "20px",
      boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
    }}>
      {/* Chrome */}
      <div style={{ padding: "9px 14px", background: "#161616", borderBottom: "1px solid #2a2a2a", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ display: "flex", gap: "5px" }}>
          {["#ff5f57","#ffbd2e","#28c840"].map(c => (
            <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />
          ))}
        </div>
        <span style={{ marginLeft: "10px", fontSize: "11px", color: "#555", flex: 1 }}>{title}</span>
        <span style={{ fontSize: "10px", color: "#444", background: "#2a2a2a", padding: "1px 7px", borderRadius: "4px" }}>{lang}</span>
      </div>

      {/* Body */}
      <div style={{ display: "flex" }}>
        {/* Line numbers */}
        <div style={{ padding: "12px 0", minWidth: "36px", background: "#1e1e1e", borderRight: "1px solid #252525" }}>
          {lines.map((_, i) => (
            <div key={i} style={{ padding: "0 8px 0 0", color: "#3e3e4e", textAlign: "right", height: "20px", lineHeight: "20px", fontSize: "11px" }}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code */}
        <div style={{ flex: 1, padding: "12px 0 12px 14px", overflowX: "hidden", position: "relative" }}>
          {lines.map((line, li) => (
            <div key={li} style={{ height: "20px", lineHeight: "20px", whiteSpace: "pre", position: "relative" }}>
              {"  ".repeat(line.indent)}
              {line.tokens.map((tok, ti) => (
                <span key={ti} style={{ color: TC[tok.t] }}>{tok.text}</span>
              ))}
              {li === cursorLine && (
                <span style={{
                  position: "absolute",
                  left: `${(line.indent * 2 + cursorCol) * 7.2 + 14}px`,
                  top: 0, width: "2px", height: "20px",
                  background: blink ? "#6c63ff" : "transparent",
                  borderRadius: "1px",
                  transition: "left 0.1s ease",
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div style={{ padding: "3px 14px", background: "#007acc", display: "flex", gap: "14px", fontSize: "10px", color: "rgba(255,255,255,0.8)" }}>
        <span>{lang}</span>
        <span style={{ marginLeft: "auto" }}>Ln {cursorLine + 1}, Col {cursorCol + 1}</span>
      </div>
    </div>
  );
}

function LockedState({ type }: { type: "interview" | "session" }) {
  const navigate = useNavigate();
  const accent = type === "interview" ? "#6c63ff" : "#00d4aa";
  const accentDim = type === "interview" ? "rgba(108,99,255,0.12)" : "rgba(0,212,170,0.08)";
  const accentBorder = type === "interview" ? "rgba(108,99,255,0.25)" : "rgba(0,212,170,0.2)";

  const PERKS = type === "interview"
    ? ["Timed interview sessions", "Interviewer & candidate roles", "Built-in problem prompts", "Session replay & recording", "Live cursor tracking"]
    : ["Unlimited coding sessions", "Real-time code sync", "12 supported languages", "Persistent code across sessions", "Live chat with collaborators"];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      <div style={{
        maxWidth: "1200px", margin: "0 auto",
        padding: "100px 48px 80px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "80px",
        alignItems: "center",
        minHeight: "100vh",
      }}>

        {/* ── Left: locked content ─────────────────────────── */}
        <div>
          {/* Member badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 14px", borderRadius: "20px",
            background: accentDim, border: `1px solid ${accentBorder}`,
            marginBottom: "28px",
          }}>
            <Lock size={13} color={accent} strokeWidth={2} />
            <span style={{
              fontSize: "12px", fontWeight: 700, color: accent,
              fontFamily: "'Space Mono', monospace", letterSpacing: "0.06em",
            }}>
              MEMBERS ONLY FEATURE
            </span>
          </div>

          {/* Heading */}
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(32px, 4vw, 52px)",
            fontWeight: 800, color: "#fff",
            letterSpacing: "-0.02em", lineHeight: 1.1,
            marginBottom: "16px",
          }}>
            {type === "interview" ? "Technical\nInterviews" : "Coding\nSessions"}
          </h1>

          <p style={{ color: "var(--muted)", fontSize: "15px", lineHeight: 1.75, marginBottom: "36px", maxWidth: "420px" }}>
            {type === "interview"
              ? "Run structured technical interviews with a real-time collaborative editor, countdown timer, problem prompts, and session replay."
              : "Jump into a shared editor with friends. No pressure, no timer — just collaborative coding with full real-time sync."}
          </p>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "40px" }}>
            {PERKS.map((perk) => (
              <div key={perk} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "20px", height: "20px", borderRadius: "50%",
                  background: accentDim, border: `1px solid ${accentBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <ChevronRight size={11} color={accent} strokeWidth={2.5} />
                </div>
                <span style={{ color: "#c8c8d8", fontSize: "14px" }}>{perk}</span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/register")}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "12px 26px", borderRadius: "9px",
                background: `linear-gradient(135deg, ${accent}, ${type === "interview" ? "#5a54e8" : "#0fb89a"})`,
                border: "none", color: type === "interview" ? "#fff" : "#000",
                fontSize: "14px", fontWeight: 700,
                fontFamily: "'Syne', sans-serif", cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.transform = "translateY(-2px)";
                b.style.boxShadow = `0 8px 28px ${accent}55`;
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.transform = "translateY(0)";
                b.style.boxShadow = "none";
              }}
            >
              <UserPlus size={15} />
              Create free account
            </button>

            <button
              onClick={() => navigate("/login")}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "12px 26px", borderRadius: "9px",
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text)", fontSize: "14px", fontWeight: 600,
                fontFamily: "'Syne', sans-serif", cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.borderColor = `${accent}66`;
                b.style.color = accent;
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.borderColor = "var(--border)";
                b.style.color = "var(--text)";
              }}
            >
              <LogIn size={15} />
              Sign in
            </button>
          </div>
        </div>

        {/* ── Right: code previews ──────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative" }}>
          {/* Glow behind */}
          <div style={{
            position: "absolute", inset: "-30px",
            background: `radial-gradient(ellipse at center, ${accentDim} 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />

          {/* Primary code window — full */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <CodePreview lines={INTERVIEW_CODE} title="solution.js — CoderCollab" lang="JavaScript" />
          </div>

          {/* Secondary mini snippet */}
          <div style={{
            position: "relative", zIndex: 1,
            background: "#111118",
            border: "1px solid #1e1e2e",
            borderRadius: "10px",
            padding: "14px 16px",
            fontFamily: "'Cascadia Code','Fira Code','Consolas',monospace",
            fontSize: "12px",
            lineHeight: "20px",
          }}>
            <div style={{ color: "#5c6370", marginBottom: "6px", fontSize: "11px" }}>// Execution result</div>
            <div>
              <span style={{ color: "#c678dd" }}>console</span>
              <span style={{ color: "#abb2bf" }}>.</span>
              <span style={{ color: "#61afef" }}>log</span>
              <span style={{ color: "#abb2bf" }}>(</span>
              <span style={{ color: "#61afef" }}>twoSum</span>
              <span style={{ color: "#abb2bf" }}>([</span>
              <span style={{ color: "#d19a66" }}>2</span>
              <span style={{ color: "#abb2bf" }}>,</span>
              <span style={{ color: "#d19a66" }}>7</span>
              <span style={{ color: "#abb2bf" }}>,</span>
              <span style={{ color: "#d19a66" }}>11</span>
              <span style={{ color: "#abb2bf" }}>,</span>
              <span style={{ color: "#d19a66" }}>15</span>
              <span style={{ color: "#abb2bf" }}>], </span>
              <span style={{ color: "#d19a66" }}>9</span>
              <span style={{ color: "#abb2bf" }}>));</span>
            </div>
            <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#3e3e4e" }}>▶</span>
              <span style={{ color: "#98c379" }}>[0, 1]</span>
              <span style={{ color: "#5c6370", marginLeft: "auto", fontSize: "11px" }}>12ms</span>
            </div>
          </div>

          {/* Two-user indicator bar */}
          <div style={{
            position: "relative", zIndex: 1,
            background: "#111118",
            border: "1px solid #1e1e2e",
            borderRadius: "10px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <div style={{ display: "flex" }}>
              {[accent, "#ff6b6b"].map((c, i) => (
                <div key={i} style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: c, border: "2px solid #111118",
                  marginLeft: i > 0 ? "-8px" : "0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 700, color: "#fff",
                }}>
                  {["A","S"][i]}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#c8c8d8", fontWeight: 600 }}>
                Ahmed & Sarah are in this room
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)", fontFamily: "'Space Mono',monospace" }}>
                {type === "interview" ? "Interview in progress · 18:42 left" : "Coding session · 2 collaborators"}
              </div>
            </div>
            <div style={{
              marginLeft: "auto", width: "8px", height: "8px",
              borderRadius: "50%", background: "#00d4aa",
              boxShadow: "0 0 8px #00d4aa",
            }} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function InterviewPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api.get("/rooms?type=interview")
      .then((r) => setRooms(r.data))
      .finally(() => setLoading(false));
  }, [user]);

  const createRoom = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post("/rooms", { name: newName.trim(), type: "interview" });
      setRooms((prev) => [data, ...prev]);
      setNewName("");
    } finally {
      setCreating(false);
    }
  };

  if (!user) return <LockedState type="interview" />;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 32px 80px" }}>

        <div style={{ marginBottom: "48px" }}>
          <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "12px" }}>
            Interview mode
          </p>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "42px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: "12px" }}>
            Technical Interviews
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "16px", lineHeight: 1.7 }}>
            Create a room, share the link, and join as interviewer or candidate.
          </p>
        </div>

        {/* Create room */}
        <div style={{ padding: "28px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", marginBottom: "32px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff", marginBottom: "14px", fontFamily: "'Syne',sans-serif" }}>
            Create a new room
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createRoom()}
              placeholder="e.g. Frontend Engineer Round 1"
              style={{ flex: 1, background: "#0a0a0f", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", padding: "10px 14px", outline: "none", fontFamily: "'Syne',sans-serif", transition: "border-color 0.2s", boxSizing: "border-box" as const }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(108,99,255,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
            <button
              onClick={createRoom}
              disabled={creating || !newName.trim()}
              style={{ padding: "10px 24px", borderRadius: "8px", background: creating || !newName.trim() ? "rgba(108,99,255,0.3)" : "linear-gradient(135deg,#6c63ff,#5a54e8)", border: "none", color: "#fff", fontSize: "14px", fontWeight: 700, fontFamily: "'Syne',sans-serif", cursor: creating || !newName.trim() ? "default" : "pointer", whiteSpace: "nowrap" as const }}
            >
              {creating ? "Creating..." : "Create room"}
            </button>
          </div>
        </div>

        {/* Rooms */}
        <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px", fontFamily: "'Space Mono',monospace" }}>
          {loading ? "Loading..." : `${rooms.length} room${rooms.length !== 1 ? "s" : ""} available`}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {rooms.map((room) => (
            <div key={room.id} style={{ padding: "20px 24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "border-color 0.2s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(108,99,255,0.3)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)")}
            >
              <div>
                <p style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: 600, color: "#fff", marginBottom: "4px" }}>{room.name}</p>
                <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "11px", color: "var(--muted)" }}>
                  {new Date(room.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => navigate(`/room/${room.id}?role=candidate`)}
                  style={{ padding: "8px 18px", borderRadius: "7px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text)", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'Syne',sans-serif", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "rgba(0,212,170,0.4)"; b.style.color = "#00d4aa"; }}
                  onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = "var(--border)"; b.style.color = "var(--text)"; }}
                >
                  Candidate
                </button>
                <button onClick={() => navigate(`/room/${room.id}?role=interviewer`)}
                  style={{ padding: "8px 18px", borderRadius: "7px", background: "linear-gradient(135deg,#6c63ff,#5a54e8)", border: "none", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}
                >
                  Interviewer
                </button>
              </div>
            </div>
          ))}
          {!loading && rooms.length === 0 && (
            <div style={{ padding: "48px", textAlign: "center", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "12px", color: "var(--muted)", fontSize: "14px" }}>
              No rooms yet. Create one above to get started.
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}