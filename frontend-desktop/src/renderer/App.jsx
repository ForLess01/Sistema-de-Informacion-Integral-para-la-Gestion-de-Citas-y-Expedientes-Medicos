import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import MedicalDashboard from './pages/MedicalDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import NurseDashboard from './pages/NurseDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
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

// Pharmacy Pages
import PharmacyInventory from './pages/pharmacy/PharmacyInventory';
import PrescriptionDispensing from './pages/pharmacy/PrescriptionDispensing';
import LowStock from './pages/pharmacy/LowStock';
import PharmacyMovements from './pages/pharmacy/PharmacyMovements';
import PharmacyReports from './pages/pharmacy/PharmacyReports';
import MedicineEntry from './pages/pharmacy/MedicineEntry';

// Emergency Pages
import AmbulanceManagement from './pages/emergency/AmbulanceManagement';
import CriticalCases from './pages/emergency/CriticalCases';

// Nurse Pages
import NurseStation from './pages/nurse/NurseStation';
import PatientMonitoring from './pages/nurse/PatientMonitoring';
import VitalSigns from './pages/medical/VitalSigns';
import WaitingRoom from './pages/medical/WaitingRoom';
import TriagePage from './pages/emergency/TriagePage';

// Reports Pages
import ReportsMain from './pages/reports/ReportsMain';
import FinancialReports from './pages/reports/FinancialReports';
import DoctorPerformance from './pages/reports/DoctorPerformance';
import MonthlyReports from './pages/reports/MonthlyReports';
import AppointmentReports from './pages/reports/AppointmentReports';
import PatientReports from './pages/reports/PatientReports';
import PharmacyFinancials from './pages/pharmacy/PharmacyFinancials';

// Dental Pages
import DentalHistory from './pages/dental/DentalHistory';
import DentalProcedures from './pages/dental/DentalProcedures';
import TreatmentPlan from './pages/dental/TreatmentPlan';

// Reception Pages
import AppointmentScheduling from './pages/reception/AppointmentScheduling';
import PatientRegistration from './pages/reception/PatientRegistration';
import InsuranceVerification from './pages/reception/InsuranceVerification';
import BillingManagement from './pages/reception/BillingManagement';

// Medical Pages
import NewConsultation from './pages/medical/NewConsultation';
import ConsultationDetail from './pages/medical/ConsultationDetail';
import DiagnosisHistory from './pages/medical/DiagnosisHistory';
import PrescriptionManager from './pages/medical/PrescriptionManager';
import MedicalRecords from './pages/medical/MedicalRecords';
import ConsultationsList from './pages/medical/ConsultationsList';

// Patient Pages
import NewPatient from './pages/patients/NewPatient';
import PatientsList from './pages/patients/PatientsList';
import PatientDetail from './pages/patients/PatientDetail';
import PatientSearch from './pages/patients/PatientSearch';
import CheckIn from './pages/patients/CheckIn';

// Appointment Pages
import NewAppointment from './pages/appointments/NewAppointment';
import AppointmentsList from './pages/appointments/AppointmentsList';
import AppointmentDetail from './pages/appointments/AppointmentDetail';

// Emergency Pages - Additional
import NewEmergency from './pages/emergency/NewEmergency';
import EmergencyQueue from './pages/emergency/EmergencyQueue';
import EmergencyReports from './pages/emergency/EmergencyReports';

// Obstetric Pages
import PregnancyTracking from './pages/PregnancyTracking';
import BirthPlan from './pages/BirthPlan';
import PostpartumCare from './pages/PostpartumCare';

