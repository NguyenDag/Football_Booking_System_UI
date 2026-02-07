import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { FieldsPage } from './pages/FieldsPage';
import { BookingsPage } from './pages/BookingsPage';
import { BookFieldPage } from './pages/BookFieldPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { StaffPage } from './pages/StaffPage';
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
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
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
              <StaffPage />
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
