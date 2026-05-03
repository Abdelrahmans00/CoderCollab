import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  Target,
  PlayCircle,
  MessageSquare,
  Globe,
  Lock,
  Users,
  ArrowRight,
  Circle,
} from "lucide-react";
import { Navbar } from "../components/Layout/Navbar";
import { Footer } from "../components/Layout/Footer";
import { useAuthStore } from "../store/authStore";

// ── Install lucide-react if not already: npm install lucide-react ──

const FEATURES = [
  {
    icon: Zap,
    title: "Sub-100ms sync",
    desc: "Socket.IO real-time engine keeps every keystroke in sync across all participants instantly.",
  },
  {
    icon: Target,
    title: "Interview mode",
    desc: "Timed sessions, interviewer controls, built-in problem prompts, and role-based permissions.",
  },
  {
    icon: PlayCircle,
    title: "Session replay",
    desc: "Every coding session is recorded and replayable — scrub through the timeline like a video.",
  },
  {
    icon: MessageSquare,
    title: "Live cursors + chat",
    desc: "See collaborators' cursors in real time, named and color-coded. Built-in chat sidebar.",
  },
  {
    icon: Globe,
    title: "12 languages",
    desc: "Monaco Editor (VS Code's engine) with full syntax highlighting, autocomplete, and linting.",
  },
  {
    icon: Lock,
    title: "Secure rooms",
    desc: "JWT-authenticated rooms, role-gated controls, and isolated session state per room.",
  },
];

// ── Syntax-highlighted token types ────────────────────────────
type TokenType = "keyword" | "fn" | "var" | "string" | "number" | "comment" | "plain" | "type" | "param";

interface Token { text: string; type: TokenType; }
interface CodeLine { tokens: Token[]; indent: number; }

const TOKEN_COLORS: Record<TokenType, string> = {
  keyword: "#c678dd",
  fn:      "#61afef",
  var:     "#e06c75",
  string:  "#98c379",
  number:  "#d19a66",
  comment: "#5c6370",
  plain:   "#abb2bf",
  type:    "#e5c07b",
  param:   "#d19a66",
};

const CODE_LINES: CodeLine[] = [
  { indent: 0, tokens: [{ text: "function", type: "keyword" }, { text: " ", type: "plain" }, { text: "twoSum", type: "fn" }, { text: "(", type: "plain" }, { text: "nums", type: "param" }, { text: ", ", type: "plain" }, { text: "target", type: "param" }, { text: ") {", type: "plain" }] },
  { indent: 1, tokens: [{ text: "const", type: "keyword" }, { text: " map = ", type: "plain" }, { text: "new", type: "keyword" }, { text: " ", type: "plain" }, { text: "Map", type: "fn" }, { text: "();", type: "plain" }] },
  { indent: 1, tokens: [{ text: "for", type: "keyword" }, { text: " (", type: "plain" }, { text: "let", type: "keyword" }, { text: " i = ", type: "plain" }, { text: "0", type: "number" }, { text: "; i < nums.length; i++) {", type: "plain" }] },
  { indent: 2, tokens: [{ text: "const", type: "keyword" }, { text: " comp = target - nums[i];", type: "plain" }] },
  { indent: 2, tokens: [{ text: "if", type: "keyword" }, { text: " (map.", type: "plain" }, { text: "has", type: "fn" }, { text: "(comp)) {", type: "plain" }] },
  { indent: 3, tokens: [{ text: "return", type: "keyword" }, { text: " [map.", type: "plain" }, { text: "get", type: "fn" }, { text: "(comp), i];", type: "plain" }] },
  { indent: 2, tokens: [{ text: "}", type: "plain" }] },
  { indent: 2, tokens: [{ text: "map.", type: "plain" }, { text: "set", type: "fn" }, { text: "(nums[i], i);", type: "plain" }] },
  { indent: 1, tokens: [{ text: "}", type: "plain" }] },
  { indent: 0, tokens: [{ text: "}", type: "plain" }] },
  { indent: 0, tokens: [{ text: "", type: "plain" }] },
  { indent: 0, tokens: [{ text: "// Time: O(n)  Space: O(n)", type: "comment" }] },
];

// ── The two fake cursors ───────────────────────────────────────
const CURSORS = [
  { name: "Ahmed",   color: "#6c63ff", startLine: 4, startCol: 8,  endLine: 6,  endCol: 5  },
  { name: "Sarah",   color: "#00d4aa", startLine: 1, startCol: 10, endLine: 3,  endCol: 14 },
];

