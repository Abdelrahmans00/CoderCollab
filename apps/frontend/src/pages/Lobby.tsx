import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

interface Room {
  id?: string;
  _id?: string;
  name: string;
  createdAt: string;
}

export default function Lobby() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/rooms").then((r) => setRooms(r.data));
  }, []);

  const createRoom = async () => {
    if (!newRoomName.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/rooms", {
        name: newRoomName.trim(),
      });

      setRooms((prev) => [data, ...prev]);
      setNewRoomName("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Collab Platform</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user?.name}</span>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-xl font-medium mb-6">Interview rooms</h2>

        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createRoom()}
            placeholder="Room name..."
            className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={createRoom}
            disabled={loading || !newRoomName.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? "..." : "Create"}
          </button>
        </div>

        <div className="space-y-3">
          {rooms.length === 0 && (
            <p className="text-gray-500 text-sm">
              No rooms yet. Create one above.
            </p>
          )}

          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-5 py-4"
            >
              <div>
                <p className="font-medium text-sm">{room.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(room.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/room/${room.id}?role=candidate`)}
                  className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-2 rounded-lg transition-colors"
                >
                  Join as candidate
                </button>
                <button
                  onClick={() => navigate(`/room/${room.id}?role=interviewer`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg transition-colors"
                >
                  Join as interviewer
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
