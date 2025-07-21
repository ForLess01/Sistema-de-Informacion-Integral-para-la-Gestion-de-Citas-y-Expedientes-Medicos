import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Divider,
  Button,
  Card,
  CardContent,
  Tooltip,
  Chip,
  Alert
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  LocalHospital as MedicalIcon,
  Medication as PharmacyIcon,
  Emergency as EmergencyIcon,
  Psychology as DentalIcon,
  PregnantWoman as ObstetricIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Close as CloseIcon,
  MarkAsUnread as UnreadIcon,
  DoneAll as ReadAllIcon
} from '@mui/icons-material';
import { format, formatDistance } from 'date-fns';
import { es } from 'date-fns/locale';
import { useModuleIntegration } from '../../hooks/useModuleIntegration';

const ModuleNotifications = ({ 
  currentModule = 'medical',
  showBadge = true,
  maxDisplayed = 10,
  onNotificationClick,
  onNavigateToModule 
}) => {
  const {
    notifications,
    loading,
    clearNotifications,
    markNotificationAsRead,
    subscribeToModuleEvents
  } = useModuleIntegration(currentModule);

  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Suscribirse a eventos de integración para recibir notificaciones en tiempo real
    const unsubscribe = subscribeToModuleEvents((event) => {
      // El hook ya maneja la actualización de notificaciones
    });

    return unsubscribe;
  }, [subscribeToModuleEvents]);

  useEffect(() => {
    // Calcular notificaciones no leídas
    const unread = notifications.filter(notif => !notif.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const getModuleIcon = (moduleName) => {
    const icons = {
      medical: <MedicalIcon />,
      pharmacy: <PharmacyIcon />,
      emergency: <EmergencyIcon />,
      dental: <DentalIcon />,
      obstetric: <ObstetricIcon />
    };
    return icons[moduleName] || <InfoIcon />;
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      error: <ErrorIcon color="error" />,
      warning: <WarningIcon color="warning" />,
      info: <InfoIcon color="info" />,
      success: <SuccessIcon color="success" />
    };
    return icons[severity] || <InfoIcon />;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      error: 'error',
      warning: 'warning',
      info: 'info',
      success: 'success'
    };
    return colors[severity] || 'default';
  };

  const formatNotificationDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return formatDistance(date, now, { addSuffix: true, locale: es });
      } else {
        return format(date, "dd/MM/yyyy 'a las' HH:mm", { locale: es });
      }
    } catch (error) {
      return dateString;
    }
  };

  const handleNotificationClick = (notification) => {
    // Marcar como leída si no lo está
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }

    // Ejecutar callback personalizado si existe
    if (onNotificationClick) {
      onNotificationClick(notification);
    }

    // Si la notificación incluye información de navegación, navegar al módulo
    if (notification.moduleSource && onNavigateToModule) {
      onNavigateToModule(notification.moduleSource, notification.relatedId);
    }
  };

  const handleMarkAllAsRead = () => {
    notifications.forEach(notif => {
      if (!notif.read) {
        markNotificationAsRead(notif.id);
      }
    });
  };

  const handleClearAll = () => {
    clearNotifications();
    setAnchorEl(null);
  };

  const displayedNotifications = notifications.slice(0, maxDisplayed);
  const hasMoreNotifications = notifications.length > maxDisplayed;

  return (
    <>
      <Tooltip title="Notificaciones integradas">
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          color="inherit"
          disabled={loading}
        >
          {showBadge ? (
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <NotificationsIcon />
            </Badge>
          ) : (
            <NotificationsIcon />
          )}
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          style: { width: '400px', maxHeight: '600px' }
        }}
      >
        <Card elevation={0}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Notificaciones
              </Typography>
              <Box>
                {unreadCount > 0 && (
                  <Tooltip title="Marcar todas como leídas">
                    <IconButton size="small" onClick={handleMarkAllAsRead}>
                      <ReadAllIcon />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Limpiar todas">
                  <IconButton size="small" onClick={handleClearAll}>
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {loading ? (
              <Alert severity="info">
                Cargando notificaciones...
              </Alert>
            ) : displayedNotifications.length === 0 ? (
              <Alert severity="info">
                No tienes notificaciones nuevas
              </Alert>
            ) : (
              <>
                <List dense>
                  {displayedNotifications.map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      <ListItem
                        button
                        onClick={() => handleNotificationClick(notification)}
                        sx={{
                          backgroundColor: notification.read ? 'transparent' : 'action.hover',
                          borderRadius: 1,
                          mb: 0.5
                        }}
                      >
                        <ListItemAvatar>
                          <Badge
                            variant="dot"
                            invisible={notification.read}
                            color="primary"
                            sx={{
                              '& .MuiBadge-dot': {
                                right: 8,
                                top: 8
                              }
                            }}
                          >
                            <Avatar sx={{ bgcolor: 'primary.light' }}>
                              {getModuleIcon(notification.moduleSource)}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>

                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography 
                                variant="body2" 
                                fontWeight={notification.read ? 'normal' : 'bold'}
                                noWrap
                              >
                                {notification.title}
                              </Typography>
                              <Chip
                                size="small"
                                label={notification.moduleSource}
                                color={getSeverityColor(notification.severity)}
                                sx={{ ml: 'auto' }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                {notification.message}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {formatNotificationDate(notification.createdAt)}
                              </Typography>
                            </Box>
                          }
                        />

                        <ListItemSecondaryAction>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getSeverityIcon(notification.severity)}
                            {!notification.read && (
                              <UnreadIcon color="primary" fontSize="small" />
                            )}
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      
                      {index < displayedNotifications.length - 1 && (
                        <Divider variant="inset" />
                      )}
                    </React.Fragment>
                  ))}
                </List>

                {hasMoreNotifications && (
                  <Box mt={2} textAlign="center">
                    <Typography variant="body2" color="textSecondary">
                      Y {notifications.length - maxDisplayed} notificaciones más...
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => {
                        // Aquí podrías abrir una vista completa de notificaciones
                        // o expandir el límite de visualización
                      }}
                    >
                      Ver todas las notificaciones
                    </Button>
                  </Box>
                )}

                {unreadCount > 0 && (
                  <Box mt={2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      onClick={handleMarkAllAsRead}
                      startIcon={<ReadAllIcon />}
                    >
                      Marcar todas como leídas ({unreadCount})
                    </Button>
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Popover>
    </>
  );
};

export default ModuleNotifications;
