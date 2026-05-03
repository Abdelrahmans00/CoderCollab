import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Users, Code2, ChevronRight, UserPlus, LogIn } from "lucide-react";
import { Navbar } from "../components/Layout/Navbar";
import { Footer } from "../components/Layout/Footer";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";

interface Room { id: string; name: string; createdAt: string; }

type TT = "keyword" | "fn" | "plain" | "string" | "number" | "comment" | "type" | "param";
interface Tok { text: string; t: TT; }
interface Line { indent: number; tokens: Tok[]; }

const TC: Record<TT, string> = {
  keyword: "#c678dd", fn: "#61afef", plain: "#abb2bf",
  string: "#98c379", number: "#d19a66", comment: "#5c6370",
  type: "#e5c07b", param: "#d19a66",
};

const SESSION_CODE: Line[] = [
  { indent: 0, tokens: [{ text: "// Collaborative session — LRU Cache", t: "comment" }] },
  { indent: 0, tokens: [{ text: "class", t: "keyword" }, { text: " ", t: "plain" }, { text: "LRUCache", t: "type" }, { text: " {", t: "plain" }] },
  { indent: 1, tokens: [{ text: "constructor", t: "fn" }, { text: "(", t: "plain" }, { text: "capacity", t: "param" }, { text: ") {", t: "plain" }] },
  { indent: 2, tokens: [{ text: "this", t: "keyword" }, { text: ".cap = capacity;", t: "plain" }] },
  { indent: 2, tokens: [{ text: "this", t: "keyword" }, { text: ".cache = ", t: "plain" }, { text: "new", t: "keyword" }, { text: " ", t: "plain" }, { text: "Map", t: "fn" }, { text: "();", t: "plain" }] },
  { indent: 1, tokens: [{ text: "}", t: "plain" }] },
  { indent: 1, tokens: [{ text: "get", t: "fn" }, { text: "(", t: "plain" }, { text: "key", t: "param" }, { text: ") {", t: "plain" }] },
  { indent: 2, tokens: [{ text: "if", t: "keyword" }, { text: " (!", t: "plain" }, { text: "this", t: "keyword" }, { text: ".cache.", t: "plain" }, { text: "has", t: "fn" }, { text: "(key)) ", t: "plain" }, { text: "return", t: "keyword" }, { text: " -", t: "plain" }, { text: "1", t: "number" }, { text: ";", t: "plain" }] },
  { indent: 2, tokens: [{ text: "const", t: "keyword" }, { text: " val = ", t: "plain" }, { text: "this", t: "keyword" }, { text: ".cache.", t: "plain" }, { text: "get", t: "fn" }, { text: "(key);", t: "plain" }] },
  { indent: 2, tokens: [{ text: "this", t: "keyword" }, { text: ".cache.", t: "plain" }, { text: "delete", t: "fn" }, { text: "(key);", t: "plain" }] },
  { indent: 2, tokens: [{ text: "this", t: "keyword" }, { text: ".cache.", t: "plain" }, { text: "set", t: "fn" }, { text: "(key, val);", t: "plain" }] },
  { indent: 2, tokens: [{ text: "return", t: "keyword" }, { text: " val;", t: "plain" }] },
  { indent: 1, tokens: [{ text: "}", t: "plain" }] },
  { indent: 0, tokens: [{ text: "}", t: "plain" }] },
];

const SESSION_CODE_2: Line[] = [
  { indent: 0, tokens: [{ text: "# Python — BFS Traversal", t: "comment" }] },
  { indent: 0, tokens: [{ text: "from", t: "keyword" }, { text: " collections ", t: "plain" }, { text: "import", t: "keyword" }, { text: " ", t: "plain" }, { text: "deque", t: "fn" }] },
  { indent: 0, tokens: [{ text: "", t: "plain" }] },
  { indent: 0, tokens: [{ text: "def", t: "keyword" }, { text: " ", t: "plain" }, { text: "bfs", t: "fn" }, { text: "(", t: "plain" }, { text: "graph", t: "param" }, { text: ", ", t: "plain" }, { text: "start", t: "param" }, { text: "):", t: "plain" }] },
  { indent: 1, tokens: [{ text: "visited", t: "plain" }, { text: " = ", t: "plain" }, { text: "set", t: "fn" }, { text: "([start])", t: "plain" }] },
  { indent: 1, tokens: [{ text: "queue", t: "plain" }, { text: " = ", t: "plain" }, { text: "deque", t: "fn" }, { text: "([start])", t: "plain" }] },
  { indent: 1, tokens: [{ text: "while", t: "keyword" }, { text: " queue:", t: "plain" }] },
  { indent: 2, tokens: [{ text: "node = queue.", t: "plain" }, { text: "popleft", t: "fn" }, { text: "()", t: "plain" }] },
  { indent: 2, tokens: [{ text: "for", t: "keyword" }, { text: " neighbor ", t: "plain" }, { text: "in", t: "keyword" }, { text: " graph[node]:", t: "plain" }] },
  { indent: 3, tokens: [{ text: "if", t: "keyword" }, { text: " neighbor ", t: "plain" }, { text: "not in", t: "keyword" }, { text: " visited:", t: "plain" }] },
  { indent: 4, tokens: [{ text: "visited.", t: "plain" }, { text: "add", t: "fn" }, { text: "(neighbor)", t: "plain" }] },
  { indent: 4, tokens: [{ text: "queue.", t: "plain" }, { text: "append", t: "fn" }, { text: "(neighbor)", t: "plain" }] },
];

