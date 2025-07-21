import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home,
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Map,
  Calendar,
  Edit2,
  Trash2,
  Settings,
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  MapPin,
  Layers,
  Monitor,
  RefreshCw,
  Eye,
  X,
  Save,
  MoreHorizontal,
  Activity,
  TrendingUp,
  Zap,
  Wifi,
  Thermometer,
  Shield,
  Camera,
  Volume2,
  Lightbulb,
  Wind,
  Database,
  Key,
  LogIn,
  LogOut,
  AlertCircle,
  CheckSquare,
  Ban,
  Wrench
} from 'lucide-react';
import * as roomService from '../../services/roomService';

const RoomManagement = ({
  userRole = 'admin', // 'admin', 'receptionist'
  viewMode = 'grid', // 'grid', 'list', 'calendar'
  isModal = false,
  onClose = () => {},
  onRoomSelect = () => {},
  selectedDate = new Date(),
  height = '600px',
  showBookingModal = true
}) => {
  const queryClient = useQueryClient();
  
  // Estados locales
  const [activeView, setActiveView] = useState(viewMode);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Queries
  const { data: rooms, isLoading, refetch } = useQuery(
    ['rooms', { 
      search: searchTerm,
      status: statusFilter,
      type: typeFilter,
      floor: floorFilter
    }],
    () => roomService.getRooms({
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      floor: floorFilter !== 'all' ? floorFilter : undefined
    })
  );

  const { data: roomTypes } = useQuery('roomTypes', roomService.getRoomTypes);
  const { data: floors } = useQuery('floors', roomService.getFloors);
  const { data: usageStats } = useQuery('roomUsageStats', roomService.getRoomUsageStats);
  const { data: upcomingBookings } = useQuery('upcomingBookings', roomService.getUpcomingBookings);

  // Mutaciones
  const createRoomMutation = useMutation(roomService.createRoom, {
    onSuccess: () => {
      queryClient.invalidateQueries('rooms');
      setIsCreateModalOpen(false);
    }
  });

  const updateRoomMutation = useMutation(
    ({ id, data }) => roomService.updateRoom(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rooms');
        setIsEditModalOpen(false);
        setSelectedRoom(null);
      }
    }
  );

  const deleteRoomMutation = useMutation(roomService.deleteRoom, {
    onSuccess: () => {
      queryClient.invalidateQueries('rooms');
    }
  });

  const changeStatusMutation = useMutation(
    ({ roomId, status, reason }) => roomService.changeRoomStatus(roomId, status, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('rooms');
      }
    }
  );

  const bookRoomMutation = useMutation(roomService.bookRoom, {
    onSuccess: () => {
      queryClient.invalidateQueries('rooms');
      queryClient.invalidateQueries('upcomingBookings');
      setIsBookingModalOpen(false);
    }
  });

  // Handlers
  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    if (userRole === 'receptionist' && showBookingModal) {
      setIsBookingModalOpen(true);
    } else if (userRole === 'admin') {
      // Admin puede ver detalles
      onRoomSelect(room);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta sala?')) {
      try {
        await deleteRoomMutation.mutateAsync(roomId);
      } catch (error) {
        console.error('Error deleting room:', error);
      }
    }
  };

  const handleStatusChange = async (room, newStatus, reason = '') => {
    try {
      await changeStatusMutation.mutateAsync({
        roomId: room.id,
        status: newStatus,
        reason
      });
    } catch (error) {
      console.error('Error changing room status:', error);
    }
  };

  // Funciones auxiliares
  const getRoomStatusColor = (status) => {
    const colors = {
      'available': 'bg-green-500',
      'occupied': 'bg-blue-500',
      'maintenance': 'bg-yellow-500',
      'out_of_service': 'bg-red-500',
      'cleaning': 'bg-purple-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getRoomStatusLabel = (status) => {
    const labels = {
      'available': 'Disponible',
      'occupied': 'Ocupada',
      'maintenance': 'Mantenimiento',
      'out_of_service': 'Fuera de Servicio',
      'cleaning': 'Limpieza'
    };
    return labels[status] || status;
  };

  const getRoomTypeIcon = (type) => {
    const icons = {
      'consultation': <Users className="w-5 h-5" />,
      'emergency': <AlertTriangle className="w-5 h-5" />,
      'surgery': <Activity className="w-5 h-5" />,
      'laboratory': <Database className="w-5 h-5" />,
      'radiology': <Monitor className="w-5 h-5" />,
      'pharmacy': <Shield className="w-5 h-5" />,
      'waiting': <Clock className="w-5 h-5" />,
      'office': <Home className="w-5 h-5" />
    };
    return icons[type] || <Home className="w-5 h-5" />;
  };

  const canModifyRoom = (room) => {
    if (userRole === 'admin') return true;
    return false; // receptionist can only view and book
  };

  // Filtrar salas
  const filteredRooms = rooms?.filter(room => {
    if (statusFilter !== 'all' && room.status !== statusFilter) return false;
    if (typeFilter !== 'all' && room.type !== typeFilter) return false;
    if (floorFilter !== 'all' && room.floor_id !== parseInt(floorFilter)) return false;
    if (searchTerm) {
      return room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             room.location.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  }) || [];

  // Componente RoomCard
  const RoomCard = ({ room, className = "" }) => {
    const canModify = canModifyRoom(room);
    const statusColor = getRoomStatusColor(room.status);
    const typeIcon = getRoomTypeIcon(room.type);
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className={`
          bg-white rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer
          ${room.status === 'available' ? 'border-green-200' : 
            room.status === 'occupied' ? 'border-blue-200' :
            room.status === 'maintenance' ? 'border-yellow-200' : 
            'border-red-200'}
          ${className}
        `}
        onClick={() => handleRoomClick(room)}
      >
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
              <h3 className="font-semibold text-gray-900">{room.name}</h3>
            </div>
            
            {canModify && (
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRoom(room);
                    setIsEditModalOpen(true);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRoom(room.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            {typeIcon}
            <span className="capitalize">{room.type.replace('_', ' ')}</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Location */}
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{room.location}</span>
          </div>
          
          {/* Floor */}
          <div className="flex items-center space-x-2 text-sm">
            <Layers className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Piso {room.floor_name}</span>
          </div>
          
          {/* Capacity */}
          <div className="flex items-center space-x-2 text-sm">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Capacidad: {room.capacity} personas</span>
          </div>
          
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              room.status === 'available' ? 'bg-green-100 text-green-800' :
              room.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
              room.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {getRoomStatusLabel(room.status)}
            </span>
            
            {room.current_booking && (
              <div className="text-xs text-gray-500">
                Hasta {new Date(room.current_booking.end_time).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>
          
          {/* Equipment indicators */}
          {room.equipment && room.equipment.length > 0 && (
            <div className="flex items-center space-x-1 pt-2 border-t">
              <Settings className="w-4 h-4 text-gray-400" />
              <div className="flex space-x-1">
                {room.equipment.slice(0, 4).map((eq, idx) => (
                  <span key={idx} className="w-2 h-2 bg-blue-400 rounded-full" title={eq.name}></span>
                ))}
                {room.equipment.length > 4 && (
                  <span className="text-xs text-gray-500">+{room.equipment.length - 4}</span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Actions Footer */}
        <div className="p-3 border-t bg-gray-50 flex justify-between">
          <div className="flex space-x-2">
            {userRole === 'receptionist' && room.status === 'available' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRoom(room);
                  setIsBookingModalOpen(true);
                }}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Reservar
              </button>
            )}
            
            {canModify && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRoom(room);
                    setIsEquipmentModalOpen(true);
                  }}
                  className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                >
                  Equipamiento
                </button>
                
                {room.status === 'available' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(room, 'maintenance', 'Mantenimiento programado');
                    }}
                    className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                  >
                    Mantenimiento
                  </button>
                )}
              </>
            )}
          </div>
          
          <span className="text-xs text-gray-500">
            ID: {room.id}
          </span>
        </div>
      </motion.div>
    );
  };

  // Vista Grid
  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <AnimatePresence>
        {filteredRooms.map((room) => (
          <RoomCard key={room.id} room={room} className="group" />
        ))}
      </AnimatePresence>
    </div>
  );

  // Vista List
  const ListView = () => (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sala
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ubicación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Capacidad
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <AnimatePresence>
              {filteredRooms.map((room) => (
                <motion.tr
                  key={room.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRoomClick(room)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${getRoomStatusColor(room.status)} mr-3`}></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{room.name}</div>
                        <div className="text-sm text-gray-500">ID: {room.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRoomTypeIcon(room.type)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {room.type.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{room.location}</div>
                    <div className="text-sm text-gray-500">Piso {room.floor_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      room.status === 'available' ? 'bg-green-100 text-green-800' :
                      room.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                      room.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getRoomStatusLabel(room.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {room.capacity} personas
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {userRole === 'receptionist' && room.status === 'available' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRoom(room);
                            setIsBookingModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Reservar
                        </button>
                      )}
                      
                      {canModifyRoom(room) && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRoom(room);
                              setIsEditModalOpen(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRoom(room.id);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderView = () => {
    switch (activeView) {
      case 'grid':
        return <GridView />;
      case 'list':
        return <ListView />;
      case 'calendar':
        // TODO: Implementar vista calendario
        return <GridView />;
      default:
        return <GridView />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border h-full flex flex-col" style={{ height }}>
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Home className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Gestión de Salas
              </h2>
              <p className="text-sm text-gray-500">
                {userRole === 'admin' && 'Administración completa de facilities'}
                {userRole === 'receptionist' && 'Consulta y reserva de salas'}
              </p>
            </div>
          </div>
          
          {isModal && (
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar salas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveView('grid')}
                className={`px-3 py-1 text-sm rounded ${
                  activeView === 'grid' 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveView('list')}
                className={`px-3 py-1 text-sm rounded ${
                  activeView === 'list' 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 text-sm rounded-lg flex items-center space-x-1 ${
                showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
            </button>
            
            <button
              onClick={() => refetch()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            {userRole === 'admin' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Sala</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="available">Disponible</option>
                  <option value="occupied">Ocupada</option>
                  <option value="maintenance">Mantenimiento</option>
                  <option value="out_of_service">Fuera de Servicio</option>
                </select>
                
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los tipos</option>
                  {roomTypes?.map((type) => (
                    <option key={type.id} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                
                <select
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los pisos</option>
                  {floors?.map((floor) => (
                    <option key={floor.id} value={floor.id}>
                      Piso {floor.name}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setFloorFilter('all');
                    setSearchTerm('');
                  }}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                >
                  Limpiar Filtros
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Home className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay salas</h3>
            <p className="text-gray-500 text-center">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || floorFilter !== 'all'
                ? 'No se encontraron salas con los filtros aplicados'
                : 'No hay salas registradas en el sistema'
              }
            </p>
          </div>
        ) : (
          renderView()
        )}
      </div>
      
      {/* Stats Footer */}
      {usageStats && (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Home className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">
                  {filteredRooms.length} salas
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">
                  {filteredRooms.filter(r => r.status === 'available').length} disponibles
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-gray-600">
                  {filteredRooms.filter(r => r.status === 'maintenance').length} en mantenimiento
                </span>
              </div>
              
              {usageStats.occupancy_rate && (
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-600">
                    {usageStats.occupancy_rate}% ocupación promedio
                  </span>
                </div>
              )}
            </div>
            
            {upcomingBookings && upcomingBookings.length > 0 && (
              <div className="text-sm text-gray-500">
                {upcomingBookings.length} reservas próximas
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;

