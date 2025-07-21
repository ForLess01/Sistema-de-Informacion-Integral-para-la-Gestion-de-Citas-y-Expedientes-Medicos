import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  Bell,
  Calendar,
  Pill,
  Stethoscope,
  User,
  Settings
} from 'lucide-react';

const NotificationToast = ({
  notifications = [],
  onDismiss = () => {},
  position = 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'
  duration = 5000,
  maxToasts = 5
}) => {
  const [visibleToasts, setVisibleToasts] = useState([]);

  useEffect(() => {
    // Agregar nuevas notificaciones
    notifications.forEach(notification => {
      if (!visibleToasts.some(toast => toast.id === notification.id)) {
        setVisibleToasts(prev => {
          const newToasts = [...prev, { ...notification, timestamp: Date.now() }];
          return newToasts.slice(-maxToasts); // Mantener solo las últimas
        });

        // Auto dismiss después del duration
        if (duration > 0) {
          setTimeout(() => {
            handleDismiss(notification.id);
          }, duration);
        }
      }
    });
  }, [notifications, duration, maxToasts]);

  const handleDismiss = (notificationId) => {
    setVisibleToasts(prev => prev.filter(toast => toast.id !== notificationId));
    onDismiss(notificationId);
  };

  // Iconos y estilos por tipo
  const getToastStyle = (type, priority = 'medium') => {
    const baseStyles = {
      success: {
        icon: <CheckCircle className="w-5 h-5" />,
        bgColor: 'bg-green-50 border-green-200',
        iconColor: 'text-green-600',
        titleColor: 'text-green-900',
        messageColor: 'text-green-700'
      },
      error: {
        icon: <AlertCircle className="w-5 h-5" />,
        bgColor: 'bg-red-50 border-red-200',
        iconColor: 'text-red-600',
        titleColor: 'text-red-900',
        messageColor: 'text-red-700'
      },
      warning: {
        icon: <AlertTriangle className="w-5 h-5" />,
        bgColor: 'bg-yellow-50 border-yellow-200',
        iconColor: 'text-yellow-600',
        titleColor: 'text-yellow-900',
        messageColor: 'text-yellow-700'
      },
      info: {
        icon: <Info className="w-5 h-5" />,
        bgColor: 'bg-blue-50 border-blue-200',
        iconColor: 'text-blue-600',
        titleColor: 'text-blue-900',
        messageColor: 'text-blue-700'
      },
      appointment: {
        icon: <Calendar className="w-5 h-5" />,
        bgColor: 'bg-blue-50 border-blue-200',
        iconColor: 'text-blue-600',
        titleColor: 'text-blue-900',
        messageColor: 'text-blue-700'
      },
      emergency: {
        icon: <AlertTriangle className="w-5 h-5" />,
        bgColor: 'bg-red-50 border-red-200',
        iconColor: 'text-red-600',
        titleColor: 'text-red-900',
        messageColor: 'text-red-700'
      },
      pharmacy: {
        icon: <Pill className="w-5 h-5" />,
        bgColor: 'bg-purple-50 border-purple-200',
        iconColor: 'text-purple-600',
        titleColor: 'text-purple-900',
        messageColor: 'text-purple-700'
      },
      medical: {
        icon: <Stethoscope className="w-5 h-5" />,
        bgColor: 'bg-green-50 border-green-200',
        iconColor: 'text-green-600',
        titleColor: 'text-green-900',
        messageColor: 'text-green-700'
      },
      user: {
        icon: <User className="w-5 h-5" />,
        bgColor: 'bg-indigo-50 border-indigo-200',
        iconColor: 'text-indigo-600',
        titleColor: 'text-indigo-900',
        messageColor: 'text-indigo-700'
      },
      system: {
        icon: <Settings className="w-5 h-5" />,
        bgColor: 'bg-gray-50 border-gray-200',
        iconColor: 'text-gray-600',
        titleColor: 'text-gray-900',
        messageColor: 'text-gray-700'
      }
    };

    return baseStyles[type] || baseStyles.info;
  };

  // Posiciones del contenedor
  const getPositionClasses = () => {
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
      'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
    };
    return positions[position] || positions['top-right'];
  };

  // Animaciones según posición
  const getAnimationProps = (index) => {
    const isTop = position.includes('top');
    const isLeft = position.includes('left');
    const isCenter = position.includes('center');

    return {
      initial: {
        opacity: 0,
        x: isCenter ? 0 : isLeft ? -100 : 100,
        y: isTop ? -20 : 20,
        scale: 0.9
      },
      animate: {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1
      },
      exit: {
        opacity: 0,
        x: isCenter ? 0 : isLeft ? -100 : 100,
        scale: 0.9
      },
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
        delay: index * 0.1
      }
    };
  };

  if (visibleToasts.length === 0) return null;

  return (
    <div className={`fixed z-50 pointer-events-none ${getPositionClasses()}`}>
      <div className="space-y-2 max-w-sm w-full">
        <AnimatePresence mode="popLayout">
          {visibleToasts.map((toast, index) => {
            const style = getToastStyle(toast.type, toast.priority);
            const animationProps = getAnimationProps(index);

            return (
              <motion.div
                key={toast.id}
                layout
                {...animationProps}
                className={`
                  ${style.bgColor} 
                  border-l-4 border-r border-t border-b
                  rounded-lg shadow-lg p-4 max-w-sm w-full
                  pointer-events-auto
                  backdrop-blur-sm
                `}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className={`${style.iconColor} mt-0.5 flex-shrink-0`}>
                    {style.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {toast.title && (
                      <h4 className={`text-sm font-semibold ${style.titleColor} mb-1`}>
                        {toast.title}
                      </h4>
                    )}
                    <p className={`text-sm ${style.messageColor} leading-5`}>
                      {toast.message}
                    </p>

                    {/* Actions si existen */}
                    {toast.actions && toast.actions.length > 0 && (
                      <div className="flex space-x-2 mt-3">
                        {toast.actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={() => {
                              action.onClick();
                              handleDismiss(toast.id);
                            }}
                            className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                              action.primary
                                ? `${style.iconColor} hover:opacity-80`
                                : `${style.messageColor} hover:opacity-80`
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => handleDismiss(toast.id)}
                    className={`${style.iconColor} hover:opacity-60 transition-opacity flex-shrink-0`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Bar para duración */}
                {duration > 0 && (
                  <motion.div
                    className="mt-3 h-1 bg-black bg-opacity-10 rounded-full overflow-hidden"
                  >
                    <motion.div
                      className={`h-full ${style.iconColor.replace('text-', 'bg-')}`}
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: duration / 1000, ease: 'linear' }}
                    />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Hook para usar toasts fácilmente
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (notification) => {
    const id = Date.now() + Math.random();
    const toast = { id, ...notification };
    setToasts(prev => [...prev, toast]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  // Métodos de conveniencia
  const success = (message, title = 'Éxito', options = {}) => 
    addToast({ type: 'success', title, message, ...options });

  const error = (message, title = 'Error', options = {}) => 
    addToast({ type: 'error', title, message, ...options });

  const warning = (message, title = 'Advertencia', options = {}) => 
    addToast({ type: 'warning', title, message, ...options });

  const info = (message, title = 'Información', options = {}) => 
    addToast({ type: 'info', title, message, ...options });

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info
  };
};

export default NotificationToast;
