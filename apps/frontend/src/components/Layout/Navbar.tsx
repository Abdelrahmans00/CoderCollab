import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { label: "Dashboard", path: "/" },
    { label: "Interview", path: "/interview" },
    { label: "Session", path: "/session" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: "0 32px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: scrolled
          ? "rgba(10,10,15,0.92)"
          : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(108,99,255,0.15)" : "none",
        transition: "all 0.3s ease",
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #6c63ff, #00d4aa)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Space Mono', monospace",
            fontSize: "14px",
            fontWeight: 700,
            color: "#fff",
          }}
        >
          {"</>"}
        </div>
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "18px",
            color: "#fff",
            letterSpacing: "-0.02em",
          }}
        >
          CoderCollab
        </span>
      </Link>

      {/* Desktop links */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            style={{
              textDecoration: "none",
              padding: "6px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              color: isActive(link.path) ? "#fff" : "var(--muted)",
              background: isActive(link.path)
                ? "rgba(108,99,255,0.15)"
                : "transparent",
              border: isActive(link.path)
                ? "1px solid rgba(108,99,255,0.3)"
                : "1px solid transparent",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!isActive(link.path)) {
                (e.currentTarget as HTMLAnchorElement).style.color = "#fff";
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(link.path)) {
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)";
                (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
              }
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Auth section */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {user ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 12px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6c63ff, #00d4aa)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: "13px", color: "var(--text)" }}>
                {user.name}
              </span>
            </div>
            <button
              onClick={() => { logout(); navigate("/"); }}
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                color: "var(--muted)",
                fontSize: "13px",
                padding: "6px 14px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--danger)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--danger)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              style={{
                textDecoration: "none",
                color: "var(--muted)",
                fontSize: "14px",
                padding: "6px 14px",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#fff")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)")}
            >
              Sign in
            </Link>
            <Link
              to="/register"
              style={{
                textDecoration: "none",
                padding: "7px 18px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                background: "linear-gradient(135deg, #6c63ff, #5a54e8)",
                color: "#fff",
                border: "1px solid rgba(108,99,255,0.5)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 20px rgba(108,99,255,0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
              }}
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};