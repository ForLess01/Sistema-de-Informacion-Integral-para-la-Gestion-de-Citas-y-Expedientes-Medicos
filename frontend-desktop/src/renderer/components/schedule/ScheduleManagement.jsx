import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Copy,
  RefreshCw,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  User,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  Settings,
  Download,
  Upload,
  Grid3X3,
  List,
  Eye,
  EyeOff,
  MoreHorizontal,
  Repeat,
  Ban,
  CheckSquare,
  Activity,
  TrendingUp,
  MapPin,
  Stethoscope,
  Zap
} from 'lucide-react';
import * as scheduleService from '../../services/scheduleService';

const ScheduleManagement = ({
  userRole = 'admin', // 'admin', 'doctor', 'receptionist'
  currentUserId = null,
  viewMode = 'calendar', // 'calendar', 'grid', 'list'
  isModal = false,
  onClose = () => {},
  selectedDate = new Date(),
  height = '600px'
}) => {
  const queryClient = useQueryClient();
  
  // Estados locales
  const [currentDate, setCurrentDate] = useState(new Date(selectedDate));
  const [activeView, setActiveView] = useState(viewMode);
  const [selectedDoctor, setSelectedDoctor] = useState(userRole === 'doctor' ? currentUserId : 'all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [showConflicts, setShowConflicts] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [draggedSchedule, setDraggedSchedule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [isBlockTimeModalOpen, setIsBlockTimeModalOpen] = useState(false);

  // Calcular rango de fechas para la vista actual
  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    
    switch (activeView) {
      case 'calendar':
        start.setDate(start.getDate() - start.getDay()); // Inicio de semana
        end.setDate(start.getDate() + 6); // Fin de semana
        break;
      case 'grid':
        start.setDate(1); // Inicio de mes
        end.setMonth(end.getMonth() + 1);
        end.setDate(0); // Fin de mes
        break;
      case 'list':
        end.setDate(end.getDate() + 7); // Próximos 7 días
        break;
    }
    
    return { start, end };
  }, [currentDate, activeView]);

  // Queries
  const { data: schedules, isLoading, refetch } = useQuery(
    ['schedules', {
      startDate: dateRange.start.toISOString().split('T')[0],
      endDate: dateRange.end.toISOString().split('T')[0],
      doctor: selectedDoctor !== 'all' ? selectedDoctor : undefined,
      specialty: selectedSpecialty !== 'all' ? selectedSpecialty : undefined,
      search: searchTerm
    }],
    () => scheduleService.getSchedulesByDateRange(
      dateRange.start.toISOString().split('T')[0],
      dateRange.end.toISOString().split('T')[0],
      {
        doctor_id: selectedDoctor !== 'all' ? selectedDoctor : undefined,
        specialty: selectedSpecialty !== 'all' ? selectedSpecialty : undefined,
        search: searchTerm
      }
    )
  );

  const { data: doctors } = useQuery('availableDoctors', scheduleService.getAvailableDoctors);
  const { data: specialties } = useQuery('scheduleSpecialties', scheduleService.getScheduleSpecialties);
  const { data: conflicts } = useQuery('scheduleConflicts', scheduleService.getScheduleConflicts);
  const { data: templates } = useQuery('scheduleTemplates', scheduleService.getScheduleTemplates);
  const { data: stats } = useQuery('scheduleStats', scheduleService.getScheduleStats);

  // Mutaciones
  const createScheduleMutation = useMutation(scheduleService.createSchedule, {
    onSuccess: () => {
      queryClient.invalidateQueries('schedules');
      queryClient.invalidateQueries('scheduleStats');
      setIsCreateModalOpen(false);
    }
  });

  const updateScheduleMutation = useMutation(
    ({ id, data }) => scheduleService.updateSchedule(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('schedules');
        setIsEditModalOpen(false);
        setSelectedSchedule(null);
      }
    }
  );

  const deleteScheduleMutation = useMutation(scheduleService.deleteSchedule, {
    onSuccess: () => {
      queryClient.invalidateQueries('schedules');
      queryClient.invalidateQueries('scheduleStats');
    }
  });

  const duplicateScheduleMutation = useMutation(
    ({ id, targetDate }) => scheduleService.duplicateSchedule(id, targetDate),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('schedules');
      }
    }
  );

  const createTimeBlockMutation = useMutation(scheduleService.createTimeBlock, {
    onSuccess: () => {
      queryClient.invalidateQueries('schedules');
      setIsBlockTimeModalOpen(false);
    }
  });

  // Handlers
  const handleDateNavigation = (direction) => {
    const newDate = new Date(currentDate);
    
    switch (activeView) {
      case 'calendar':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'grid':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'list':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const handleScheduleClick = (schedule) => {
    if (userRole === 'receptionist') {
      // Solo ver para recepcionista
      return;
    }
    setSelectedSchedule(schedule);
    setIsEditModalOpen(true);
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('¿Está seguro de que desea eliminar este horario?')) {
      try {
        await deleteScheduleMutation.mutateAsync(scheduleId);
      } catch (error) {
        console.error('Error deleting schedule:', error);
      }
    }
  };

  const handleDuplicateSchedule = async (schedule, targetDate) => {
    try {
      await duplicateScheduleMutation.mutateAsync({
        id: schedule.id,
        targetDate: targetDate.toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error duplicating schedule:', error);
    }
  };

  // Funciones auxiliares
  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getScheduleColor = (schedule) => {
    if (schedule.is_blocked) return 'bg-gray-500';
    
    const colors = {
      'Medicina General': 'bg-blue-500',
      'Cardiología': 'bg-red-500',
      'Pediatría': 'bg-green-500',
      'Ginecología': 'bg-purple-500',
      'Neurología': 'bg-indigo-500',
      'Dermatología': 'bg-yellow-500',
      'Traumatología': 'bg-orange-500',
      'Psiquiatría': 'bg-pink-500'
    };
    
    return colors[schedule.specialty] || 'bg-gray-600';
  };

  const isScheduleConflicted = (schedule) => {
    return conflicts?.some(conflict => 
      conflict.schedule1_id === schedule.id || conflict.schedule2_id === schedule.id
    );
  };

  const canModifySchedule = (schedule) => {
    if (userRole === 'admin') return true;
    if (userRole === 'doctor') return schedule.doctor_id === currentUserId;
    return false; // receptionist can only view
  };

  // Componente ScheduleCard
  const ScheduleCard = ({ schedule, className = "" }) => {
    const isConflicted = isScheduleConflicted(schedule);
    const canModify = canModifySchedule(schedule);
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: canModify ? 1.02 : 1 }}
        className={`
          ${getScheduleColor(schedule)} text-white p-3 rounded-lg shadow-sm
          ${canModify ? 'cursor-pointer' : 'cursor-default'}
          ${isConflicted ? 'ring-2 ring-red-400' : ''}
          ${className}
        `}
        onClick={() => canModify && handleScheduleClick(schedule)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium truncate">
                Dr. {schedule.doctor_name}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs">
                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Stethoscope className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs truncate">
                {schedule.specialty}
              </span>
            </div>
            
            {schedule.location && (
              <div className="flex items-center space-x-2 mt-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="text-xs truncate">
                  {schedule.location}
                </span>
              </div>
            )}
          </div>
          
          {canModify && (
            <div className="flex items-center space-x-1 ml-2">
              {isConflicted && (
                <AlertTriangle className="w-4 h-4 text-yellow-300" />
              )}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateSchedule(schedule, new Date());
                  }}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                  title="Duplicar"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSchedule(schedule.id);
                  }}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                  title="Eliminar"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Vista Calendar (Semanal)
  const CalendarView = () => {
    const days = [];
    const startOfWeek = new Date(dateRange.start);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return (
      <div className="grid grid-cols-7 gap-1 h-full">
        {/* Headers */}
        {days.map((day) => (
          <div key={day.toISOString()} className="p-2 text-center border-b">
            <div className="font-semibold text-gray-900">
              {day.toLocaleDateString('es-ES', { weekday: 'short' })}
            </div>
            <div className="text-lg font-bold text-gray-700">
              {day.getDate()}
            </div>
          </div>
        ))}
        
        {/* Schedule slots */}
        {days.map((day) => {
          const daySchedules = schedules?.filter(schedule => {
            const scheduleDate = new Date(schedule.date);
            return scheduleDate.toDateString() === day.toDateString();
          }) || [];
          
          return (
            <div key={day.toISOString()} className="p-2 min-h-32 border-r space-y-1">
              {daySchedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  className="group"
                />
              ))}
              
              {/* Add button */}
              {(userRole === 'admin' || (userRole === 'doctor' && selectedDoctor === currentUserId)) && (
                <button
                  onClick={() => {
                    setSelectedSchedule({ date: day.toISOString().split('T')[0] });
                    setIsCreateModalOpen(true);
                  }}
                  className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-500 hover:text-blue-600"
                >
                  <Plus className="w-4 h-4 mx-auto" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Vista Grid (Mensual)
  const GridView = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startOfGrid = new Date(startOfMonth);
    startOfGrid.setDate(startOfGrid.getDate() - startOfMonth.getDay());
    
    const days = [];
    const current = new Date(startOfGrid);
    
    while (current <= endOfMonth || days.length < 35) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return (
      <div className="grid grid-cols-7 gap-1 h-full">
        {/* Headers */}
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
          <div key={day} className="p-2 text-center font-semibold text-gray-600 border-b">
            {day}
          </div>
        ))}
        
        {/* Days */}
        {days.map((day) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const daySchedules = schedules?.filter(schedule => {
            const scheduleDate = new Date(schedule.date);
            return scheduleDate.toDateString() === day.toDateString();
          }) || [];
          
          return (
            <div 
              key={day.toISOString()} 
              className={`p-1 min-h-20 border-r border-b ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${
                isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {day.getDate()}
              </div>
              
              <div className="space-y-1">
                {daySchedules.slice(0, 2).map((schedule) => (
                  <div
                    key={schedule.id}
                    className={`${getScheduleColor(schedule)} text-white text-xs p-1 rounded truncate cursor-pointer`}
                    onClick={() => canModifySchedule(schedule) && handleScheduleClick(schedule)}
                  >
                    Dr. {schedule.doctor_name}
                  </div>
                ))}
                {daySchedules.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{daySchedules.length - 2} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Vista List
  const ListView = () => {
    const groupedSchedules = schedules?.reduce((acc, schedule) => {
      const date = schedule.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(schedule);
      return acc;
    }, {}) || {};
    
    return (
      <div className="space-y-4">
        {Object.entries(groupedSchedules).map(([date, daySchedules]) => (
          <div key={date} className="bg-white rounded-lg shadow border">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-900">
                {new Date(date).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {daySchedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className={`w-4 h-4 rounded-full ${getScheduleColor(schedule)}`}></div>
                      <div>
                        <div className="font-medium text-gray-900">
                          Dr. {schedule.doctor_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {schedule.specialty} • {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </div>
                        {schedule.location && (
                          <div className="text-sm text-gray-500">
                            📍 {schedule.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {canModifySchedule(schedule) && (
                    <div className="flex items-center space-x-2">
                      {isScheduleConflicted(schedule) && (
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      )}
                      <button
                        onClick={() => handleScheduleClick(schedule)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderView = () => {
    switch (activeView) {
      case 'calendar':
        return <CalendarView />;
      case 'grid':
        return <GridView />;
      case 'list':
        return <ListView />;
      default:
        return <CalendarView />;
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
            <Calendar className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Gestión de Horarios
              </h2>
              <p className="text-sm text-gray-500">
                {userRole === 'admin' && 'Vista completa del sistema'}
                {userRole === 'doctor' && 'Mis horarios'}
                {userRole === 'receptionist' && 'Consulta de horarios'}
              </p>
            </div>
          </div>
          
          {isModal && (
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Navigation and Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Date Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleDateNavigation('prev')}
                className="p-2 hover:bg-gray-200 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="text-lg font-semibold text-gray-900 min-w-32 text-center">
                {activeView === 'grid' 
                  ? currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                  : `Semana ${Math.ceil(currentDate.getDate() / 7)}`
                }
              </div>
              
              <button
                onClick={() => handleDateNavigation('next')}
                className="p-2 hover:bg-gray-200 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                Hoy
              </button>
            </div>
            
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveView('calendar')}
                className={`px-3 py-1 text-sm rounded ${
                  activeView === 'calendar' 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
              </button>
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
            {conflicts && conflicts.length > 0 && (
              <button
                onClick={() => setShowConflicts(!showConflicts)}
                className={`px-3 py-2 text-sm rounded-lg flex items-center space-x-1 ${
                  showConflicts 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{conflicts.length} conflictos</span>
              </button>
            )}
            
            <button
              onClick={() => refetch()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            {(userRole === 'admin' || userRole === 'doctor') && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Horario</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Filters */}
        {userRole === 'admin' && (
          <div className="flex items-center space-x-4 mt-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar doctor, especialidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los doctores</option>
              {doctors?.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.name}
                </option>
              ))}
            </select>
            
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las especialidades</option>
              {specialties?.map((specialty) => (
                <option key={specialty.id} value={specialty.name}>
                  {specialty.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {renderView()}
      </div>
      
      {/* Stats Footer */}
      {stats && (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">
                  {schedules?.length || 0} horarios programados
                </span>
              </div>
              
              {conflicts && conflicts.length > 0 && (
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600">
                    {conflicts.length} conflictos detectados
                  </span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">
                  {stats.utilization}% utilización promedio
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManagement;
