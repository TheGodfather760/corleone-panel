import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { SettingsProvider, useSettings } from "./lib/SettingsContext";
import { NotifProvider } from "./lib/NotifContext";
import { UpdateProvider } from "./lib/UpdateContext";
import AppLayout from "./components/AppLayout";
import NotificationPoller from "./components/NotificationPoller";
import IntroScreen from "./components/IntroScreen";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import EventsPage from "./pages/EventsPage";
import DownloadsPage from "./pages/DownloadsPage";
import MediaPage from "./pages/MediaPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/admin/AdminPage";

function DashboardWrapper() {
  const navigate = useNavigate();
  return <DashboardPage onNavigate={(page) => navigate(`/${page}`)} />;
}

function AdminGuard({ children }) {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role !== "admin" && user.role !== "moderator") return <Navigate to="/dashboard" replace />;
  return children;
}

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-primary)" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const transition = settings.animationsEnabled
    ? { duration: 0.18, ease: "easeOut" }
    : { duration: 0 };

  const variants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit:    { opacity: 0, y: -8 },
  };

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname} variants={variants} initial="initial" animate="animate" exit="exit" transition={transition} style={{ height: "100%" }}>
          <Routes location={location}>
            <Route path="/dashboard"  element={<DashboardWrapper />} />
            <Route path="/profile"    element={<ProfilePage />} />
            <Route path="/events"     element={<EventsPage />} />
            <Route path="/downloads"  element={<DownloadsPage />} />
            <Route path="/media"      element={<MediaPage />} />
            <Route path="/settings"   element={<SettingsPage />} />
            <Route path="/admin"        element={<AdminGuard><AdminPage /></AdminGuard>} />
            <Route path="*"           element={<Navigate to={`/${settings.startPage}`} replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <NotifProvider>
          <UpdateProvider>
            <BrowserRouter>
              <NotificationPoller />
              <AppWithIntro />
            </BrowserRouter>
          </UpdateProvider>
        </NotifProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

function AppWithIntro() {
  const { settings } = useSettings();
  const [introDone, setIntroDone] = useState(settings.skipIntro);

  return (
    <>
      {!introDone && <IntroScreen onDone={() => setIntroDone(true)} />}
      <Routes>
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </>
  );
}
