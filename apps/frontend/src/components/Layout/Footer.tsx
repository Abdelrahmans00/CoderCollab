import { Link } from "react-router-dom";

export const Footer = () => (
  <footer
    style={{
      background: "var(--surface)",
      borderTop: "1px solid var(--border)",
      padding: "48px 64px 32px",
    }}
  >
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr",
        gap: "48px",
        marginBottom: "48px",
      }}
    >
      {/* Brand */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div
            style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: "linear-gradient(135deg, #6c63ff, #00d4aa)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Space Mono', monospace", fontSize: "12px",
              fontWeight: 700, color: "#fff",
            }}
          >
            {"</>"}
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "18px", color: "#fff" }}>
            CoderCollab
          </span>
        </div>
        <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.7, maxWidth: "260px" }}>
          Real-time collaborative coding for engineering teams. Practice, interview, and ship together.
        </p>
      </div>

      {/* Links */}
      {[
        {
          title: "Product",
          links: [
            { label: "Dashboard", path: "/" },
            { label: "Interview", path: "/interview" },
            { label: "Session", path: "/session" },
          ],
        },
        {
          title: "Account",
          links: [
            { label: "Sign in", path: "/login" },
            { label: "Register", path: "/register" },
          ],
        },
        {
          title: "Stack",
          links: [
            { label: "React + TypeScript", path: "#" },
            { label: "Socket.IO", path: "#" },
            { label: "Monaco Editor", path: "#" },
            { label: "PostgreSQL", path: "#" },
          ],
        },
      ].map((col) => (
        <div key={col.title}>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: "16px",
            }}
          >
            {col.title}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {col.links.map((l) => (
              <Link
                key={l.label}
                to={l.path}
                style={{
                  textDecoration: "none",
                  color: "var(--muted)",
                  fontSize: "14px",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#fff")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)")}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>

    <div
      style={{
        borderTop: "1px solid var(--border)",
        paddingTop: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <span style={{ color: "var(--muted)", fontSize: "13px", fontFamily: "'Space Mono', monospace" }}>
        © 2025 CoderCollab
      </span>
      <span style={{ color: "var(--muted)", fontSize: "13px" }}>
        Built for elite engineering teams
      </span>
    </div>
  </footer>
);