import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

const ProtectedRoute = ({ children, requiredRoles = [], requiredSpecialty = null }) => {
  const { isAuthenticated, user, loading, hasRole, canAccessSpecialty } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Verificando autenticación...</p>
        </motion.div>
      </div>
    );
  }

  // Redirigir al login si no está autenticado
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar roles requeridos
  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-white/20 text-center max-w-md"
        >
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Acceso Denegado</h2>
          <p className="text-gray-400 mb-4">
            No tienes permisos para acceder a esta sección del sistema.
          </p>
          <p className="text-sm text-gray-500">
            Rol actual: <span className="font-medium text-gray-300">{getRoleName(user.role)}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Volver
          </button>
        </motion.div>
      </div>
    );
  }

  // Verificar acceso a especialidad específica
  if (requiredSpecialty && !canAccessSpecialty(requiredSpecialty)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-white/20 text-center max-w-md"
        >
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Especialidad Restringida</h2>
          <p className="text-gray-400 mb-4">
            No tienes permisos para acceder a esta especialidad médica.
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Volver
          </button>
        </motion.div>
      </div>
    );
  }

  // Renderizar el componente protegido
  return children;
};

// Función auxiliar para obtener el nombre del rol en español
const getRoleName = (role) => {
  const roleNames = {
    'admin': 'Administrador',
    'doctor': 'Doctor',
    'nurse': 'Enfermero/a',
    'pharmacist': 'Farmacéutico',
    'receptionist': 'Recepcionista',
    'patient': 'Paciente',
    'obstetriz': 'Obstetriz',
    'odontologo': 'Odontólogo',
    'emergency': 'Personal de Emergencia'
  };
  return roleNames[role] || role;
};

export default ProtectedRoute;
