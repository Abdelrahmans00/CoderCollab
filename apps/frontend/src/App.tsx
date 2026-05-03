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
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
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