// ── Fake typing animation state ───────────────────────────────
interface CursorState { line: number; col: number; visible: boolean; }

function useCursorAnimation(
  startLine: number,
  startCol: number,
  endLine: number,
  endCol: number,
  speed: number,
  offset: number
): CursorState {
  const [state, setState] = useState<CursorState>({
    line: startLine,
    col: startCol,
    visible: true,
  });

  useEffect(() => {
    let t = offset;
    
    const blink = setInterval(() => {
      setState((s) => ({ ...s, visible: !s.visible }));
    }, 530);

    const move = setInterval(() => {
      t += 1;
      const totalSteps = (endLine - startLine) * 20 + (endCol - startCol);
      const step = t % (totalSteps * 2);
      const forward = step < totalSteps;
      const progress = forward ? step : totalSteps * 2 - step;

      const lineProgress = Math.floor(progress / 20);
      const colProgress = progress % 20;

      setState((s) => ({
        ...s,
        line: Math.min(endLine, startLine + lineProgress),
        col:
          startLine + lineProgress < endLine
            ? colProgress
            : startCol + colProgress,
      }));
    }, speed);

    return () => {
      clearInterval(blink);
      clearInterval(move);
    };
  }, [startLine, startCol, endLine, endCol, speed, offset]);

  return state;
}

