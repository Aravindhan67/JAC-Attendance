import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import LogoLoading from './components/LogoLoading';
import ErrorBoundary from './components/ErrorBoundary';

// Resilient dynamic import that auto-reloads if a new deployment changed the chunk hashes
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const hasRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-chunk-refresh') || 'false'
    );
    try {
      const module = await componentImport();
      window.sessionStorage.setItem('page-chunk-refresh', 'false');
      return module;
    } catch (err) {
      if (!hasRefreshed) {
        window.sessionStorage.setItem('page-chunk-refresh', 'true');
        window.location.reload();
        return new Promise(() => {}); // Wait for reload
      }
      throw err;
    }
  });

// Lazy-loaded route chunks with deployment recovery
const Login = lazyWithRetry(() => import('./pages/Login'));
const EmployeeDashboard = lazyWithRetry(() => import('./pages/EmployeeDashboard'));
const MyAttendance = lazyWithRetry(() => import('./pages/MyAttendance'));
const MyLeaves = lazyWithRetry(() => import('./pages/MyLeaves'));
const MyTasks = lazyWithRetry(() => import('./pages/MyTasks'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'));
const AdminAttendance = lazyWithRetry(() => import('./pages/AdminAttendance'));
const AdminLeaves = lazyWithRetry(() => import('./pages/AdminLeaves'));
const AdminEmployees = lazyWithRetry(() => import('./pages/AdminEmployees'));
const AdminTasks = lazyWithRetry(() => import('./pages/AdminTasks'));

// Protected Route Wrapper
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <LogoLoading message="Initializing JAC MediaLand Portal..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F1EDE4] flex flex-col selection:bg-[#C25E37] selection:text-[#FAF6EE]">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-full overflow-hidden pb-28 md:pb-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LogoLoading message="Loading workspace..." />}>
            <Routes>
              {/* Public Auth Route */}
              <Route path="/login" element={<Login />} />

              {/* Employee Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <MyTasks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-attendance"
                element={
                  <ProtectedRoute>
                    <MyAttendance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-leaves"
                element={
                  <ProtectedRoute>
                    <MyLeaves />
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

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tasks"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminTasks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/attendance"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminAttendance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/leaves"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminLeaves />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/employees"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminEmployees />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