// Additional Pages
import CallsManagement from './pages/calls/CallsManagement';

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
      return <Navigate to="/admin-dashboard" replace />;
    case 'receptionist':
      return <Navigate to="/receptionist-dashboard" replace />;
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
              
              <Route path="/receptionist-dashboard" element={
                <ProtectedRoute requiredRoles={['receptionist']}>
                  <ReceptionistDashboard />
                </ProtectedRoute>
              } />
              
              {/* Dashboard general como fallback */}
              <Route path="/general-dashboard" element={
                <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'emergency', 'obstetriz', 'odontologo']}>
                  <MedicalDashboard />
                </ProtectedRoute>
              } />
              {/* Rutas doctor funcionales */}
              <Route path="/consultations" element={
                <ProtectedRoute requiredRoles={['doctor']}>                
                  <ConsultationsList />
                </ProtectedRoute>
              } />
              <Route path="/medical/medical-records" element={
                <ProtectedRoute requiredRoles={['doctor']}>                
                  <MedicalRecords />
                </ProtectedRoute>
              } />
              <Route path="/medical/new-consultation" element={
                <ProtectedRoute requiredRoles={['doctor']}>                
                  <NewConsultation />
                </ProtectedRoute>
              } />
              <Route path="/medical/prescription-manager" element={
                <ProtectedRoute requiredRoles={['doctor']}>                
                  <PrescriptionManager />
                </ProtectedRoute>
              } />
              <Route path="/medical/diagnosis-history" element={
                <ProtectedRoute requiredRoles={['doctor']}>                
                  <DiagnosisHistory />
                </ProtectedRoute>
              } />
              <Route path="/medical/vital-signs" element={
                <ProtectedRoute requiredRoles={['doctor', 'nurse']}>                
                  <VitalSigns />
                </ProtectedRoute>
              } />
              <Route path="/medical/waiting-room" element={
                <ProtectedRoute requiredRoles={['doctor', 'nurse']}>                
                  <WaitingRoom />
                </ProtectedRoute>
              } />
              
              /* Rutas funcionales existentes */
              
              <Route path="/emergency/ambulances" element={
                <ProtectedRoute requiredRoles={['emergency', 'admin']}>
                  <AmbulanceManagement />
                </ProtectedRoute>
              } />

              <Route path="/emergency/critical-cases" element={
                <ProtectedRoute requiredRoles={['emergency', 'doctor']}>
                  <CriticalCases />
                </ProtectedRoute>
              } />
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
              
              <Route path="/medical-records/:id" element={
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
              
              {/* Rutas específicas de Farmacia */}
              <Route path="/pharmacy/inventory" element={
                <ProtectedRoute requiredRoles={['admin', 'pharmacist']}>
                  <PharmacyInventory />
                </ProtectedRoute>
              } />
              
              <Route path="/pharmacy/prescriptions" element={
                <ProtectedRoute requiredRoles={['pharmacist']}>
                  <PrescriptionDispensing />
                </ProtectedRoute>
              } />
              
              <Route path="/pharmacy/low-stock" element={
                <ProtectedRoute requiredRoles={['admin', 'pharmacist']}>
                  <LowStock />
                </ProtectedRoute>
              } />
              
              <Route path="/pharmacy/movements" element={
                <ProtectedRoute requiredRoles={['admin', 'pharmacist']}>
                  <PharmacyMovements />
                </ProtectedRoute>
              } />
              
              <Route path="/pharmacy/reports" element={
                <ProtectedRoute requiredRoles={['admin', 'pharmacist']}>
                  <PharmacyReports />
                </ProtectedRoute>
              } />
              
              <Route path="/pharmacy/medicine-entry" element={
                <ProtectedRoute requiredRoles={['admin', 'pharmacist']}>
                  <MedicineEntry />
                </ProtectedRoute>
              } />
              
              {/* Alias para compatibilidad con enlaces existentes */}
              <Route path="/pharmacy/dispense" element={
                <ProtectedRoute requiredRoles={['pharmacist']}>
                  <PrescriptionDispensing />
                </ProtectedRoute>
              } />
              
              <Route path="/pharmacy/inventory/add" element={
                <ProtectedRoute requiredRoles={['admin', 'pharmacist']}>
                  <MedicineEntry />
                </ProtectedRoute>
              } />
              
              {/* Rutas específicas de Enfermería */}
              <Route path="/nurse/station" element={
                <ProtectedRoute requiredRoles={['nurse', 'admin']}>
                  <NurseStation />
                </ProtectedRoute>
              } />
              
              <Route path="/nurse/monitoring" element={
                <ProtectedRoute requiredRoles={['nurse', 'admin']}>
                  <PatientMonitoring />
                </ProtectedRoute>
              } />
              
              {/* Rutas médicas generales (compartidas por médicos y enfermeros) */}
              <Route path="/medical/vital-signs" element={
                <ProtectedRoute requiredRoles={['nurse', 'doctor', 'admin']}>
                  <VitalSigns />
                </ProtectedRoute>
              } />
              
              <Route path="/medical/waiting-room" element={
                <ProtectedRoute requiredRoles={['nurse', 'doctor', 'admin', 'receptionist']}>
                  <WaitingRoom />
                </ProtectedRoute>
              } />
              
              {/* Rutas de triaje */}
              <Route path="/triage" element={
                <ProtectedRoute requiredRoles={['nurse', 'emergency', 'admin']}>
                  <TriagePage />
                </ProtectedRoute>
              } />
              
              <Route path="/triage/completed" element={
                <ProtectedRoute requiredRoles={['nurse', 'emergency', 'admin']}>
                  <TriagePage />
                </ProtectedRoute>
              } />

              {/* RUTAS MÉDICAS FALTANTES - CONECTAR DASHBOARDS */}
              <Route path="/consultations" element={
                <ProtectedRoute requiredRoles={['doctor', 'nurse', 'admin']}>
                  <NewConsultation />
                </ProtectedRoute>
              } />

              <Route path="/medical/new-consultation" element={
                <ProtectedRoute requiredRoles={['doctor', 'nurse', 'admin']}>
                  <NewConsultation />
                </ProtectedRoute>
              } />

              <Route path="/medical/diagnosis-history" element={
                <ProtectedRoute requiredRoles={['doctor', 'admin']}>
                  <DiagnosisHistory />
                </ProtectedRoute>
              } />

              <Route path="/medical/prescription-manager" element={
                <ProtectedRoute requiredRoles={['doctor', 'admin']}>
                  <PrescriptionManager />
                </ProtectedRoute>
              } />

              <Route path="/medical/medical-records" element={
                <ProtectedRoute requiredRoles={['doctor', 'nurse', 'admin']}>
                  <MedicalRecords />
                </ProtectedRoute>
              } />

              <Route path="/medical/consultations/:id" element={
                <ProtectedRoute requiredRoles={['doctor', 'nurse', 'admin']}>
                  <ConsultationDetail />
                </ProtectedRoute>
              } />

              {/* RUTAS DE PACIENTES */}
              <Route path="/patients" element={
                <ProtectedRoute requiredRoles={['doctor', 'nurse', 'admin', 'receptionist']}>
                  <PatientsList />
                </ProtectedRoute>
              } />

              <Route path="/patients/new" element={
                <ProtectedRoute requiredRoles={['admin', 'receptionist']}>
                  <NewPatient />
                </ProtectedRoute>
              } />

              <Route path="/patients/:id" element={
                <ProtectedRoute requiredRoles={['doctor', 'nurse', 'admin', 'receptionist']}>
                  <PatientDetail />
                </ProtectedRoute>
              } />

              <Route path="/patients/:id/edit" element={
                <ProtectedRoute requiredRoles={['admin', 'receptionist']}>
                  <NewPatient />
                </ProtectedRoute>
              } />

              <Route path="/patients/search" element={
                <ProtectedRoute requiredRoles={['doctor', 'nurse', 'admin', 'receptionist']}>
                  <PatientSearch />
                </ProtectedRoute>
              } />

              <Route path="/patients/check-in" element={
                <ProtectedRoute requiredRoles={['receptionist', 'nurse', 'admin']}>
                  <CheckIn />
                </ProtectedRoute>
              } />

              {/* RUTAS DE CITAS - ESPECÍFICAS */}
              <Route path="/appointments/new" element={
                <ProtectedRoute requiredRoles={['admin', 'receptionist']}>
                  <NewAppointment />
                </ProtectedRoute>
              } />

              <Route path="/appointments/list" element={
                <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse', 'receptionist']}>
                  <AppointmentsList />
                </ProtectedRoute>
              } />

              <Route path="/appointments/:id" element={
                <ProtectedRoute requiredRoles={['admin', 'doctor', 'nurse', 'receptionist']}>
                  <AppointmentDetail />
                </ProtectedRoute>
              } />

              {/* Rutas del módulo de Reportes */}
              <Route path="/reports" element={
                <ProtectedRoute requiredRoles={['admin', 'doctor', 'pharmacist']}>
                  <ReportsMain />
                </ProtectedRoute>
              } />

              {/* Rutas específicas de reportes - Solo Admin */}
              <Route path="/reports/financial" element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <FinancialReports />
                </ProtectedRoute>
              } />

              <Route path="/reports/performance" element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <DoctorPerformance />
                </ProtectedRoute>
              } />

              <Route path="/reports/monthly" element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <MonthlyReports />
                </ProtectedRoute>
              } />

              {/* Rutas de reportes compartidos */}
              <Route path="/reports/appointments" element={
                <ProtectedRoute requiredRoles={['admin', 'doctor', 'receptionist']}>
                  <AppointmentReports />
                </ProtectedRoute>
              } />

              <Route path="/reports/patients" element={
                <ProtectedRoute requiredRoles={['admin', 'doctor']}>
                  <PatientReports />
                </ProtectedRoute>
              } />

              {/* Ruta de reportes financieros de farmacia */}
              <Route path="/pharmacy/financials" element={
                <ProtectedRoute requiredRoles={['admin', 'pharmacist']}>
                  <PharmacyFinancials />
                </ProtectedRoute>
              } />

              {/* Rutas específicas del módulo Dental */}
              <Route path="/dental/history" element={
                <ProtectedRoute requiredRoles={['odontologo', 'admin']}>
                  <DentalHistory />
                </ProtectedRoute>
              } />
              
              <Route path="/dental/procedures" element={
                <ProtectedRoute requiredRoles={['odontologo', 'admin']}>
                  <DentalProcedures />
                </ProtectedRoute>
              } />
              
              <Route path="/dental/treatment-plan" element={
                <ProtectedRoute requiredRoles={['odontologo', 'admin']}>
                  <TreatmentPlan />
                </ProtectedRoute>
              } />
              
              <Route path="/dental/patient/:patientId/history" element={
                <ProtectedRoute requiredRoles={['odontologo', 'admin']}>
                  <DentalHistory />
                </ProtectedRoute>
              } />
              
              <Route path="/dental/patient/:patientId/procedures" element={
                <ProtectedRoute requiredRoles={['odontologo', 'admin']}>
                  <DentalProcedures />
                </ProtectedRoute>
              } />
              
              <Route path="/dental/patient/:patientId/treatment-plan" element={
                <ProtectedRoute requiredRoles={['odontologo', 'admin']}>
                  <TreatmentPlan />
                </ProtectedRoute>
              } />
              
              {/* Rutas médicas que incluyen acceso dental para colaboración */}
              <Route path="/medical-records/:patientId/dental" element={
                <ProtectedRoute requiredRoles={['doctor', 'odontologo', 'admin']}>
                  <DentalHistory />
                </ProtectedRoute>
              } />
              
              {/* Rutas específicas del módulo de Recepción/Administrativo */}
              <Route path="/reception/appointments" element={
                <ProtectedRoute requiredRoles={['receptionist', 'admin']}>
                  <AppointmentScheduling />
                </ProtectedRoute>
              } />
              
              <Route path="/reception/patients" element={
                <ProtectedRoute requiredRoles={['receptionist', 'admin']}>
                  <PatientRegistration />
                </ProtectedRoute>
              } />
              
              <Route path="/reception/insurance" element={
                <ProtectedRoute requiredRoles={['receptionist', 'admin']}>
                  <InsuranceVerification />
                </ProtectedRoute>
              } />
              
              <Route path="/reception/billing" element={
                <ProtectedRoute requiredRoles={['receptionist', 'admin']}>
                  <BillingManagement />
                </ProtectedRoute>
              } />
              
              {/* Rutas de compatibilidad para redirección */}
              <Route path="/obstetriz" element={<Navigate to="/obstetriz-dashboard" replace />} />
              <Route path="/odontologo" element={<Navigate to="/odontologo-dashboard" replace />} />
              <Route path="/dental" element={<Navigate to="/odontologo-dashboard" replace />} />
              <Route path="/reception" element={<Navigate to="/receptionist-dashboard" replace />} />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;