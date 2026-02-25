import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import Lottie from "lottie-react";
import loadingAnimation from "../public/Lottie/Loading.json";

import Navbar from "./components/Navbar";
import { AdminDataProvider } from "./context/AdminDataContext";
import { getAdminTokenFor, getAdminUserFor, setActiveAdminRole } from "./utils/adminAuth";



const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const SubmitResult = lazy(() => import("./components/SubmitResult"));
const GallerySection = lazy(() => import("./components/GallerySection"));
const SuperAdminDashboard = lazy(() => import("./pages/admin/SuperAdminDashboard"));
const SuperQuickActionsPage = lazy(() => import("./pages/admin/SuperQuickActionsPage"));
const VillageAdminDashboard = lazy(() => import("./pages/admin/VillageAdminDashboard"));
const VillageResultDetail = lazy(() => import("./pages/admin/VillageResultDetail"));
const SuperResultDetail = lazy(() => import("./pages/admin/SuperResultDetail"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));



// Embedding the JSON directly to avoid fetch/path issues


function AppLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[radial-gradient(circle_at_top,_#fff8ea_0%,_#fff2d8_45%,_#f8e8cf_100%)]">
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80">
        <Lottie animationData={loadingAnimation} loop className="w-full h-full" />
        <p className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-xs sm:text-sm tracking-[0.18em] font-semibold text-[#7a1f1f]/80">
          Dholakiya Parivar
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith("/admin");
  const [booting, setBooting] = useState(() => !window.location.pathname.startsWith("/admin"));

  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return;
    const timer = setTimeout(() => setBooting(false), 450);
    return () => clearTimeout(timer);
  }, []);

  // Admin route guard: require login + role
  const AdminRoute = ({ allow, children }) => {
    const role = allow[0];
    const token = getAdminTokenFor(role);
    const user = getAdminUserFor(role);
    if (!token || !user?.role) return <Navigate to="/admin/login" replace />;
    if (!allow.includes(user.role)) return <Navigate to="/admin/login" replace />;
    // Pin active role for admin session
    setActiveAdminRole(role);
    return children;
  };

  if (booting) return <AppLoader />;

  return (
    <AdminDataProvider>
      {!hideNavbar && <Navbar />}

      <main className={hideNavbar ? "" : "pt-16 md:pt-[72px]"}>
        <Suspense fallback={<AppLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/SubmitResult" element={<SubmitResult />} />
            <Route path="/GallerySection" element={<GallerySection />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/super"
              element={
                <AdminRoute allow={["super_admin"]}>
                  <SuperAdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/super/submit-result"
              element={
                <AdminRoute allow={["super_admin"]}>
                  <SubmitResult adminModeRole="super_admin" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/super/result/:id"
              element={
                <AdminRoute allow={["super_admin"]}>
                  <SuperResultDetail />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/super/actions"
              element={
                <AdminRoute allow={["super_admin"]}>
                  <SuperQuickActionsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/village"
              element={
                <AdminRoute allow={["village_admin"]}>
                  <VillageAdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/village/submit-result"
              element={
                <AdminRoute allow={["village_admin"]}>
                  <SubmitResult adminModeRole="village_admin" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/village/result/:id"
              element={
                <AdminRoute allow={["village_admin"]}>
                  <VillageResultDetail />
                </AdminRoute>
              }
            />
          </Routes>
        </Suspense>
      </main>
    </AdminDataProvider>
  );
}
