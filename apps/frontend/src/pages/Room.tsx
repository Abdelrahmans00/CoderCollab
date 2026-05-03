import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import type * as Monaco from "monaco-editor";
import { useAuthStore } from "../store/authStore";
import { useRoomStore } from "../store/roomStore";
import { useRoom } from "../hooks/useRoom";
import api from "../services/api";
import { CodeEditor, makeApplyCode } from "../components/Editor/CodeEditor";
import { CursorOverlay } from "../components/Editor/CursorOverlay";
import { RoomToolbar } from "../components/Room/RoomToolbar";
import { ChatBox } from "../components/Chat/ChatBox";
import { UsersList } from "../components/Room/UsersList";
import { Timer } from "../components/Interview/Timer";
import { ProblemPanel } from "../components/Interview/ProblemPanel";
import { InterviewControls } from "../components/Interview/InterviewControls";

interface RoomInnerProps {
  roomId: string;
  user: { id: string; name: string; email: string };
  role: "interviewer" | "candidate";
}

function RoomInner({ roomId, user, role }: RoomInnerProps) {
  const navigate = useNavigate();
  const { setCode, setInterviewer } = useRoomStore();

  const [roomName, setRoomName] = useState("Loading...");
  const [roomType, setRoomType] = useState<"session" | "interview">("session");
  const [editorInstance, setEditorInstance] =
    useState<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [problemOpen, setProblemOpen] = useState(true);

  // Ref to the applyCode function — created once editor mounts
  const applyCodeRef = useRef<((code: string) => void) | null>(null);
  // Tracks whether the current onChange came from us (not remote)
  const isApplyingRemote = useRef(false);

  useEffect(() => {
    setInterviewer(role === "interviewer");
  }, [role]);

  // ── Fetch room metadata ──────────────────────────────────────
  useEffect(() => {
    api.get(`/rooms/${roomId}`).then((r) => {
      setRoomName(r.data.name);
      setRoomType(r.data.type ?? "session");
    });
  }, [roomId]);

  // ── Build applyCode once editor is mounted ───────────────────
  useEffect(() => {
    if (!editorInstance) return;
    applyCodeRef.current = makeApplyCode(editorInstance, isApplyingRemote);
  }, [editorInstance]);

  // ── Socket hook — pass applyCode so socket can write directly ─
  const {
    emitCodeChange,
    emitCursorMove,
    emitLanguageChange,
    sendMessage,
    startTimerEmit,
    stopTimerEmit,
    setProblemEmit,
    resetProblemEmit,
    setRoleEmit,
  } = useRoom(roomId, user.id, user.name, role, applyCodeRef);

  // ── Local code changes (user is typing) ──────────────────────
  const handleCodeChange = (newCode: string) => {
    setCode(newCode); // keep store in sync for other components
    emitCodeChange(newCode);
  };

  if (!roomName) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#1e1e1e",
        overflow: "hidden",
      }}
    >
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "0 16px",
          height: "48px",
          background: "#1e1e1e",
          borderBottom: "1px solid #333",
          flexShrink: 0,
        }}
      >
        <RoomToolbar
          roomName={roomName}
          onLanguageChange={emitLanguageChange}
          onLeave={() => navigate(roomType === "interview" ? "/interview" : "/session")}
        />

        {roomType === "interview" && (
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <Timer onStop={stopTimerEmit} />
          </div>
        )}
        {roomType === "session" && <div style={{ flex: 1 }} />}

        {roomType === "interview" && (
          <span
            style={{
              background: role === "interviewer" ? "#1d4ed8" : "#374151",
              color: "#fff",
              fontSize: "11px",
              padding: "3px 10px",
              borderRadius: "20px",
              letterSpacing: "0.04em",
              flexShrink: 0,
            }}
          >
            {role}
          </span>
        )}
      </div>

      {/* ── Main area ───────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left panel — interview only */}
        {problemOpen && roomType === "interview" && (
          <div
            style={{
              width: "300px",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderRight: "1px solid #333",
            }}
          >
            <InterviewControls
              onStartTimer={startTimerEmit}
              onStopTimer={stopTimerEmit}
              onSetRole={setRoleEmit}
            />
            <div style={{ flex: 1, overflow: "hidden" }}>
              <ProblemPanel
                onSetProblem={setProblemEmit}
                onResetProblem={resetProblemEmit}
              />
            </div>
          </div>
        )}

        {roomType === "interview" && (
          <div
            onClick={() => setProblemOpen((v) => !v)}
            style={{
              width: "20px",
              background: "#161616",
              borderRight: "1px solid #333",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              writingMode: "vertical-rl",
              fontSize: "10px",
              color: "#555",
              letterSpacing: "0.1em",
              userSelect: "none",
            }}
          >
            {problemOpen ? "◀" : "▶"}
          </div>
        )}

        {/* Editor */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <CodeEditor
            onCodeChange={handleCodeChange}
            onCursorMove={emitCursorMove}
            onEditorMount={(editor) => setEditorInstance(editor)}
          />
          <CursorOverlay editor={editorInstance} />
        </div>

        {/* Users list */}
        <div
          style={{
            width: "150px",
            background: "#161616",
            borderLeft: "1px solid #333",
            flexShrink: 0,
            overflowY: "auto",
          }}
        >
          <UsersList />
        </div>

        {/* Chat */}
        {chatOpen && (
          <div
            style={{
              width: "260px",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <ChatBox onSend={sendMessage} />
          </div>
        )}

        <button
          onClick={() => setChatOpen((v) => !v)}
          title={chatOpen ? "Hide chat" : "Show chat"}
          style={{
            position: "absolute",
            bottom: "16px",
            right: chatOpen ? "272px" : "16px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            fontSize: "16px",
            cursor: "pointer",
            transition: "right 0.2s",
            zIndex: 10,
          }}
        >
          {chatOpen ? "×" : "+"}
        </button>
      </div>
    </div>
  );
}

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const role =
    (searchParams.get("role") as "interviewer" | "candidate") ?? "candidate";

  if (!user || !roomId) {
    return (
      <div
        style={{
          height: "100vh",
          background: "#1e1e1e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#555",
          fontSize: "14px",
        }}
      >
        Loading...
      </div>
    );
  }

  return <RoomInner roomId={roomId} user={user} role={role} />;
}