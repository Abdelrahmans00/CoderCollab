import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

const FLOATING_SNIPPETS = [
  "const solve = (n) => n <= 1 ? n :\n solve(n-1) + solve(n-2);",
  "def bfs(graph, start):\n  queue = deque([start])",
  "SELECT u.name, COUNT(s.id)\nFROM users u\nJOIN sessions s ON s.user_id = u.id",
  "for i in range(len(nums)):\n  seen[nums[i]] = i",
  "class Node:\n  def __init__(self, val):\n    self.val = val\n    self.next = None",
  "const dp = Array(n+1).fill(0);\ndp[0] = 1; dp[1] = 1;",
  "while (left < right) {\n  const mid = (left + right) >> 1;",
  "map.set(key, (map.get(key) || 0) + 1)",
];

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      setAuth(data.user, data.token);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#05050a",
      }}
    >
      {/* ── Left: background image + snippets ─────────────────── */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background photo */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(https://lh3.googleusercontent.com/aida-public/AB6AXuC6LAdsdeDxQYxIxMdfe9ZNc_-_9SlVhCWrre26O8OM4WqU9x7MBBnbfkp4kw0OigvKcVZrp8W5EQCtrCIf6Bt03V8SQXHpjPyW34cdhwoph5KxiOsfiihaVQbG_rDTM7mhUc-9pczAvYKmjIQ5swQX5xQqLVtVh-BqI3jKurvLNMbn3Twu1rUde_jQQZ729e_sA1c6ZhXp_qaimKOIIrQ5OUKIwsVZunvMlTejLCu1t40EGP4qQu4EO0IDTCIQvs15dBWOm2Re0Pm)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.35) saturate(0.7)",
          }}
        />

        {/* Dark overlay with purple tint */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(10,10,20,0.7) 0%, rgba(108,99,255,0.15) 100%)",
          }}
        />

        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(108,99,255,0.07) 1px, transparent 1px),
              linear-gradient(90deg, rgba(108,99,255,0.07) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Floating code snippets */}
        {FLOATING_SNIPPETS.map((snippet, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${8 + (i % 3) * 30 + Math.sin(i * 1.5) * 8}%`,
              top: `${8 + Math.floor(i / 3) * 26 + (i % 2) * 6}%`,
              background: "rgba(13,13,25,0.75)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(108,99,255,0.2)",
              borderRadius: "8px",
              padding: "10px 14px",
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              color: "rgba(171,178,191,0.7)",
              maxWidth: "240px",
              whiteSpace: "pre",
              lineHeight: 1.7,
              animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
              pointerEvents: "none",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            }}
          >
            {snippet}
          </div>
        ))}

        {/* Hero text overlay */}
        <div
          style={{
            position: "absolute",
            bottom: "48px",
            left: "48px",
            right: "48px",
          }}
        >
          <p
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#6c63ff",
              marginBottom: "12px",
            }}
          >
            CoderCollab
          </p>
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(24px, 3vw, 38px)",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              marginBottom: "12px",
            }}
          >
            Elevate your technical interviews.
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "15px",
              lineHeight: 1.7,
              maxWidth: "480px",
            }}
          >
            Experience the most reliable real-time collaborative coding environment
            built for elite engineering teams.
          </p>
        </div>
      </div>

      {/* ── Right: login form ──────────────────────────────────── */}
      <div
        style={{
          width: "460px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 48px",
          background: "#0a0a0f",
          borderLeft: "1px solid rgba(108,99,255,0.12)",
          position: "relative",
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "52px",
          }}
        >
          <div
            style={{
              width: "34px", height: "34px", borderRadius: "9px",
              background: "linear-gradient(135deg, #6c63ff, #00d4aa)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Space Mono', monospace", fontSize: "12px",
              fontWeight: 700, color: "#fff",
            }}
          >
            {"</>"}
          </div>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "17px",
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            CoderCollab
          </span>
        </Link>

        {/* Heading */}
        <div style={{ marginBottom: "36px" }}>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "30px",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.02em",
              marginBottom: "8px",
            }}
          >
            Welcome back
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>
            Sign in to your account to continue
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "rgba(255,71,87,0.1)",
              border: "1px solid rgba(255,71,87,0.3)",
              borderRadius: "8px",
              padding: "12px 14px",
              color: "#ff6b7a",
              fontSize: "13px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--muted)",
                marginBottom: "7px",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                fontFamily: "'Space Mono', monospace",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="you@example.com"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                borderRadius: "9px",
                color: "#fff",
                fontSize: "14px",
                padding: "12px 14px",
                outline: "none",
                fontFamily: "'Syne', sans-serif",
                transition: "border-color 0.2s, background 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(108,99,255,0.6)";
                e.currentTarget.style.background = "rgba(108,99,255,0.05)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--muted)",
                marginBottom: "7px",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                fontFamily: "'Space Mono', monospace",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              placeholder="••••••••"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                borderRadius: "9px",
                color: "#fff",
                fontSize: "14px",
                padding: "12px 14px",
                outline: "none",
                fontFamily: "'Syne', sans-serif",
                transition: "border-color 0.2s, background 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(108,99,255,0.6)";
                e.currentTarget.style.background = "rgba(108,99,255,0.05)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "8px",
              padding: "13px",
              borderRadius: "9px",
              background: loading
                ? "rgba(108,99,255,0.4)"
                : "linear-gradient(135deg, #6c63ff, #5a54e8)",
              border: "1px solid rgba(108,99,255,0.4)",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 700,
              fontFamily: "'Syne', sans-serif",
              cursor: loading ? "default" : "pointer",
              transition: "all 0.2s",
              letterSpacing: "0.02em",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(108,99,255,0.45)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "28px",
            fontSize: "14px",
            color: "var(--muted)",
          }}
        >
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{
              color: "#6c63ff",
              textDecoration: "none",
              fontWeight: 600,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#8b85ff")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#6c63ff")}
          >
            Create account
          </Link>
        </p>

        {/* Back to home */}
        <Link
          to="/"
          style={{
            position: "absolute",
            top: "28px",
            right: "28px",
            textDecoration: "none",
            color: "var(--muted)",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#fff")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)")}
        >
          ← Back
        </Link>
      </div>
    </div>
  );
}