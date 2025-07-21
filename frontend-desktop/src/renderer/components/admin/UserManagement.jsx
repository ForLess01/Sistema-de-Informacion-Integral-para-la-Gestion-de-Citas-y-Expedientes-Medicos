import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  Edit2,
  Trash2,
  Eye,
  MoreVertical,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Key,
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  Clock,
  Download
} from 'lucide-react';
import * as userService from '../../services/userService';

const UserManagement = () => {
  const queryClient = useQueryClient();
  
  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const itemsPerPage = 12;

  // Queries para obtener datos
  const { data: usersData, isLoading, error, refetch } = useQuery(
    ['users', { 
      page: currentPage, 
      limit: itemsPerPage, 
      search: searchTerm,
      role: roleFilter,
      status: statusFilter
    }],
    () => userService.getUsers({
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm,
      role: roleFilter !== 'all' ? roleFilter : undefined,
      is_active: statusFilter !== 'all' ? statusFilter === 'active' : undefined
    }),
    { 
      keepPreviousData: true,
      refetchInterval: 60000 // Refrescar cada minuto
    }
  );

  const { data: rolesData } = useQuery('roles', userService.getRoles);
  const { data: statsData } = useQuery('userStats', userService.getUserStats);

  // Mutaciones
  const toggleStatusMutation = useMutation(userService.toggleUserStatus, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      queryClient.invalidateQueries('userStats');
    }
  });

  const deleteUserMutation = useMutation(userService.deleteUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      queryClient.invalidateQueries('userStats');
    }
  });

  const resetPasswordMutation = useMutation(userService.resetUserPassword, {
    onSuccess: () => {
      // Mostrar notificación de éxito
    }
  });

  // Funciones auxiliares
  const getRoleIcon = (role) => {
    const icons = {
      'admin': <Shield className="w-4 h-4 text-red-500" />,
      'doctor': <ShieldCheck className="w-4 h-4 text-blue-500" />,
      'nurse': <UserCheck className="w-4 h-4 text-green-500" />,
      'pharmacy': <Settings className="w-4 h-4 text-purple-500" />,
      'emergency': <AlertCircle className="w-4 h-4 text-orange-500" />,
      'receptionist': <Users className="w-4 h-4 text-indigo-500" />
    };
    return icons[role] || <Users className="w-4 h-4 text-gray-500" />;
  };

  const getRoleBadge = (role) => {
    const styles = {
      'admin': 'bg-red-100 text-red-800',
      'doctor': 'bg-blue-100 text-blue-800',
      'nurse': 'bg-green-100 text-green-800',
      'pharmacy': 'bg-purple-100 text-purple-800',
      'emergency': 'bg-orange-100 text-orange-800',
      'receptionist': 'bg-indigo-100 text-indigo-800'
    };
    return styles[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role) => {
    const labels = {
      'admin': 'Administrador',
      'doctor': 'Médico',
      'nurse': 'Enfermero/a',
      'pharmacy': 'Farmacéutico',
      'emergency': 'Emergencias',
      'receptionist': 'Recepcionista'
    };
    return labels[role] || role;
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handlers
  const handleToggleStatus = async (userId) => {
    try {
      await toggleStatusMutation.mutateAsync(userId);
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario? Esta acción no se puede deshacer.')) {
      try {
        await deleteUserMutation.mutateAsync(userId);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleResetPassword = async (userId) => {
    if (window.confirm('¿Está seguro de que desea restablecer la contraseña de este usuario?')) {
      try {
        await resetPasswordMutation.mutateAsync(userId);
        alert('Contraseña restablecida exitosamente. Se ha enviado la nueva contraseña al correo del usuario.');
      } catch (error) {
        console.error('Error resetting password:', error);
      }
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600">Cargando usuarios...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar</h3>
            <p className="text-gray-600 mb-4">No se pudieron cargar los usuarios</p>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const users = usersData?.data || [];
  const totalPages = usersData?.pagination?.totalPages || 1;
  const totalUsers = usersData?.pagination?.total || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <Users className="w-8 h-8 mr-3 text-blue-600" />
                Gestión de Usuarios
              </h1>
              <p className="text-gray-600">Administra los usuarios del sistema</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => refetch()}
                className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Actualizar</span>
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
              >
                <UserPlus className="w-4 h-4" />
                <span>Nuevo Usuario</span>
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          {statsData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                    <p className="text-2xl font-bold text-gray-900">{statsData.total}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                    <p className="text-2xl font-bold text-green-600">{statsData.active}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Usuarios Inactivos</p>
                    <p className="text-2xl font-bold text-red-600">{statsData.inactive}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <UserX className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conectados Hoy</p>
                    <p className="text-2xl font-bold text-purple-600">{statsData.todayLogins}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, email, usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtro de Rol */}
            <div className="lg:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los roles</option>
                {rolesData?.map(role => (
                  <option key={role.id} value={role.value}>
                    {getRoleLabel(role.value)}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Estado */}
            <div className="lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>

            <button
              onClick={resetFilters}
              className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              Limpiar filtros
            </button>
          </div>

          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-600">
              {totalUsers} usuario{totalUsers !== 1 ? 's' : ''} encontrado{totalUsers !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Lista de Usuarios */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios</h3>
              <p className="text-gray-500">No se encontraron usuarios con los filtros aplicados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
              <AnimatePresence>
                {users.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-6 border border-gray-100 hover:shadow-lg transition-all duration-200"
                  >
                    {/* Avatar y Estado */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                          {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className={`w-3 h-3 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={() => {/* Menú contextual */}}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Información del Usuario */}
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {user.first_name} {user.last_name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">@{user.username}</p>
                      
                      {/* Role Badge */}
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(user.role)}`}>
                        <span className="mr-1">{getRoleIcon(user.role)}</span>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>

                    {/* Información de Contacto */}
                    <div className="space-y-2 mb-4">
                      {user.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-3 h-3 mr-2" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-3 h-3 mr-2" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {user.last_login && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-3 h-3 mr-2" />
                          <span className="truncate">{formatDateTime(user.last_login)}</span>
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        Ver
                      </button>
                      
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                          user.is_active 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                        disabled={toggleStatusMutation.isLoading}
                      >
                        {user.is_active ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className="px-3 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium"
                        disabled={resetPasswordMutation.isLoading}
                      >
                        <Key className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando{' '}
                    <span className="font-medium">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>{' '}
                    a{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, totalUsers)}
                    </span>{' '}
                    de{' '}
                    <span className="font-medium">{totalUsers}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginación">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                      if (page > totalPages) return null;
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal de Detalles de Usuario */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Detalles del Usuario</h3>
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Información Personal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre Completo
                      </label>
                      <p className="text-sm text-gray-900">{selectedUser.first_name} {selectedUser.last_name}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Usuario
                      </label>
                      <p className="text-sm text-gray-900">@{selectedUser.username}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <p className="text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <p className="text-sm text-gray-900">{selectedUser.phone || 'N/D'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rol
                      </label>
                      <div className="flex items-center">
                        {getRoleIcon(selectedUser.role)}
                        <span className="ml-2 text-sm text-gray-900">{getRoleLabel(selectedUser.role)}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        selectedUser.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Creación
                      </label>
                      <p className="text-sm text-gray-900">{formatDateTime(selectedUser.date_joined)}</p>
                    </div>
                    
                    {selectedUser.last_login && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Último Acceso
                        </label>
                        <p className="text-sm text-gray-900">{formatDateTime(selectedUser.last_login)}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4 mt-8">
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cerrar
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedUser(selectedUser);
                      setIsDetailsModalOpen(false);
                      setIsEditModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Editar Usuario
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
