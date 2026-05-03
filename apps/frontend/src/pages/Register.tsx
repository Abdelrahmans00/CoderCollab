import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      setAuth(data.user, data.token);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", position: "relative", overflow: "hidden", background: "#05050a" }}>
      {/* Left panel — same as login */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(https://lh3.googleusercontent.com/aida-public/AB6AXuC6LAdsdeDxQYxIxMdfe9ZNc_-_9SlVhCWrre26O8OM4WqU9x7MBBnbfkp4kw0OigvKcVZrp8W5EQCtrCIf6Bt03V8SQXHpjPyW34cdhwoph5KxiOsfiihaVQbG_rDTM7mhUc-9pczAvYKmjIQ5swQX5xQqLVtVh-BqI3jKurvLNMbn3Twu1rUde_jQQZ729e_sA1c6ZhXp_qaimKOIIrQ5OUKIwsVZunvMlTejLCu1t40EGP4qQu4EO0IDTCIQvs15dBWOm2Re0Pm)`,
            backgroundSize: "cover", backgroundPosition: "center",
            filter: "brightness(0.35) saturate(0.7)",
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(10,10,20,0.7) 0%, rgba(0,212,170,0.1) 100%)" }} />
        <div
          style={{
            position: "absolute", inset: 0,
            backgroundImage: `linear-gradient(rgba(0,212,170,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,0.06) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div style={{ position: "absolute", bottom: "48px", left: "48px", right: "48px" }}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#00d4aa", marginBottom: "12px" }}>
            Join the platform
          </p>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: "12px" }}>
            Start collaborating today.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", lineHeight: 1.7, maxWidth: "440px" }}>
            Real-time code sharing, interview tools, and session replay — all in one platform.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div
        style={{
          width: "460px", flexShrink: 0, display: "flex", flexDirection: "column",
          justifyContent: "center", padding: "60px 48px",
          background: "#0a0a0f", borderLeft: "1px solid rgba(0,212,170,0.1)",
          position: "relative",
        }}
      >
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", marginBottom: "52px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "linear-gradient(135deg, #6c63ff, #00d4aa)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono', monospace", fontSize: "12px", fontWeight: 700, color: "#fff" }}>
            {"</>"}
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "17px", color: "#fff", letterSpacing: "-0.02em" }}>
            CoderCollab
          </span>
        </Link>

        <div style={{ marginBottom: "36px" }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "30px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: "8px" }}>
            Create account
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>Get started in under a minute</p>
        </div>

        {error && (
          <div style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)", borderRadius: "8px", padding: "12px 14px", color: "#ff6b7a", fontSize: "13px", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[
            { label: "Full name", key: "name", type: "text", placeholder: "John Doe" },
            { label: "Email", key: "email", type: "email", placeholder: "you@example.com" },
            { label: "Password", key: "password", type: "password", placeholder: "Min 8 characters" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--muted)", marginBottom: "7px", letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>
                {label}
              </label>
              <input
                type={type}
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required
                placeholder={placeholder}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                  borderRadius: "9px", color: "#fff", fontSize: "14px", padding: "12px 14px",
                  outline: "none", fontFamily: "'Syne', sans-serif", transition: "all 0.2s", boxSizing: "border-box",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,212,170,0.5)"; e.currentTarget.style.background = "rgba(0,212,170,0.04)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "8px", padding: "13px", borderRadius: "9px",
              background: loading ? "rgba(0,212,170,0.3)" : "linear-gradient(135deg, #00d4aa, #0fb89a)",
              border: "none", color: loading ? "#00d4aa" : "#000",
              fontSize: "15px", fontWeight: 700, fontFamily: "'Syne', sans-serif",
              cursor: loading ? "default" : "pointer", transition: "all 0.2s", letterSpacing: "0.02em",
            }}
            onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(0,212,170,0.4)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; } }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "28px", fontSize: "14px", color: "var(--muted)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#00d4aa", textDecoration: "none", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>

        <Link to="/" style={{ position: "absolute", top: "28px", right: "28px", textDecoration: "none", color: "var(--muted)", fontSize: "13px", display: "flex", alignItems: "center", gap: "4px", transition: "color 0.2s" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#fff")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)")}
        >
          ← Back
        </Link>
      </div>
    </div>
  );
}