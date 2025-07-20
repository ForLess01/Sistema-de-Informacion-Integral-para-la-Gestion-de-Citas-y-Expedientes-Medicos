import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import MedicalDashboard from './pages/MedicalDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import NurseDashboard from './pages/NurseDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard';
import EmergencyDashboard from './pages/EmergencyDashboard';
import ObstetrizDashboard from './pages/ObstetrizDashboard';
import OdontologoDashboard from './pages/OdontologoDashboard';
import MedicalRecordManager from './components/medical/MedicalRecordManager';
import PharmacyManager from './components/pharmacy/PharmacyManager';
import EmergencyManager from './components/emergency/EmergencyManager';
import AppointmentManager from './components/appointments/AppointmentManager';
import LoginForm from './components/auth/LoginForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const queryClient = new QueryClient();

// Componente para redirección automática basada en rol
const RoleBasedRedirect = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirección basada en el rol del usuario
  switch (user.role) {
    case 'doctor':
      return <Navigate to="/doctor-dashboard" replace />;
    case 'nurse':
      return <Navigate to="/nurse-dashboard" replace />;
    case 'admin':
    case 'receptionist':
      return <Navigate to="/admin-dashboard" replace />;
    case 'pharmacist':
      return <Navigate to="/pharmacy-dashboard" replace />;
    case 'emergency':
      return <Navigate to="/emergency-dashboard" replace />;
    case 'obstetriz':
      return <Navigate to="/obstetriz-dashboard" replace />;
    case 'odontologo':
      return <Navigate to="/odontologo-dashboard" replace />;
    default:
      // Dashboard general como fallback
      return <Navigate to="/general-dashboard" replace />;
  }
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-900 text-white">
            <Routes>
              {/* Ruta de login (no protegida) */}
              <Route path="/login" element={<LoginForm onLoginSuccess={() => {}} />} />
              
              {/* Redirección automática basada en rol */}
              <Route path="/" element={<RoleBasedRedirect />} />
              
              {/* Dashboards específicos por rol */}
              <Route path="/doctor-dashboard" element={
                <ProtectedRoute requiredRoles={['doctor']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/nurse-dashboard" element={
                <ProtectedRoute requiredRoles={['nurse']}>
                  <NurseDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin-dashboard" element={
                <ProtectedRoute requiredRoles={['admin', 'receptionist']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/pharmacy-dashboard" element={
                <ProtectedRoute requiredRoles={['pharmacist']}>
                  <PharmacyDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/emergency-dashboard" element={
                <ProtectedRoute requiredRoles={['emergency']}>
                  <EmergencyDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/obstetriz-dashboard" element={
                <ProtectedRoute requiredRoles={['obstetriz']}>
                  <ObstetrizDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/odontologo-dashboard" element={
                <ProtectedRoute requiredRoles={['odontologo']}>
                  <OdontologoDashboard />
                </ProtectedRoute>
              } />
              
              {/* Dashboard general como fallback */}
              <Route path="/general-dashboard" element={
                <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'emergency', 'obstetriz', 'odontologo']}>
                  <MedicalDashboard />
                </ProtectedRoute>
              } />
              
              {/* Rutas funcionales existentes */}
              <Route path="/appointments" element={
                <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse', 'receptionist']}>
                  <AppointmentManager />
                </ProtectedRoute>
              } />
              
              <Route path="/medical-records" element={
                <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse']}>
                  <MedicalRecordManager />
                </ProtectedRoute>
              } />
              
              <Route path="/pharmacy" element={
                <ProtectedRoute requiredRoles={['admin', 'pharmacist']}>
                  <PharmacyManager />
                </ProtectedRoute>
              } />
              
              <Route path="/emergency" element={
                <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse', 'emergency']}>
                  <EmergencyManager />
                </ProtectedRoute>
              } />
              
              {/* Rutas de compatibilidad para redirección */}
              <Route path="/obstetriz" element={<Navigate to="/obstetriz-dashboard" replace />} />
              <Route path="/odontologo" element={<Navigate to="/odontologo-dashboard" replace />} />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;