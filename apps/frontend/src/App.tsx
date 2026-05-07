import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Dashboard from "./pages/Dashboard";
import InterviewPage from "./pages/InterviewPage";
import SessionPage from "./pages/SessionPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Room from "./pages/Room";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrating = useAuthStore((s) => s.isHydrating);

  if (isHydrating) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#05050a",
          color: "rgba(255,255,255,0.6)",
          fontSize: "14px",
        }}
      >
        Checking your session...
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const hydrateAuth = useAuthStore((s) => s.hydrateAuth);

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public — visible to everyone */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/session" element={<SessionPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Private — requires login */}
        <Route
          path="/room/:roomId"
          element={
            <PrivateRoute>
              <Room />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}