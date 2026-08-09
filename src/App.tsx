import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthGuard from "./components/AuthGuard";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import StatusPage from "./pages/StatusPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public status/health check */}
        <Route path="/status" element={<StatusPage />} />

        {/* Public auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <div className="flex min-h-screen flex-col bg-page transition-colors duration-200">
                <Header />
                <main className="flex-1">
                  <DashboardPage />
                </main>
                <Footer />
              </div>
            </AuthGuard>
          }
        />
        <Route
          path="/history"
          element={
            <AuthGuard>
              <div className="flex min-h-screen flex-col bg-page transition-colors duration-200">
                <Header />
                <main className="flex-1">
                  <HistoryPage />
                </main>
                <Footer />
              </div>
            </AuthGuard>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}