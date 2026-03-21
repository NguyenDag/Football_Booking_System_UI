import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { StaffManagementPage } from './pages/StaffManagementPage';
import { StaffDetailPage } from './pages/StaffDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { FieldsPage } from './pages/FieldsPage';
import { StaffPage } from './pages/StaffPage';
import { BookingsPage } from './pages/BookingsPage';
import { BookFieldPage } from './pages/BookFieldPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { LandingPage } from './pages/LandingPage';
import { Toaster } from './components/ui/sonner';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
      />
      <Route
        path="/forgot-password"
        element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPasswordPage />}
      />
      <Route
        path="/reset-password"
        element={isAuthenticated ? <Navigate to="/" replace /> : <ResetPasswordPage />}
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          (user?.role === 'ADMIN' || user?.role === 'STAFF') ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Layout>
              <LandingPage />
            </Layout>
          )
        }
      />
      <Route
        path="/fields"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Layout>
              <FieldsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Layout>
              <StaffManagementPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/:id"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Layout>
              <StaffDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
            <Layout>
              <BookingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/statistics"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Layout>
              <StatisticsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/book-field"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <Layout>
              <BookFieldPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <Layout>
              <MyBookingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}
