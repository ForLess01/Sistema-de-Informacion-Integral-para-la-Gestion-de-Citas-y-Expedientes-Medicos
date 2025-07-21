import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Grid
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  LocalHospital as MedicalIcon,
  Medication as PharmacyIcon,
  Emergency as EmergencyIcon,
  Psychology as DentalIcon,
  PregnantWoman as ObstetricIcon,
  Schedule as AppointmentIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useModuleIntegration } from '../../hooks/useModuleIntegration';

const PatientIntegrationView = ({ 
  patientId, 
  currentModule = 'medical',
  compact = false,
  showTabs = true,
  onNavigateToModule
}) => {
  const {
    crossModuleData,
    loading,
    error,
    loadPatientCrossModuleData,
    getPatientData,
    hasPatientData
  } = useModuleIntegration(currentModule);

  const [selectedTab, setSelectedTab] = useState(0);
  const [expandedAccordion, setExpandedAccordion] = useState(false);

  useEffect(() => {
    if (patientId && !hasPatientData(patientId)) {
      loadPatientCrossModuleData(patientId);
    }
  }, [patientId, loadPatientCrossModuleData, hasPatientData]);

  const patientData = getPatientData(patientId);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'a las' HH:mm", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

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

  const getSeverityColor = (severity) => {
    const colors = {
      high: 'error',
      medium: 'warning',
      low: 'info',
      normal: 'success'
    };
    return colors[severity] || 'default';
  };

  const renderModuleSection = (moduleKey, moduleData) => {
    if (!moduleData || Object.keys(moduleData).length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No hay datos disponibles para este módulo
        </Alert>
      );
    }

    const sections = [];

    // Sección de resumen general
    if (moduleData.summary) {
      sections.push(
        <Card key="summary" variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Resumen General
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(moduleData.summary).map(([key, value]) => (
                <Grid item xs={6} sm={4} key={key}>
                  <Typography variant="body2" color="textSecondary">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {value}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      );
    }

    // Sección de registros recientes
    if (moduleData.recentRecords?.length > 0) {
      sections.push(
        <Card key="recent" variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Registros Recientes
            </Typography>
            <List dense>
              {moduleData.recentRecords.map((record, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    {getModuleIcon(moduleKey)}
                  </ListItemIcon>
                  <ListItemText
                    primary={record.title || record.description || 'Registro médico'}
                    secondary={
                      <Box>
                        <Typography variant="body2" component="span">
                          {formatDate(record.date || record.createdAt)}
                        </Typography>
                        {record.status && (
                          <Chip
                            label={record.status}
                            size="small"
                            color={getSeverityColor(record.severity)}
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      );
    }

    // Sección de alertas/advertencias
    if (moduleData.alerts?.length > 0) {
      sections.push(
        <Card key="alerts" variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="warning.main">
              <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Alertas y Advertencias
            </Typography>
            <List dense>
              {moduleData.alerts.map((alert, index) => (
                <ListItem key={index}>
                  <Alert 
                    severity={getSeverityColor(alert.severity)} 
                    sx={{ width: '100%' }}
                  >
                    {alert.message}
                  </Alert>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      );
    }

    // Sección de próximas citas
    if (moduleData.upcomingAppointments?.length > 0) {
      sections.push(
        <Card key="appointments" variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <AppointmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Próximas Citas
            </Typography>
            <List dense>
              {moduleData.upcomingAppointments.map((appointment, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={appointment.type || 'Cita médica'}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          {formatDate(appointment.date)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {appointment.doctor || 'Médico por asignar'}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      );
    }

    return sections.length > 0 ? sections : (
      <Alert severity="info">
        No hay información detallada disponible para este módulo
      </Alert>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Cargando datos integrados del paciente...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <Button 
          size="small" 
          onClick={() => loadPatientCrossModuleData(patientId)}
          sx={{ ml: 2 }}
        >
          Reintentar
        </Button>
      </Alert>
    );
  }

  if (!patientData) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No se encontraron datos integrados para este paciente.
        <Button 
          size="small" 
          onClick={() => loadPatientCrossModuleData(patientId)}
          sx={{ ml: 2 }}
        >
          Cargar datos
        </Button>
      </Alert>
    );
  }

  const availableModules = Object.keys(patientData).filter(key => 
    patientData[key] && typeof patientData[key] === 'object'
  );

  if (compact) {
    // Vista compacta con acordeón
    return (
      <Accordion 
        expanded={expandedAccordion} 
        onChange={(_, isExpanded) => setExpandedAccordion(isExpanded)}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center">
            <AssessmentIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              Datos Integrados ({availableModules.length} módulos)
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            {availableModules.map((moduleKey, index) => (
              <Box key={moduleKey} sx={{ mb: index < availableModules.length - 1 ? 3 : 0 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  {getModuleIcon(moduleKey)}
                  <Typography variant="subtitle1" sx={{ ml: 1, textTransform: 'capitalize' }}>
                    {moduleKey === 'medical' ? 'Médico' : 
                     moduleKey === 'pharmacy' ? 'Farmacia' :
                     moduleKey === 'emergency' ? 'Emergencias' :
                     moduleKey === 'dental' ? 'Odontología' :
                     moduleKey === 'obstetric' ? 'Obstetricia' : moduleKey}
                  </Typography>
                  {onNavigateToModule && (
                    <Button
                      size="small"
                      onClick={() => onNavigateToModule(moduleKey)}
                      sx={{ ml: 'auto' }}
                    >
                      Ver en módulo
                    </Button>
                  )}
                </Box>
                {renderModuleSection(moduleKey, patientData[moduleKey])}
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
    );
  }

  // Vista completa con tabs
  return (
    <Box>
      {showTabs && availableModules.length > 1 && (
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {availableModules.map((moduleKey) => (
            <Tab
              key={moduleKey}
              icon={getModuleIcon(moduleKey)}
              label={moduleKey === 'medical' ? 'Médico' : 
                     moduleKey === 'pharmacy' ? 'Farmacia' :
                     moduleKey === 'emergency' ? 'Emergencias' :
                     moduleKey === 'dental' ? 'Odontología' :
                     moduleKey === 'obstetric' ? 'Obstetricia' : moduleKey}
              iconPosition="start"
            />
          ))}
        </Tabs>
      )}

      <Box sx={{ mt: showTabs && availableModules.length > 1 ? 2 : 0 }}>
        {availableModules.map((moduleKey, index) => (
          (!showTabs || availableModules.length === 1 || selectedTab === index) && (
            <Box key={moduleKey}>
              {!showTabs || availableModules.length === 1 ? (
                <Box display="flex" alignItems="center" mb={2}>
                  {getModuleIcon(moduleKey)}
                  <Typography variant="h5" sx={{ ml: 1, textTransform: 'capitalize' }}>
                    Datos de {moduleKey === 'medical' ? 'Módulo Médico' : 
                               moduleKey === 'pharmacy' ? 'Farmacia' :
                               moduleKey === 'emergency' ? 'Emergencias' :
                               moduleKey === 'dental' ? 'Odontología' :
                               moduleKey === 'obstetric' ? 'Obstetricia' : moduleKey}
                  </Typography>
                  {onNavigateToModule && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => onNavigateToModule(moduleKey)}
                      sx={{ ml: 'auto' }}
                    >
                      Ver en módulo completo
                    </Button>
                  )}
                </Box>
              ) : null}
              {renderModuleSection(moduleKey, patientData[moduleKey])}
            </Box>
          )
        ))}
      </Box>
    </Box>
  );
};

export default PatientIntegrationView;
