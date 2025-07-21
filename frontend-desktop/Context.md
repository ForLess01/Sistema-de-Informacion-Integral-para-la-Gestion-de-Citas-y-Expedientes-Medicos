# 🎯 PROMPT DEFINITIVO: COMPLETAR SISTEMA MÉDICO FRONTEND DESKTOP POR ROLES

## 📋 CONTEXTO DEL PROYECTO
**Sistema**: Sistema de Información Integral para la Gestión de Citas y Expedientes Médicos  
**Arquitectura**: Híbrido (Web React + Desktop Electron)  
**Backend**: Django REST Framework con PostgreSQL  
**Frontend Desktop**: React + Electron + TailwindCSS + Framer Motion  
**Estado Actual**: ~70% implementado con funcionalidades parciales

## 👥 ROLES OFICIALES DEL SISTEMA
1. 👑 **Admin** - Administrador general del sistema
2. 👨‍⚕️ **Doctor** - Médico general (fusión de doctor + medical)
3. 👩‍⚕️ **Obstetriz** - Especialista en obstetricia
4. 🦷 **Odontologo** - Especialista en odontología
5. 👩‍⚕️ **Nurse** - Enfermero/a
6. 💊 **Pharmacist** - Farmacéutico
7. 🚨 **Emergency** - Personal de emergencias
8. 👩‍💼 **Receptionist** - Personal administrativo/recepcionista

## 🎯 OBJETIVO PRINCIPAL
Completar el sistema médico de escritorio al 100% implementando todas las funcionalidades por rol, conectando con el backend existente y asegurando una experiencia de usuario fluida y profesional.

## 🔄 METODOLOGÍA DE TRABAJO POR ROL

### PARA CADA ROL SE DEBE:

#### 1️⃣ **FASE DE ANÁLISIS**
- **Verificar Dashboard del Rol**: Comprobar que el dashboard específico del rol esté completo
- **Auditar Enlaces**: Verificar todos los enlaces del dashboard y que apunten a rutas válidas
- **Inventariar Pantallas**: Listar todas las pantallas que el rol necesita según el inventario
- **Verificar Existencia**: Buscar si las pantallas existen (pueden tener nombres similares o estar mal ubicadas)

#### 2️⃣ **FASE DE IMPLEMENTACIÓN**
- **Crear Pantallas Faltantes**: Solo si realmente no existen en el proyecto
- **Completar Pantallas Existentes**: 
  - Eliminar todos los TODOs
  - Implementar funcionalidades completas
  - Eliminar datos mock/placeholder
- **Configurar Rutas**: Agregar/corregir rutas en App.jsx
- **Mantener Diseño Consistente**: Respetar el diseño visual de los dashboards (dark theme, gradientes, cards glassmorphism)

#### 3️⃣ **FASE DE INTEGRACIÓN BACKEND**
- **Verificar Endpoints**: Comprobar si existen en el backend Django
- **Implementar Endpoints Faltantes**: Si no existen, crearlos en el backend
- **Conectar Servicios**: Actualizar/crear servicios en frontend para consumir la API
- **Manejar Estados**: Implementar loading, error y success states
- **Validaciones**: Agregar validaciones médicas apropiadas

#### 4️⃣ **FASE DE TESTING**
- **Probar Flujo Completo**: Login → Dashboard → Cada funcionalidad
- **Verificar Permisos**: Asegurar que solo los roles autorizados accedan
- **Datos Reales**: Poblar con datos de ejemplo desde el backend
- **Responsividad**: Verificar que funcione en diferentes tamaños de ventana

## 📝 ORDEN DE IMPLEMENTACIÓN POR ROL

### 1. 👨‍⚕️ **DOCTOR** (PRIORIDAD ALTA)
**Pantallas a verificar/completar:**
- ✅ DoctorDashboard.jsx
- 🔧 ConsultationsList.jsx (crear si no existe - para ver consultas pendientes)
- 🔧 MedicalRecords.jsx (completar TODOs)
- 🔧 NewConsultation.jsx (completar funcionalidad)
- 🔧 PrescriptionManager.jsx (integrar con backend)
- 🔧 DiagnosisHistory.jsx (completar)
- 🔧 VitalSigns.jsx (compartido con Nurse)
- 🔧 WaitingRoom.jsx (compartido)

### 2. 👩‍⚕️ **NURSE** (PRIORIDAD ALTA)
**Pantallas a verificar/completar:**
- ✅ NurseDashboard.jsx
- 🔧 NurseStation.jsx
- 🔧 PatientMonitoring.jsx
- 🔧 VitalSigns.jsx (compartido con Doctor)
- 🔧 MedicationAdministration.jsx (puede ser componente dentro de NurseStation)
- 🔧 TriagePage.jsx (compartido con Emergency)

### 3. 💊 **PHARMACIST** (PRIORIDAD ALTA)
**Pantallas a verificar/completar:**
- ✅ PharmacyDashboard.jsx
- 🔧 PharmacyInventory.jsx
- 🔧 PrescriptionDispensing.jsx
- 🔧 LowStock.jsx
- 🔧 PharmacyMovements.jsx
- 🔧 PharmacyReports.jsx
- 🔧 MedicineEntry.jsx

### 4. 🚨 **EMERGENCY** (PRIORIDAD MEDIA)
**Pantallas a verificar/completar:**
- ✅ EmergencyDashboard.jsx
- 🔧 EmergencyQueue.jsx
- 🔧 NewEmergency.jsx
- 🔧 TriagePage.jsx
- 🔧 CriticalCases.jsx
- 🔧 EmergencyReports.jsx
- 🔧 AmbulanceManagement.jsx

