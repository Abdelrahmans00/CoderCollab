import { useState, useRef, useEffect } from "react";
import { useRoomStore } from "../../store/roomStore";
import { useAuthStore } from "../../store/authStore";

interface Language {
  id: string;
  label: string;
  icon: string;
  defaultCode: string;
}

const LANGUAGES: Language[] = [
  {
    id: "javascript",
    label: "JavaScript",
    icon: "JS",
    defaultCode:
      "// JavaScript\nfunction solution() {\n  \n}\n",
  },
  {
    id: "typescript",
    label: "TypeScript",
    icon: "TS",
    defaultCode:
      "// TypeScript\nfunction solution(): void {\n  \n}\n",
  },
  {
    id: "python",
    label: "Python",
    icon: "PY",
    defaultCode: "# Python\ndef solution():\n    pass\n",
  },
  {
    id: "java",
    label: "Java",
    icon: "JV",
    defaultCode:
      "// Java\npublic class Solution {\n    public void solve() {\n        \n    }\n}\n",
  },
  {
    id: "cpp",
    label: "C++",
    icon: "C+",
    defaultCode:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n',
  },
  {
    id: "csharp",
    label: "C#",
    icon: "C#",
    defaultCode:
      "// C#\nusing System;\n\nclass Solution {\n    static void Main() {\n        \n    }\n}\n",
  },
  {
    id: "go",
    label: "Go",
    icon: "GO",
    defaultCode: 'package main\n\nimport "fmt"\n\nfunc main() {\n    \n}\n',
  },
  {
    id: "rust",
    label: "Rust",
    icon: "RS",
    defaultCode: "fn main() {\n    \n}\n",
  },
  {
    id: "ruby",
    label: "Ruby",
    icon: "RB",
    defaultCode: "# Ruby\ndef solution\n  \nend\n",
  },
  {
    id: "swift",
    label: "Swift",
    icon: "SW",
    defaultCode: "// Swift\nfunc solution() {\n    \n}\n",
  },
  {
    id: "kotlin",
    label: "Kotlin",
    icon: "KT",
    defaultCode: "// Kotlin\nfun solution() {\n    \n}\n",
  },
  {
    id: "sql",
    label: "SQL",
    icon: "SQ",
    defaultCode: "-- SQL\nSELECT *\nFROM table_name\nWHERE condition;\n",
  },
];

const ICON_COLORS: Record<string, string> = {
  javascript: "#f7df1e",
  typescript: "#3178c6",
  python:     "#3572A5",
  java:       "#b07219",
  cpp:        "#f34b7d",
  csharp:     "#178600",
  go:         "#00ADD8",
  rust:       "#dea584",
  ruby:       "#701516",
  swift:      "#F05138",
  kotlin:     "#A97BFF",
  sql:        "#e38c00",
};

interface Props {
  roomName: string;
  onLanguageChange: (lang: string) => void;
  onLeave: () => void;
}

