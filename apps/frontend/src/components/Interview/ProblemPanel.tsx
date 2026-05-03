import { useState } from "react";
import { useRoomStore } from "../../store/roomStore";
import type { Problem } from "../../store/roomStore";

interface Props {
  onSetProblem: (problem: Problem) => void;
  onResetProblem: () => void;
}

// Built-in problem presets so the interviewer can load one in one click
const PRESETS: Problem[] = [
  {
    title: "Two Sum",
    description:
      "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input has exactly one solution, and you may not use the same element twice.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] = 2 + 7 = 9" },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
    ],
    constraints: ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i] ≤ 10⁹", "Only one valid answer exists"],
  },
  {
    title: "Valid Parentheses",
    description:
      "Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets, and open brackets are closed in the correct order.",
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
    constraints: ["1 ≤ s.length ≤ 10⁴", "s consists of parentheses only"],
  },
  {
    title: "Reverse a linked list",
    description:
      "Given the `head` of a singly linked list, reverse the list, and return the reversed list.",
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" },
      { input: "head = [1,2]", output: "[2,1]" },
    ],
    constraints: ["0 ≤ nodes ≤ 5000", "-5000 ≤ Node.val ≤ 5000"],
  },
];

export const ProblemPanel = ({ onSetProblem, onResetProblem }: Props) => {
  const { problem, isInterviewer } = useRoomStore();
  const [showEditor, setShowEditor] = useState(false);
  const [draft, setDraft] = useState<Problem>({
    title: "",
    description: "",
    examples: [{ input: "", output: "" }],
    constraints: [""],
  });

  const handleSubmit = () => {
    if (!draft.title.trim() || !draft.description.trim()) return;
    onSetProblem(draft);
    setShowEditor(false);
  };

  const addExample = () =>
    setDraft((d) => ({ ...d, examples: [...d.examples, { input: "", output: "" }] }));

  const updateExample = (
    i: number,
    field: "input" | "output" | "explanation",
    val: string
  ) =>
    setDraft((d) => ({
      ...d,
      examples: d.examples.map((ex, idx) =>
        idx === i ? { ...ex, [field]: val } : ex
      ),
    }));

  const addConstraint = () =>
    setDraft((d) => ({ ...d, constraints: [...d.constraints, ""] }));

  const updateConstraint = (i: number, val: string) =>
    setDraft((d) => ({
      ...d,
      constraints: d.constraints.map((c, idx) => (idx === i ? val : c)),
    }));

  const panelStyle: React.CSSProperties = {
    height: "100%",
    overflowY: "auto",
    background: "#161616",
    borderRight: "1px solid #333",
    display: "flex",
    flexDirection: "column",
    fontSize: "13px",
    color: "#d4d4d4",
  };

  const inputStyle: React.CSSProperties = {
    background: "#2d2d2d",
    border: "1px solid #444",
    borderRadius: "6px",
    color: "#d4d4d4",
    fontSize: "12px",
    padding: "6px 8px",
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
  };

  // ── Interviewer: no problem set yet ────────────────────────
  if (isInterviewer && !problem && !showEditor) {
    return (
      <div style={panelStyle}>
        <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #333", color: "#999", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Problem
        </div>
        <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <p style={{ color: "#666", fontSize: "12px", margin: 0 }}>
            Load a preset or write a custom problem.
          </p>
          {PRESETS.map((p) => (
            <button
              key={p.title}
              onClick={() => onSetProblem(p)}
              style={{
                background: "#2d2d2d",
                border: "1px solid #444",
                borderRadius: "6px",
                color: "#ccc",
                padding: "8px 10px",
                fontSize: "12px",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {p.title}
            </button>
          ))}
          <button
            onClick={() => setShowEditor(true)}
            style={{
              background: "#1d4ed8",
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              padding: "8px 10px",
              fontSize: "12px",
              cursor: "pointer",
              marginTop: "4px",
            }}
          >
            Write custom problem
          </button>
        </div>
      </div>
    );
  }

  // ── Interviewer: custom problem editor ─────────────────────
  if (isInterviewer && showEditor) {
    return (
      <div style={panelStyle}>
        <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#999", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Custom problem
          </span>
          <button onClick={() => setShowEditor(false)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "16px" }}>×</button>
        </div>

        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto" }}>
          <div>
            <label style={{ color: "#888", fontSize: "11px", display: "block", marginBottom: "4px" }}>Title</label>
            <input
              style={inputStyle}
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Problem title"
            />
          </div>
          <div>
            <label style={{ color: "#888", fontSize: "11px", display: "block", marginBottom: "4px" }}>Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: "100px", resize: "vertical", fontFamily: "inherit" }}
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Problem description..."
            />
          </div>

          <div>
            <label style={{ color: "#888", fontSize: "11px", display: "block", marginBottom: "6px" }}>
              Examples
            </label>
            {draft.examples.map((ex, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "8px" }}>
                <input style={inputStyle} value={ex.input} onChange={(e) => updateExample(i, "input", e.target.value)} placeholder="Input" />
                <input style={inputStyle} value={ex.output} onChange={(e) => updateExample(i, "output", e.target.value)} placeholder="Output" />
                <input style={inputStyle} value={ex.explanation ?? ""} onChange={(e) => updateExample(i, "explanation", e.target.value)} placeholder="Explanation (optional)" />
              </div>
            ))}
            <button onClick={addExample} style={{ background: "none", border: "1px dashed #555", borderRadius: "6px", color: "#888", padding: "4px 10px", fontSize: "11px", cursor: "pointer" }}>
              + Add example
            </button>
          </div>

          <div>
            <label style={{ color: "#888", fontSize: "11px", display: "block", marginBottom: "6px" }}>Constraints</label>
            {draft.constraints.map((c, i) => (
              <input key={i} style={{ ...inputStyle, marginBottom: "4px" }} value={c} onChange={(e) => updateConstraint(i, e.target.value)} placeholder="e.g. 1 ≤ n ≤ 10⁴" />
            ))}
            <button onClick={addConstraint} style={{ background: "none", border: "1px dashed #555", borderRadius: "6px", color: "#888", padding: "4px 10px", fontSize: "11px", cursor: "pointer" }}>
              + Add constraint
            </button>
          </div>

          <button
            onClick={handleSubmit}
            style={{ background: "#1d4ed8", border: "none", borderRadius: "6px", color: "#fff", padding: "10px", fontSize: "13px", cursor: "pointer", marginTop: "4px" }}
          >
            Send to candidate
          </button>
        </div>
      </div>
    );
  }

  // ── Problem display (both roles once set) ──────────────────
  if (!problem) {
    return (
      <div style={panelStyle}>
        <div style={{ padding: "14px", borderBottom: "1px solid #333", color: "#999", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Problem
        </div>
        <p style={{ padding: "16px 14px", color: "#555", fontSize: "12px", margin: 0 }}>
          Waiting for the interviewer to set a problem...
        </p>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid #333",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: "#e2e8f0",
            fontWeight: 500,
            fontSize: "14px",
          }}
        >
          {problem.title}
        </span>
        {isInterviewer && (
          <button
            onClick={onResetProblem}
            style={{
              background: "none",
              border: "1px solid #555",
              borderRadius: "4px",
              color: "#888",
              padding: "2px 8px",
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
        {/* Description */}
        <p style={{ margin: 0, lineHeight: 1.7, color: "#c9d1d9", fontSize: "13px" }}>
          {problem.description}
        </p>

        {/* Examples */}
        {problem.examples.map((ex, i) => (
          <div key={i}>
            <p style={{ margin: "0 0 6px", color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Example {i + 1}
            </p>
            <div
              style={{
                background: "#2d2d2d",
                borderRadius: "6px",
                padding: "10px 12px",
                fontFamily: "monospace",
                fontSize: "12px",
                lineHeight: 1.8,
              }}
            >
              <div><span style={{ color: "#888" }}>Input: </span><span style={{ color: "#d4d4d4" }}>{ex.input}</span></div>
              <div><span style={{ color: "#888" }}>Output: </span><span style={{ color: "#d4d4d4" }}>{ex.output}</span></div>
              {ex.explanation && (
                <div><span style={{ color: "#888" }}>Explanation: </span><span style={{ color: "#a3a3a3" }}>{ex.explanation}</span></div>
              )}
            </div>
          </div>
        ))}

        {/* Constraints */}
        {problem.constraints.length > 0 && (
          <div>
            <p style={{ margin: "0 0 8px", color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Constraints
            </p>
            <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {problem.constraints.filter(Boolean).map((c, i) => (
                <li key={i} style={{ color: "#a3a3a3", fontSize: "12px", fontFamily: "monospace" }}>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};