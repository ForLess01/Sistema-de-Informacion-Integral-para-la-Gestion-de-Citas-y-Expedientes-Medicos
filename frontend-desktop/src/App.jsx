import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context and Authentication
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import LoginForm from './components/Auth/LoginForm';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import MedicalDashboard from './components/Dashboard/MedicalDashboard';
import AppointmentManager from './components/Appointments/AppointmentManager';
import MedicalRecordManager from './components/MedicalRecords/MedicalRecordManager';
import PharmacyManager from './components/Pharmacy/PharmacyManager';
import EmergencyManager from './components/Emergency/EmergencyManager';

// Configure React Query Client with recommended settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Login Route Component - handles authentication state
function LoginRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginForm />;
}

// App Routes Component - contains all protected routes
function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginRoute />} />
      
      {/* Protected Routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'doctor', 'staff', 'pharmacy']}>
            <MedicalDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/appointments" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'doctor', 'staff']}>
            <AppointmentManager />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/medical-records/:patientId?" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'doctor']}>
            <MedicalRecordManager />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/pharmacy" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'pharmacy']}>
            <PharmacyManager />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/emergency" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'doctor', 'staff']}>
            <EmergencyManager />
          </ProtectedRoute>
        } 
      />
      
      {/* Catch all route - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// Main App Component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
            
            {/* Toast notifications */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
