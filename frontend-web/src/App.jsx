import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import NewAppointment from './pages/NewAppointment';
import AppointmentDetails from './pages/AppointmentDetails';
import MedicalHistory from './pages/MedicalHistory';
import Prescriptions from './pages/Prescriptions';
import Profile from './pages/Profile';
import AuthLayout from './components/layout/AuthLayout';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';

// Configurar React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Componente para rutas protegidas
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
};

// Componente para rutas públicas (redirige si ya está autenticado)
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return !token ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}>
            <div className="min-h-screen bg-gray-50">
              <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  style: {
                    background: '#10b981',
                  },
                },
                error: {
                  style: {
                    background: '#ef4444',
                  },
                },
              }}
            />
            
            <Routes>
              {/* Ruta raíz - redirige a login o dashboard */}
              <Route path="/" element={<Navigate to="/login" />} />
              
              {/* Rutas públicas */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <AuthLayout>
                      <LoginForm />
                    </AuthLayout>
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <AuthLayout>
                      <RegisterForm />
                    </AuthLayout>
                  </PublicRoute>
                } 
              />
              
              {/* Rutas protegidas */}
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/appointments" 
                element={
                  <PrivateRoute>
                    <Appointments />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/appointments/new" 
                element={
                  <PrivateRoute>
                    <NewAppointment />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/appointments/:id" 
                element={
                  <PrivateRoute>
                    <AppointmentDetails />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/medical-history" 
                element={
                  <PrivateRoute>
                    <MedicalHistory />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/prescriptions" 
                element={
                  <PrivateRoute>
                    <Prescriptions />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } 
              />
              
              {/* Ruta para páginas no encontradas */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
}

export default App;
