import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Editor } from "./pages/Editor";
import { Game } from "./pages/Game";
import { Home } from "./pages/Home";
import { Games } from "./pages/Games";
import { Profile } from "./pages/Profile";
import { Favorites } from "./pages/Favorites";
import { Settings } from "./pages/Settings";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ToastContainer } from "./components/UI/Toast";

export default function App() {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games" element={<Games />} />
        <Route path="/play/:id" element={<Game />} />
        <Route
          path="/editor/:id"
          element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit/:id"
          element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
