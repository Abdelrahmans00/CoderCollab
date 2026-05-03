import { useRoomStore } from "../../store/roomStore";
import { useAuthStore } from "../../store/authStore";

export const UsersList = () => {
  const { users } = useRoomStore();
  const { user } = useAuthStore();

  return (
    <div style={{ padding: "10px 14px" }}>
      <p style={{ color: "#666", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
        In this room ({users.length})
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {users.map((u, i) => (
          <div key={u.userId || `user-${i}`} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: u.color,
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#ccc", fontSize: "13px" }}>
              {u.userName}
              {u.userId === user?.id && (
                <span style={{ color: "#555", fontSize: "11px", marginLeft: "6px" }}>(you)</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};