import { useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Play,
  Square,
  Terminal,
  Trash2,
} from "lucide-react";

import api from "../../services/api";
import { useRoomStore } from "../../store/roomStore";

interface ExecuteResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null;
  memory: number | null;
}

const STATUS_COLORS: Record<number, string> = {
  3: "#22c55e",
  4: "#ef4444",
  5: "#f59e0b",
  6: "#ef4444",
  7: "#ef4444",
  8: "#ef4444",
  9: "#ef4444",
  10: "#ef4444",
  11: "#ef4444",
  12: "#ef4444",
  13: "#ef4444",
  14: "#f59e0b",
};

const getStatusColor = (id: number) =>
  STATUS_COLORS[id] ?? "#888";

export const OutputPanel = () => {
  const { code, language } = useRoomStore();

  const [result, setResult] =
    useState<ExecuteResult | null>(null);

  const [loading, setLoading] = useState(false);

  const [stdin, setStdin] = useState("");

  const [open, setOpen] = useState(true);

  const [showStdin, setShowStdin] = useState(false);

  const abortRef = useRef(false);

  const run = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setResult(null);

    abortRef.current = false;

    try {
      const { data } = await api.post("/execute", {
        code,
        language,
        stdin: stdin || undefined,
      });

      if (!abortRef.current) {
        setResult(data);
      }
    } catch (error: any) {
      if (!abortRef.current) {
        setResult({
          stdout: null,
          stderr:
            error.response?.data?.error ||
            "Network error",
          compile_output: null,
          status: {
            id: 0,
            description: "Error",
          },
          time: null,
          memory: null,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const stop = () => {
    abortRef.current = true;
    setLoading(false);
  };

  const clear = () => {
    setResult(null);
    setStdin("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#161616",
        borderTop: "1px solid #333",
        flexShrink: 0,
        height: open ? "220px" : "40px",
        overflow: "hidden",
        transition: "height 0.2s",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "0 12px",
          height: "40px",
          borderBottom: open
            ? "1px solid #2a2a2a"
            : "none",
          flexShrink: 0,
        }}
      >
        <Terminal size={13} color="#888" />

        <span
          style={{
            flex: 1,
            fontSize: "12px",
            color: "#888",
            fontFamily: "'Space Mono', monospace",
          }}
        >
          Output

          {result && (
            <span
              style={{
                marginLeft: "8px",
                color: getStatusColor(result.status.id),
              }}
            >
              {result.status.description}

              {result.time &&
                ` · ${result.time}s`}

              {result.memory &&
                ` · ${Math.round(
                  result.memory / 1024
                )}kb`}
            </span>
          )}
        </span>

        {/* stdin toggle */}
        <button
          onClick={() =>
            setShowStdin((prev) => !prev)
          }
          style={{
            background: showStdin
              ? "rgba(108,99,255,0.15)"
              : "transparent",
            border: showStdin
              ? "1px solid rgba(108,99,255,0.3)"
              : "1px solid transparent",
            borderRadius: "4px",
            color: showStdin
              ? "#6c63ff"
              : "#555",
            fontSize: "11px",
            padding: "2px 8px",
            cursor: "pointer",
          }}
        >
          stdin
        </button>

        {/* clear */}
        {result && (
          <button
            onClick={clear}
            style={{
              background: "none",
              border: "none",
              color: "#555",
              cursor: "pointer",
            }}
          >
            <Trash2 size={13} />
          </button>
        )}

        {/* run/stop */}
        {loading ? (
          <button
            onClick={stop}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 10px",
              borderRadius: "5px",
              background: "#7f1d1d",
              border: "none",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            <Square size={11} />
            Stop
          </button>
        ) : (
          <button
            onClick={run}
            disabled={!code.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 12px",
              borderRadius: "5px",
              background: !code.trim()
                ? "rgba(34,197,94,0.2)"
                : "#15803d",
              border: "none",
              color: "#fff",
              cursor: !code.trim()
                ? "default"
                : "pointer",
            }}
          >
            <Play size={11} />
            Run
          </button>
        )}

        {/* collapse */}
        <button
          onClick={() =>
            setOpen((prev) => !prev)
          }
          style={{
            background: "none",
            border: "none",
            color: "#555",
            cursor: "pointer",
          }}
        >
          {open ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronUp size={14} />
          )}
        </button>
      </div>

      {/* stdin */}
      {open && showStdin && (
        <div
          style={{
            padding: "6px 12px",
            borderBottom: "1px solid #2a2a2a",
          }}
        >
          <textarea
            value={stdin}
            onChange={(e) =>
              setStdin(e.target.value)
            }
            placeholder="stdin..."
            rows={2}
            style={{
              width: "100%",
              background: "#1e1e1e",
              border: "1px solid #333",
              borderRadius: "5px",
              color: "#abb2bf",
              padding: "6px 8px",
              resize: "none",
              outline: "none",
              fontSize: "12px",
            }}
          />
        </div>
      )}

      {/* output */}
      {open && (
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "10px 14px",
            fontFamily:
              "'Cascadia Code', monospace",
            fontSize: "13px",
            lineHeight: 1.7,
          }}
        >
          {loading && (
            <div style={{ color: "#555" }}>
              Running...
            </div>
          )}

          {!loading && !result && (
            <span style={{ color: "#3e3e4e" }}>
              Press Run to execute your code
            </span>
          )}

          {!loading && result && (
            <>
              {result.compile_output && (
                <div
                  style={{
                    color: "#f59e0b",
                    whiteSpace: "pre-wrap",
                    marginBottom: "8px",
                  }}
                >
                  {result.compile_output}
                </div>
              )}

              {result.stderr &&
                !result.compile_output && (
                  <div
                    style={{
                      color: "#ef4444",
                      whiteSpace: "pre-wrap",
                      marginBottom: "8px",
                    }}
                  >
                    {result.stderr}
                  </div>
                )}

              {result.stdout && (
                <div
                  style={{
                    color: "#abb2bf",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {result.stdout}
                </div>
              )}

              {!result.stdout &&
                !result.stderr &&
                !result.compile_output &&
                result.status.id === 3 && (
                  <span
                    style={{
                      color: "#22c55e",
                    }}
                  >
                    ✓ Ran successfully (no output)
                  </span>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
};