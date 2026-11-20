import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import SmoothScroll from "./components/SmoothScroll.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import ServerWakeBanner from "./components/ServerWakeBanner.jsx";
import { ProtectedRoute, ModeratorRoute } from "./components/ProtectedRoute.jsx";
import { PageSkeleton } from "./components/ui/feedback.jsx";
import { useI18n } from "./i18n/index.jsx";
import Home from "./pages/Home.jsx";

const Discover = lazy(() => import("./pages/Discover.jsx"));
const ContentDetail = lazy(() => import("./pages/ContentDetail.jsx"));
const Upload = lazy(() => import("./pages/Upload.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const Leaderboard = lazy(() => import("./pages/Leaderboard.jsx"));
const Resources = lazy(() => import("./pages/Resources.jsx"));
const Admin = lazy(() => import("./pages/Admin.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

export default function App() {
  const { pathname } = useLocation();
  const { t } = useI18n();
  return (
    <div className="flex min-h-[100dvh] flex-col overflow-x-clip">
      <SmoothScroll />
      <a href="#main" className="sr-only z-[200] rounded-full bg-accent px-4 py-2 text-accent-ink focus:not-sr-only focus:absolute focus:start-4 focus:top-4">{t("common.skip")}</a>
      <Navbar />
      <ServerWakeBanner />
      <main id="main" className="flex-1">
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<PageSkeleton />}>
            <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/content/:slug" element={<ContentDetail />} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/admin" element={<ModeratorRoute><Admin /></ModeratorRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </motion.div>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