function MiniCodeCard({ lines, title, lang, accentColor }: { lines: Line[]; title: string; lang: string; accentColor: string }) {
  const [cursorLine, setCursorLine] = useState(4);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const b = setInterval(() => setBlink((v) => !v), 530);
    const m = setInterval(() => setCursorLine((l) => (l + 1) % lines.length), 1800);
    return () => { clearInterval(b); clearInterval(m); };
  }, [lines.length]);

  return (
    <div style={{
      background: "#1a1a24",
      border: `1px solid ${accentColor}22`,
      borderRadius: "10px",
      overflow: "hidden",
      fontFamily: "'Cascadia Code','Fira Code','Consolas',monospace",
      fontSize: "11.5px",
      lineHeight: "19px",
      boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
    }}>
      <div style={{ padding: "8px 12px", background: "#111118", borderBottom: `1px solid ${accentColor}18`, display: "flex", alignItems: "center", gap: "8px" }}>
        <Code2 size={12} color={accentColor} />
        <span style={{ fontSize: "11px", color: "#555", flex: 1 }}>{title}</span>
        <span style={{ fontSize: "10px", color: accentColor, background: `${accentColor}18`, padding: "1px 6px", borderRadius: "4px" }}>{lang}</span>
      </div>
      <div style={{ display: "flex" }}>
        <div style={{ padding: "10px 0", minWidth: "30px", borderRight: "1px solid #1e1e2e" }}>
          {lines.map((_, i) => (
            <div key={i} style={{ padding: "0 6px 0 0", color: "#3e3e4e", textAlign: "right", height: "19px", lineHeight: "19px", fontSize: "10px" }}>{i + 1}</div>
          ))}
        </div>
        <div style={{ flex: 1, padding: "10px 0 10px 12px", overflowX: "hidden", position: "relative" }}>
          {lines.map((line, li) => (
            <div key={li} style={{ height: "19px", lineHeight: "19px", whiteSpace: "pre", position: "relative" }}>
              {"  ".repeat(line.indent)}
              {line.tokens.map((tok, ti) => (
                <span key={ti} style={{ color: TC[tok.t] }}>{tok.text}</span>
              ))}
              {li === cursorLine && blink && (
                <span style={{
                  position: "absolute",
                  left: `${(line.indent * 2 + 6) * 7}px`,
                  top: 0, width: "2px", height: "19px",
                  background: accentColor, borderRadius: "1px",
                }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LockedState() {
  const navigate = useNavigate();
  const accent = "#00d4aa";

  const PERKS = [
    "Unlimited collaborative sessions",
    "Real-time code sync across users",
    "12 supported languages",
    "Code persists between sessions",
    "Live cursors & built-in chat",
  ];

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

        {/* ── Left ─────────────────────────────────────────── */}
        <div>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 14px", borderRadius: "20px",
            background: "rgba(0,212,170,0.08)",
            border: "1px solid rgba(0,212,170,0.2)",
            marginBottom: "28px",
          }}>
            <Lock size={13} color={accent} strokeWidth={2} />
            <span style={{
              fontSize: "12px", fontWeight: 700, color: accent,
              fontFamily: "'Space Mono',monospace", letterSpacing: "0.06em",
            }}>
              MEMBERS ONLY FEATURE
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: "clamp(32px, 4vw, 52px)",
            fontWeight: 800, color: "#fff",
            letterSpacing: "-0.02em", lineHeight: 1.1,
            marginBottom: "16px",
          }}>
            Coding
            <br />
            <span style={{
              background: "linear-gradient(135deg, #00d4aa, #0fb89a)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Sessions
            </span>
          </h1>

          <p style={{ color: "var(--muted)", fontSize: "15px", lineHeight: 1.75, marginBottom: "36px", maxWidth: "420px" }}>
            Jump into a shared editor with friends. No pressure, no timer — just
            collaborative coding with full real-time sync and code persistence.
          </p>

          {/* Perks */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "40px" }}>
            {PERKS.map((perk) => (
              <div key={perk} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "20px", height: "20px", borderRadius: "50%",
                  background: "rgba(0,212,170,0.1)",
                  border: "1px solid rgba(0,212,170,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <ChevronRight size={11} color={accent} strokeWidth={2.5} />
                </div>
                <span style={{ color: "#c8c8d8", fontSize: "14px" }}>{perk}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/register")}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "12px 26px", borderRadius: "9px",
                background: "linear-gradient(135deg, #00d4aa, #0fb89a)",
                border: "none", color: "#000",
                fontSize: "14px", fontWeight: 700,
                fontFamily: "'Syne',sans-serif", cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.transform = "translateY(-2px)";
                b.style.boxShadow = "0 8px 28px rgba(0,212,170,0.4)";
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
                fontFamily: "'Syne',sans-serif", cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.borderColor = "rgba(0,212,170,0.5)";
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

        {/* ── Right: two code windows ───────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", position: "relative" }}>
          {/* Glow */}
          <div style={{
            position: "absolute", inset: "-30px",
            background: "radial-gradient(ellipse at center, rgba(0,212,170,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <MiniCodeCard lines={SESSION_CODE} title="lru-cache.js" lang="JavaScript" accentColor="#00d4aa" />
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <MiniCodeCard lines={SESSION_CODE_2} title="bfs.py" lang="Python" accentColor="#6c63ff" />
          </div>

          {/* Live session bar */}
          <div style={{
            position: "relative", zIndex: 1,
            background: "#111118",
            border: "1px solid rgba(0,212,170,0.15)",
            borderRadius: "10px",
            padding: "12px 16px",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <div style={{ display: "flex" }}>
              {["#00d4aa", "#6c63ff", "#f59e0b"].map((c, i) => (
                <div key={i} style={{
                  width: "26px", height: "26px", borderRadius: "50%",
                  background: c, border: "2px solid #111118",
                  marginLeft: i > 0 ? "-8px" : "0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "10px", fontWeight: 700, color: i === 0 ? "#000" : "#fff",
                }}>
                  {["A","M","K"][i]}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#c8c8d8", fontWeight: 600 }}>
                3 devs coding right now
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)", fontFamily: "'Space Mono',monospace" }}>
                friday-hacknight · 2 files open
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#00d4aa", boxShadow: "0 0 7px #00d4aa" }} />
              <span style={{ fontSize: "11px", color: "#00d4aa", fontFamily: "'Space Mono',monospace" }}>live</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function SessionPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get("/rooms?type=session").then((r) => setRooms(r.data));
  }, [user]);

  const createRoom = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post("/rooms", { name: newName.trim(), type: "session" });
      setRooms((prev) => [data, ...prev]);
      setNewName("");
    } finally {
      setCreating(false);
    }
  };

  if (!user) return <LockedState />;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 32px 80px" }}>

        <div style={{ marginBottom: "48px" }}>
          <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#00d4aa", marginBottom: "12px" }}>
            Chill mode
          </p>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "42px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: "12px" }}>
            Coding Sessions
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "16px", lineHeight: 1.7 }}>
            No timer, no pressure. Jump in a shared editor with friends and build something together.
          </p>
        </div>

        {/* Create */}
        <div style={{ padding: "28px", background: "var(--surface)", border: "1px solid rgba(0,212,170,0.15)", borderRadius: "16px", marginBottom: "32px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff", marginBottom: "14px", fontFamily: "'Syne',sans-serif" }}>
            Start a new session
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createRoom()}
              placeholder="e.g. Friday hacknight"
              style={{ flex: 1, background: "#0a0a0f", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", padding: "10px 14px", outline: "none", fontFamily: "'Syne',sans-serif", transition: "border-color 0.2s", boxSizing: "border-box" as const }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,212,170,0.4)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
            <button
              onClick={createRoom}
              disabled={creating || !newName.trim()}
              style={{ padding: "10px 24px", borderRadius: "8px", background: creating || !newName.trim() ? "rgba(0,212,170,0.2)" : "linear-gradient(135deg,#00d4aa,#0fb89a)", border: "none", color: creating || !newName.trim() ? "#00d4aa" : "#000", fontSize: "14px", fontWeight: 700, fontFamily: "'Syne',sans-serif", cursor: creating || !newName.trim() ? "default" : "pointer", whiteSpace: "nowrap" as const }}
            >
              {creating ? "Creating..." : "Create session"}
            </button>
          </div>
        </div>

        {/* Rooms */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {rooms.map((room) => (
            <div key={room.id}
              style={{ padding: "20px 24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "border-color 0.2s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,212,170,0.25)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)")}
            >
              <div>
                <p style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: 600, color: "#fff", marginBottom: "4px" }}>{room.name}</p>
                <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "11px", color: "var(--muted)" }}>{new Date(room.createdAt).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => navigate(`/room/${room.id}?role=candidate`)}
                style={{ padding: "9px 22px", borderRadius: "8px", background: "linear-gradient(135deg,#00d4aa,#0fb89a)", border: "none", color: "#000", fontSize: "13px", fontWeight: 700, fontFamily: "'Syne',sans-serif", cursor: "pointer" }}
              >
                Join session
              </button>
            </div>
          ))}
          {rooms.length === 0 && (
            <div style={{ padding: "48px", textAlign: "center", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "12px", color: "var(--muted)", fontSize: "14px" }}>
              No sessions yet. Create one to start coding with friends.
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}