// ── Live Editor Mockup component ──────────────────────────────
function LiveEditorMockup() {
  const cursor1 = useCursorAnimation(
    CURSORS[0].startLine, CURSORS[0].startCol,
    CURSORS[0].endLine,   CURSORS[0].endCol,
    120, 0
  );
  const cursor2 = useCursorAnimation(
    CURSORS[1].startLine, CURSORS[1].startCol,
    CURSORS[1].endLine,   CURSORS[1].endCol,
    90, 15
  );

  const activeCursors = [
    { ...CURSORS[0], state: cursor1 },
    { ...CURSORS[1], state: cursor2 },
  ];

  return (
    <div
      style={{
        background: "#1e1e1e",
        border: "1px solid #2a2a3a",
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(108,99,255,0.12)",
        fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
        fontSize: "13px",
        lineHeight: "22px",
        userSelect: "none",
      }}
    >
      {/* Window chrome */}
      <div
        style={{
          padding: "10px 16px",
          background: "#161616",
          borderBottom: "1px solid #2a2a2a",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", gap: "6px" }}>
          {["#ff5f57", "#ffbd2e", "#28c840"].map((c) => (
            <div
              key={c}
              style={{ width: "11px", height: "11px", borderRadius: "50%", background: c }}
            />
          ))}
        </div>

        {/* Tab */}
        <div
          style={{
            marginLeft: "12px",
            padding: "3px 14px",
            background: "#1e1e1e",
            borderRadius: "5px 5px 0 0",
            color: "#ccc",
            fontSize: "12px",
            border: "1px solid #333",
            borderBottom: "none",
          }}
        >
          solution.js
        </div>

        <div style={{ flex: 1 }} />

        {/* Live user pills */}
        <div style={{ display: "flex", gap: "6px" }}>
          {activeCursors.map((c) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "2px 8px",
                borderRadius: "10px",
                background: `${c.color}22`,
                border: `1px solid ${c.color}55`,
                fontSize: "11px",
                color: c.color,
              }}
            >
              <Circle
                size={5}
                fill={c.color}
                stroke="none"
                style={{ flexShrink: 0 }}
              />
              {c.name}
            </div>
          ))}
        </div>
      </div>

      {/* Editor body */}
      <div style={{ display: "flex", position: "relative" }}>
        {/* Line numbers */}
        <div
          style={{
            padding: "14px 0",
            background: "#1e1e1e",
            borderRight: "1px solid #2a2a2a",
            minWidth: "42px",
            textAlign: "right",
          }}
        >
          {CODE_LINES.map((_, i) => (
            <div
              key={i}
              style={{
                padding: "0 10px 0 0",
                color: "#3e3e4e",
                fontSize: "12px",
                height: "22px",
                lineHeight: "22px",
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code content */}
        <div
          style={{
            flex: 1,
            padding: "14px 0 14px 16px",
            position: "relative",
            overflowX: "auto",
          }}
        >
          {CODE_LINES.map((line, lineIdx) => (
            <div
              key={lineIdx}
              style={{
                height: "22px",
                lineHeight: "22px",
                position: "relative",
                whiteSpace: "pre",
              }}
            >
              {/* Indent */}
              {"  ".repeat(line.indent)}

              {/* Tokens */}
              {line.tokens.map((tok, tokIdx) => (
                <span key={tokIdx} style={{ color: TOKEN_COLORS[tok.type] }}>
                  {tok.text}
                </span>
              ))}

              {/* Render cursors on their line */}
              {activeCursors.map((c) => {
                if (c.state.line !== lineIdx) return null;

                // Compute pixel offset of the cursor column
                const indentChars = line.indent * 2;
                const colOffset = indentChars + c.state.col;

                return (
                  <span key={c.name}>
                    {/* Cursor bar */}
                    <span
                      style={{
                        position: "absolute",
                        left: `${colOffset * 7.8}px`,
                        top: 0,
                        width: "2px",
                        height: "22px",
                        background: c.state.visible ? c.color : "transparent",
                        borderRadius: "1px",
                        transition: "left 0.08s ease",
                      }}
                    />
                    {/* Name label */}
                    {c.state.visible && (
                      <span
                        style={{
                          position: "absolute",
                          left: `${colOffset * 7.8}px`,
                          top: "-18px",
                          background: c.color,
                          color: "#fff",
                          fontSize: "10px",
                          padding: "1px 6px",
                          borderRadius: "3px",
                          whiteSpace: "nowrap",
                          pointerEvents: "none",
                          fontFamily: "sans-serif",
                          lineHeight: "16px",
                        }}
                      >
                        {c.name}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div
        style={{
          padding: "4px 16px",
          background: "#007acc",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          fontSize: "11px",
          color: "rgba(255,255,255,0.85)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Users size={11} />
          2 collaborators
        </span>
        <span>JavaScript</span>
        <span style={{ marginLeft: "auto" }}>UTF-8</span>
        <span>Ln {cursor1.line + 1}, Col {cursor1.col + 1}</span>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          padding: "0 64px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(108,99,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(108,99,255,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            pointerEvents: "none",
          }}
        />

        {/* Glow orbs */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "5%",
            width: "500px",
            height: "500px",
            background:
              "radial-gradient(circle, rgba(108,99,255,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "5%",
            width: "400px",
            height: "400px",
            background:
              "radial-gradient(circle, rgba(0,212,170,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 1.1fr",
            gap: "72px",
            alignItems: "center",
            paddingTop: "80px",
          }}
        >
          {/* ── Left: text ──────────────────────────────────── */}
          <div>
            <div
              className="animate-fade-up"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 14px",
                borderRadius: "20px",
                border: "1px solid rgba(108,99,255,0.3)",
                background: "rgba(108,99,255,0.08)",
                marginBottom: "28px",
                fontSize: "12px",
                color: "var(--accent)",
                fontFamily: "'Space Mono', monospace",
                letterSpacing: "0.05em",
              }}
            >
              <Circle size={6} fill="#00d4aa" stroke="none" />
              LIVE — real-time collaboration
            </div>

            <h1
              className="animate-fade-up delay-1"
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "clamp(38px, 4.5vw, 64px)",
                fontWeight: 800,
                lineHeight: 1.06,
                letterSpacing: "-0.03em",
                color: "#fff",
                marginBottom: "24px",
                opacity: 0,
              }}
            >
              Code together.
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #6c63ff, #00d4aa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Hire smarter.
              </span>
            </h1>

            <p
              className="animate-fade-up delay-2"
              style={{
                fontSize: "17px",
                color: "var(--muted)",
                lineHeight: 1.8,
                marginBottom: "40px",
                maxWidth: "460px",
                opacity: 0,
              }}
            >
              Real-time collaborative coding built for technical interviews and
              pair programming. Every session recorded. Every keystroke synced.
            </p>

            <div
              className="animate-fade-up delay-3"
              style={{ display: "flex", gap: "14px", flexWrap: "wrap", opacity: 0 }}
            >
              <button
                onClick={() => navigate(user ? "/interview" : "/login")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "13px 28px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #6c63ff, #5a54e8)",
                  border: "1px solid rgba(108,99,255,0.5)",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: 700,
                  fontFamily: "'Syne', sans-serif",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.transform = "translateY(-2px)";
                  b.style.boxShadow = "0 8px 32px rgba(108,99,255,0.45)";
                }}
                onMouseLeave={(e) => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.transform = "translateY(0)";
                  b.style.boxShadow = "none";
                }}
              >
                <Target size={16} />
                Start interview
              </button>

              <button
                onClick={() => navigate(user ? "/session" : "/login")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "13px 28px",
                  borderRadius: "10px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  fontSize: "15px",
                  fontWeight: 600,
                  fontFamily: "'Syne', sans-serif",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = "rgba(0,212,170,0.5)";
                  b.style.background = "rgba(0,212,170,0.06)";
                  b.style.color = "#00d4aa";
                }}
                onMouseLeave={(e) => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = "var(--border)";
                  b.style.background = "transparent";
                  b.style.color = "var(--text)";
                }}
              >
                <Users size={16} />
                Chill session
              </button>
            </div>

            {/* Social proof */}
            <div
              className="animate-fade-up delay-4"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginTop: "40px",
                opacity: 0,
              }}
            >
              <div style={{ display: "flex" }}>
                {["#6c63ff", "#00d4aa", "#ff6b6b", "#f59e0b"].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: c,
                      border: "2px solid var(--bg)",
                      marginLeft: i > 0 ? "-8px" : "0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    {["A", "S", "M", "K"][i]}
                  </div>
                ))}
              </div>
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--muted)",
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                Join 200+ engineers already using it
              </span>
            </div>
          </div>

          {/* ── Right: Live editor mockup ────────────────────── */}
          <div
            className="animate-fade-up delay-2"
            style={{ opacity: 0, position: "relative" }}
          >
            {/* Outer glow */}
            <div
              style={{
                position: "absolute",
                inset: "-20px",
                background:
                  "radial-gradient(ellipse at center, rgba(108,99,255,0.15) 0%, transparent 70%)",
                pointerEvents: "none",
                borderRadius: "20px",
              }}
            />
            <LiveEditorMockup />
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section
        style={{
          padding: "120px 64px",
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "72px" }}>
          <p
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: "16px",
            }}
          >
            Everything you need
          </p>
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(30px, 4vw, 48px)",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            Built for real interviews
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
          }}
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                style={{
                  padding: "28px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "14px",
                  transition: "all 0.3s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = "rgba(108,99,255,0.4)";
                  el.style.transform = "translateY(-4px)";
                  el.style.boxShadow = "0 16px 48px rgba(0,0,0,0.3)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = "var(--border)";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "rgba(108,99,255,0.1)",
                    border: "1px solid rgba(108,99,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    color: "var(--accent)",
                  }}
                >
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <h3
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: "10px",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: "14px",
                    lineHeight: 1.7,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section
        style={{
          margin: "0 auto 120px",
          padding: "72px",
          background:
            "linear-gradient(135deg, rgba(108,99,255,0.1), rgba(0,212,170,0.05))",
          border: "1px solid rgba(108,99,255,0.18)",
          borderRadius: "24px",
          textAlign: "center",
          maxWidth: "1100px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(26px, 4vw, 44px)",
            fontWeight: 800,
            color: "#fff",
            marginBottom: "16px",
            letterSpacing: "-0.02em",
          }}
        >
          Ready to start coding together?
        </h2>
        <p
          style={{
            color: "var(--muted)",
            fontSize: "16px",
            marginBottom: "36px",
          }}
        >
          Create an account in 10 seconds. No credit card required.
        </p>
        <div
          style={{ display: "flex", gap: "14px", justifyContent: "center" }}
        >
          <button
            onClick={() => navigate(user ? "/interview" : "/register")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "13px 32px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6c63ff, #5a54e8)",
              border: "none",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 700,
              fontFamily: "'Syne', sans-serif",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.boxShadow = "0 8px 32px rgba(108,99,255,0.5)";
              b.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.boxShadow = "none";
              b.style.transform = "translateY(0)";
            }}
          >
            <ArrowRight size={16} />
            {user ? "Go to Interview" : "Create free account"}
          </button>

          <button
            onClick={() => navigate(user ? "/session" : "/login")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "13px 32px",
              borderRadius: "10px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 600,
              fontFamily: "'Syne', sans-serif",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.borderColor = "rgba(255,255,255,0.35)";
              b.style.background = "rgba(255,255,255,0.05)";
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.borderColor = "rgba(255,255,255,0.15)";
              b.style.background = "transparent";
            }}
          >
            {user ? "Start session" : "Sign in"}
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}