### 5. 👩‍💼 **RECEPTIONIST** (PRIORIDAD MEDIA)
**Pantallas a verificar/completar:**
- ✅ ReceptionistDashboard.jsx
- 🔧 AppointmentScheduling.jsx
- 🔧 PatientRegistration.jsx
- 🔧 InsuranceVerification.jsx
- 🔧 BillingManagement.jsx
- 🔧 CheckIn.jsx (compartido)

### 6. 👩‍⚕️ **OBSTETRIZ** (PRIORIDAD MEDIA)
**Pantallas a verificar/completar:**
- ✅ ObstetrizDashboard.jsx
- 🔧 PregnancyTracking.jsx
- 🔧 BirthPlan.jsx
- 🔧 PostpartumCare.jsx
- Hereda pantallas médicas del Doctor

### 7. 🦷 **ODONTOLOGO** (PRIORIDAD MEDIA)
**Pantallas a verificar/completar:**
- ✅ OdontologoDashboard.jsx
- 🔧 DentalHistory.jsx
- 🔧 TreatmentPlan.jsx
- 🔧 DentalProcedures.jsx
- Hereda pantallas médicas del Doctor

### 8. 👑 **ADMIN** (PRIORIDAD BAJA)
**Pantallas a verificar/completar:**
- ✅ AdminDashboard.jsx
- 🔧 SystemSettings.jsx
- 🔧 UserManagement.jsx
- 🔧 ScheduleManagement.jsx
- 🔧 RoomManagement.jsx
- 🔧 Todos los reportes (ReportsMain, FinancialReports, etc.)

## 🎨 ESTÁNDARES DE DISEÑO A MANTENER

### Tema Visual Consistente:
```jsx
// Colores base del tema oscuro
- Background: gradient from-gray-900 via-gray-800 to-gray-900
- Cards: backdrop-blur-lg bg-white/10 border-white/20
- Hover: bg-white/20
- Texto principal: text-white
- Texto secundario: text-gray-400
- Acentos por rol:
  - Doctor: blue-500 to purple-600
  - Nurse: green-500 to emerald-600
  - Emergency: red-500 to red-600
  - Pharmacy: purple-500 to purple-600
```

### Componentes UI Estándar:
- Cards con glassmorphism effect
- Botones con gradientes
- Iconos de lucide-react
- Animaciones con framer-motion
- Tablas con diseño consistente
- Formularios con validación visual

## 📦 ESTRUCTURA DE SERVICIOS

### Para cada módulo crear/verificar:
```javascript
// Ejemplo: pharmacyService.js
const pharmacyService = {
  // Inventario
  getInventory: (params) => api.get('/pharmacy/inventory/', { params }),
  getMedicineById: (id) => api.get(`/pharmacy/medicines/${id}/`),
  createMedicine: (data) => api.post('/pharmacy/medicines/', data),
  updateMedicine: (id, data) => api.put(`/pharmacy/medicines/${id}/`, data),
  
  // Movimientos
  getMovements: (params) => api.get('/pharmacy/movements/', { params }),
  createEntry: (data) => api.post('/pharmacy/entries/', data),
  createDispensing: (data) => api.post('/pharmacy/dispensing/', data),
  
  // Reportes
  getLowStock: () => api.get('/pharmacy/low-stock/'),
  getExpiringMedicines: () => api.get('/pharmacy/expiring/'),
  getPharmacyStats: () => api.get('/pharmacy/stats/'),
};
```

## 🔌 INTEGRACIÓN BACKEND

### Verificar/Implementar en Django:
1. **URLs**: Verificar que existan las rutas en `urls.py`
2. **Views**: Implementar ViewSets o APIViews faltantes
3. **Serializers**: Crear serializers para los modelos
4. **Permissions**: Configurar permisos por rol
5. **Filters**: Implementar filtros necesarios

### Ejemplo de endpoint a verificar:
```python
# pharmacy/views.py
class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    permission_classes = [IsAuthenticated, IsPharmacistOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'generic_name']
    ordering_fields = ['name', 'stock', 'expiry_date']
```

## ✅ CRITERIOS DE ACEPTACIÓN

### Para considerar un rol completado:
1. **Dashboard Funcional**: Enlaces activos y estadísticas reales
2. **Todas las Pantallas Operativas**: Sin TODOs ni placeholders
3. **Integración Backend**: Datos reales desde la BD
4. **Validaciones Implementadas**: Formularios con validación completa
5. **Permisos Correctos**: Solo roles autorizados pueden acceder
6. **UI/UX Consistente**: Mantiene el diseño del sistema
7. **Manejo de Errores**: Estados de carga, error y vacío
8. **Responsive**: Funciona en diferentes tamaños de ventana

## 🚀 RESULTADO FINAL ESPERADO

Un sistema médico de escritorio 100% funcional donde:
- **Cada rol** tiene acceso completo a sus funcionalidades
- **Todas las pantallas** están implementadas y conectadas
- **El backend** responde con datos reales
- **La experiencia de usuario** es fluida y profesional
- **El código** es mantenible y está bien documentado
- **Los datos** fluyen correctamente entre módulos
- **Sistema listo para producción**

## 📌 NOTAS IMPORTANTES

1. **Priorizar funcionalidad sobre perfección**: Es mejor tener todas las pantallas funcionando al 80% que pocas al 100%
2. **Reutilizar componentes**: Si una funcionalidad es similar, crear componentes reutilizables
3. **Mantener consistencia**: Usar los mismos patrones de código en todo el proyecto
4. **Documentar decisiones**: Comentar el código cuando se tomen decisiones importantes
5. **Probar mientras se desarrolla**: No dejar las pruebas para el final

---

**¿Comenzamos con el primer rol (Doctor)?**