export const RoomToolbar = ({ roomName, onLanguageChange, onLeave }: Props) => {
  const { language, users, setCode, setLanguage } = useRoomStore();
  const { user } = useAuthStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const currentLang = LANGUAGES.find((l) => l.id === language) ?? LANGUAGES[0];

  // Close picker when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search input when picker opens
  useEffect(() => {
    if (pickerOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [pickerOpen]);

  const handleSelect = (lang: Language) => {
    // Update local store language
    setLanguage(lang.id);
    // Reset editor to language's default boilerplate
    setCode(lang.defaultCode);
    // Emit to all other users
    onLanguageChange(lang.id);
    setPickerOpen(false);
    setSearch("");
  };

  const filtered = LANGUAGES.filter(
    (l) =>
      l.label.toLowerCase().includes(search.toLowerCase()) ||
      l.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flex: 1,
      }}
    >
      {/* Room name */}
      <span
        style={{
          color: "#ccc",
          fontWeight: 500,
          fontSize: "13px",
          whiteSpace: "nowrap",
        }}
      >
        {roomName}
      </span>

      <div style={{ width: "1px", height: "20px", background: "#333" }} />

      {/* ── Language picker ───────────────────────────────────── */}
      <div ref={pickerRef} style={{ position: "relative" }}>
        {/* Trigger button — styled like VS Code status bar */}
        <button
          onClick={() => setPickerOpen((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            background: pickerOpen ? "#2d2d2d" : "transparent",
            border: "none",
            borderRadius: "5px",
            padding: "4px 8px",
            cursor: "pointer",
            color: "#ccc",
            fontSize: "13px",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "#2d2d2d")
          }
          onMouseLeave={(e) => {
            if (!pickerOpen)
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
          }}
        >
          {/* Language icon badge */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "22px",
              height: "16px",
              borderRadius: "3px",
              background: ICON_COLORS[currentLang.id] ?? "#555",
              color: ["javascript", "sql"].includes(currentLang.id)
                ? "#000"
                : "#fff",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              fontFamily: "monospace",
              flexShrink: 0,
            }}
          >
            {currentLang.icon}
          </span>
          <span>{currentLang.label}</span>
          {/* Chevron */}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 3.5L5 6.5L8 3.5"
              stroke="#888"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Dropdown panel */}
        {pickerOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              width: "220px",
              background: "#252526",
              border: "1px solid #454545",
              borderRadius: "6px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              zIndex: 100,
              overflow: "hidden",
            }}
          >
            {/* Search */}
            <div
              style={{
                padding: "8px 10px",
                borderBottom: "1px solid #3c3c3c",
              }}
            >
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter languages..."
                style={{
                  width: "100%",
                  background: "#3c3c3c",
                  border: "1px solid #555",
                  borderRadius: "4px",
                  color: "#ccc",
                  fontSize: "12px",
                  padding: "5px 8px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Language list */}
            <div style={{ maxHeight: "260px", overflowY: "auto" }}>
              {filtered.map((lang) => {
                const isActive = lang.id === language;
                return (
                  <div
                    key={lang.id}
                    onClick={() => handleSelect(lang)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "7px 12px",
                      cursor: "pointer",
                      background: isActive ? "#04395e" : "transparent",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLDivElement).style.background =
                          "#2a2d2e";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLDivElement).style.background =
                          "transparent";
                    }}
                  >
                    {/* Icon */}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "24px",
                        height: "17px",
                        borderRadius: "3px",
                        background: ICON_COLORS[lang.id] ?? "#555",
                        color: ["javascript", "sql"].includes(lang.id)
                          ? "#000"
                          : "#fff",
                        fontSize: "9px",
                        fontWeight: 700,
                        fontFamily: "monospace",
                        flexShrink: 0,
                      }}
                    >
                      {lang.icon}
                    </span>

                    <span
                      style={{
                        color: isActive ? "#fff" : "#ccc",
                        fontSize: "13px",
                        flex: 1,
                      }}
                    >
                      {lang.label}
                    </span>

                    {/* Active checkmark */}
                    {isActive && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M2.5 7L5.5 10L11.5 4"
                          stroke="#4ec9b0"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <p
                  style={{
                    color: "#666",
                    fontSize: "12px",
                    textAlign: "center",
                    padding: "16px",
                    margin: 0,
                  }}
                >
                  No languages found
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Connected user avatars */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {users.map((u) => (
          <div
            key={u.userId}
            title={u.userName}
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              background: u.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "11px",
              fontWeight: 600,
              border:
                u.userId === user?.id
                  ? "2px solid #fff"
                  : "2px solid transparent",
              flexShrink: 0,
            }}
          >
            {u.userName.charAt(0).toUpperCase()}
          </div>
        ))}
      </div>

      {/* Leave */}
      <button
        onClick={onLeave}
        style={{
          background: "#c0392b",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          padding: "5px 14px",
          fontSize: "12px",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Leave
      </button>
    </div>
  );
};