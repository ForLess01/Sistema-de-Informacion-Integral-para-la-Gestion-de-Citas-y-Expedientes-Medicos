import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  BellRing,
  X, 
  Check, 
  CheckCircle,
  Trash2, 
  Archive,
  Clock,
  Filter,
  Settings,
  Zap,
  AlertCircle,
  Info,
  CheckSquare,
  Calendar,
  User,
  Heart,
  Pill,
  Stethoscope,
  UserCheck,
  AlertTriangle,
  MessageCircle,
  Mail,
  Phone,
  FileText,
  Activity,
  TrendingUp,
  Eye,
  EyeOff,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import * as notificationService from '../../services/notificationService';

const NotificationCenter = ({ 
  isOpen = false, 
  onToggle = () => {}, 
  position = 'dropdown', // 'dropdown', 'sidebar', 'modal', 'inline'
  maxHeight = '400px',
  showBadge = true,
  autoRefresh = true,
  currentUserRole = 'admin'
}) => {
  const queryClient = useQueryClient();
  const dropdownRef = useRef(null);
  
  // Estados locales
  const [activeTab, setActiveTab] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Query para obtener notificaciones
  const { data: notifications, isLoading, refetch } = useQuery(
    ['notifications', { archived: showArchived, type: activeTab }],
    () => {
      if (showArchived) {
        return notificationService.getArchivedNotifications();
      }
      if (activeTab === 'all') {
        return notificationService.getNotifications({ limit: 50 });
      }
      return notificationService.getNotificationsByType(activeTab);
    },
    {
      refetchInterval: autoRefresh ? 30000 : false, // Refrescar cada 30 segundos
      staleTime: 10000
    }
  );

  // Query para contador de no leídas
  const { data: unreadCount } = useQuery(
    'unreadCount',
    notificationService.getUnreadCount,
    {
      refetchInterval: autoRefresh ? 15000 : false
    }
  );

  // Mutaciones
  const markAsReadMutation = useMutation(notificationService.markAsRead, {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications');
      queryClient.invalidateQueries('unreadCount');
    }
  });

  const markAllAsReadMutation = useMutation(notificationService.markAllAsRead, {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications');
      queryClient.invalidateQueries('unreadCount');
    }
  });

  const deleteNotificationMutation = useMutation(notificationService.deleteNotification, {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications');
      queryClient.invalidateQueries('unreadCount');
    }
  });

  const archiveMutation = useMutation(notificationService.archiveNotification, {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications');
    }
  });

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (isOpen && position === 'dropdown') {
          onToggle();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle, position]);

  // Tipos de notificaciones con iconos y colores
  const notificationTypes = {
    appointment: { 
      icon: <Calendar className="w-4 h-4" />, 
      color: 'blue', 
      label: 'Citas',
      bgColor: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600'
    },
    emergency: { 
      icon: <AlertTriangle className="w-4 h-4" />, 
      color: 'red', 
      label: 'Emergencias',
      bgColor: 'bg-red-50 border-red-200',
      iconColor: 'text-red-600'
    },
    pharmacy: { 
      icon: <Pill className="w-4 h-4" />, 
      color: 'purple', 
      label: 'Farmacia',
      bgColor: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600'
    },
    medical: { 
      icon: <Stethoscope className="w-4 h-4" />, 
      color: 'green', 
      label: 'Médico',
      bgColor: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600'
    },
    system: { 
      icon: <Settings className="w-4 h-4" />, 
      color: 'gray', 
      label: 'Sistema',
      bgColor: 'bg-gray-50 border-gray-200',
      iconColor: 'text-gray-600'
    },
    user: { 
      icon: <User className="w-4 h-4" />, 
      color: 'indigo', 
      label: 'Usuario',
      bgColor: 'bg-indigo-50 border-indigo-200',
      iconColor: 'text-indigo-600'
    }
  };

  // Prioridades con estilos
  const priorityStyles = {
    low: { color: 'text-green-600', bg: 'bg-green-100' },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-100' },
    high: { color: 'text-orange-600', bg: 'bg-orange-100' },
    critical: { color: 'text-red-600', bg: 'bg-red-100' }
  };

  // Handlers
  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await markAsReadMutation.mutateAsync(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await deleteNotificationMutation.mutateAsync(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleArchive = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await archiveMutation.mutateAsync(notificationId);
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedNotifications([]);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const getNotificationIcon = (type) => {
    return notificationTypes[type]?.icon || <Bell className="w-4 h-4" />;
  };

  const getNotificationStyle = (type) => {
    return notificationTypes[type] || { 
      bgColor: 'bg-gray-50 border-gray-200', 
      iconColor: 'text-gray-600' 
    };
  };

  // Filtrar notificaciones según el rol
  const filteredNotifications = notifications?.results?.filter(notification => {
    // Filtros específicos por rol si es necesario
    return true;
  }) || [];

  // Componente Badge para el contador
  const NotificationBadge = () => {
    if (!showBadge || !unreadCount || unreadCount === 0) return null;
    
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
      >
        {unreadCount > 99 ? '99+' : unreadCount}
      </motion.span>
    );
  };

  // Componente NotificationItem
  const NotificationItem = ({ notification }) => {
    const typeStyle = getNotificationStyle(notification.type);
    const priority = priorityStyles[notification.priority] || priorityStyles.medium;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className={`p-4 border-l-4 border-r border-b border-t ${typeStyle.bgColor} ${
          !notification.is_read ? 'bg-opacity-100' : 'bg-opacity-50'
        } hover:bg-opacity-80 transition-all cursor-pointer group`}
        onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
      >
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={`${typeStyle.iconColor} mt-1`}>
            {getNotificationIcon(notification.type)}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  !notification.is_read ? 'text-gray-900' : 'text-gray-600'
                }`}>
                  {notification.title}
                </p>
                <p className={`text-sm mt-1 ${
                  !notification.is_read ? 'text-gray-700' : 'text-gray-500'
                }`}>
                  {notification.message}
                </p>
                
                {/* Metadata */}
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-gray-500 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTimeAgo(notification.created_at)}
                  </span>
                  
                  {notification.priority !== 'medium' && (
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${priority.bg} ${priority.color}`}>
                      {notification.priority}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                {!notification.is_read && (
                  <button
                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Marcar como leído"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                
                {!showArchived && (
                  <button
                    onClick={(e) => handleArchive(notification.id, e)}
                    className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                    title="Archivar"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={(e) => handleDelete(notification.id, e)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Render según la posición
  const renderContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                {unreadCount} nuevas
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => refetch()}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Actualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            {position === 'dropdown' && (
              <button
                onClick={onToggle}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex items-center space-x-1 mt-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              activeTab === 'all' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Todas
          </button>
          
          {Object.entries(notificationTypes).map(([type, config]) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`px-3 py-1 text-sm font-medium rounded flex items-center space-x-1 transition-colors ${
                activeTab === type 
                  ? `bg-${config.color}-100 text-${config.color}-700` 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {config.icon}
              <span>{config.label}</span>
            </button>
          ))}
        </div>
        
        {/* Actions */}
        {filteredNotifications.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`text-sm font-medium transition-colors ${
                  showArchived ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {showArchived ? 'Mostrar actuales' : 'Ver archivadas'}
              </button>
            </div>
            
            {!showArchived && unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isLoading}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Bell className="w-8 h-8 mb-2 text-gray-300" />
            <p className="text-sm">No hay notificaciones</p>
            <p className="text-xs text-gray-400 mt-1">
              {showArchived ? 'No hay notificaciones archivadas' : 'Estás al día!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <AnimatePresence>
              {filteredNotifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification} 
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );

  // Render según posición
  switch (position) {
    case 'dropdown':
      return (
        <div className="relative" ref={dropdownRef}>
          {/* Trigger Button */}
          <button
            onClick={onToggle}
            className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {unreadCount > 0 ? (
              <BellRing className="w-6 h-6" />
            ) : (
              <Bell className="w-6 h-6" />
            )}
            <NotificationBadge />
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                style={{ maxHeight }}
              >
                {renderContent()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );

    case 'modal':
      return (
        <AnimatePresence>
          {isOpen && (
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
                className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh]"
              >
                {renderContent()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      );

    case 'sidebar':
      return (
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onToggle}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50"
              >
                {renderContent()}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      );

    case 'inline':
    default:
      return (
        <div className="w-full bg-white rounded-lg shadow border border-gray-200">
          {renderContent()}
        </div>
      );
  }
};

export default NotificationCenter;
