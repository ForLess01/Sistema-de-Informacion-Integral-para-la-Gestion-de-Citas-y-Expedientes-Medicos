import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import MedicalDashboard from './pages/MedicalDashboard';
import MedicalRecordManager from './components/medical/MedicalRecordManager';
import PharmacyManager from './components/pharmacy/PharmacyManager';
import EmergencyManager from './components/emergency/EmergencyManager';
import AppointmentManager from './components/appointments/AppointmentManager';
import LoginForm from './components/auth/LoginForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-900 text-white">
            <Routes>
              {/* Ruta de login (no protegida) */}
              <Route path="/login" element={<LoginForm onLoginSuccess={() => {}} />} />
              
              {/* Rutas protegidas para personal médico */}
              <Route path="/" element={
                <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist']}>
                  <MedicalDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/appointments" element={
                <ProtectedRoute requiredRoles={['admin', 'doctor', 'receptionist']}>
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
                <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse']}>
                  <EmergencyManager />
                </ProtectedRoute>
              } />
              
              {/* Agrega más rutas según sea necesario */}
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;