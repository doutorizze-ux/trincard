import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import ProtectedRoute from './components/ProtectedRoute';
import { PageLoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy load components for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const PartnersPage = lazy(() => import('./pages/PartnersPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const PublicCardPage = lazy(() => import('./pages/PublicCardPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <ErrorBoundary>
            <Suspense fallback={<PageLoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/cadastro" element={<RegisterPage />} />
                <Route path="/parceiros" element={<PartnersPage />} />
                <Route path="/cartao/:barcode" element={<PublicCardPage />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/perfil" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/assinatura" element={
                  <ProtectedRoute>
                    <SubscriptionPage />
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly>
                    <AdminPage />
                  </ProtectedRoute>
                } />

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#333',
                border: '1px solid #e5e7eb',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
