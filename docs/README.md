# 🏥 Sistema de Información Integral para la Gestión de Citas y Expedientes Médicos (SIIGCEM)

## 🎯 Descripción del Proyecto

Sistema completo de gestión hospitalaria desarrollado para hospitales y centros de salud en Perú, que integra todas las funcionalidades necesarias para la atención médica moderna con un enfoque en seguridad, eficiencia y experiencia del usuario.

---

## 🌟 Características Principales

### **✅ Sistema Híbrido Completo**
- **Frontend Web** (React + Vite) - Para pacientes
- **Frontend Desktop** (Electron + React) - Para personal médico
- **Backend API** (Django REST Framework) - API centralizada
- **Base de datos** PostgreSQL con Redis para caché

### **✅ Módulos Implementados**
- 🏥 **Gestión de Citas** - Programación automática e inteligente
- 📋 **Expedientes Médicos** - Historiales centralizados y seguros
- 💊 **Sistema de Farmacia** - Control de inventario y dispensación
- 🚨 **Módulo de Emergencias** - Triaje y atención de urgencias
- 📊 **Reportes Avanzados** - Estadísticas y análisis en tiempo real
- 🔔 **Notificaciones** - Email, SMS y alertas automáticas
- 🔐 **Seguridad Avanzada** - 2FA, JWT y encriptación de datos
- 👥 **Sistema de Roles** - Control granular de acceso

### **✅ Especialidades Médicas Soportadas**
- 🩺 Medicina General
- 🤱 Atención Prenatal (Obstetriz)
- 🦷 Odontología
- 🏥 Emergencias
- 💊 Farmacia

---

## 🚀 Inicio Rápido

### **Requisitos Previos**
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- npm 8+

### **Instalación Automática (Windows)**
```powershell
# Clonar repositorio
git clone [URL_REPOSITORIO]
cd Sistema-de-Informacion-Integral-para-la-Gestion-de-Citas-y-Expedientes-Medicos

# Ejecutar script de instalación automática
.\start-servers.ps1
```

### **Acceso al Sistema**
- **Frontend Web (Pacientes)**: http://localhost:3000
- **Frontend Desktop (Personal)**: Aplicación Electron
- **API Backend**: http://localhost:8000/api/v1/
- **Documentación API**: http://localhost:8000/api/swagger/
- **Panel Admin**: http://localhost:8000/admin/

---

## 📚 Documentación Completa

### 🚀 **Para Comenzar**
- [**Guía de Inicio Rápido**](./GETTING_STARTED.md) - Instalación paso a paso
- [**Estado del Proyecto**](./PROJECT_STATUS.md) - Progreso actual y próximos pasos

### 👥 **Manuales por Usuario**
- [**Manual del Paciente**](./user-guides/patient-guide.md) - Frontend Web
- [**Manual del Doctor**](./user-guides/doctor-guide.md) - Dashboard médico
- [**Manual de Enfermería**](./user-guides/nurse-guide.md) - Sistema de triaje
- [**Manual del Administrador**](./user-guides/admin-guide.md) - Gestión del sistema
- [**Manual del Farmacéutico**](./user-guides/pharmacist-guide.md) - Control de inventario

### 🔧 **Documentación Técnica**
- [**Referencia API**](./technical/api-reference.md) - Endpoints completos
- [**Arquitectura del Sistema**](./technical/architecture.md) - Diseño técnico
- [**Esquema de Base de Datos**](./technical/database-schema.md) - Modelos y relaciones
- [**Guía de Testing**](./technical/testing-guide.md) - Pruebas automatizadas

### ⚙️ **Instalación y Configuración**
- [**Guía de Instalación**](./setup/installation-guide.md) - Instalación detallada
- [**Configuración de Entorno**](./setup/environment-setup.md) - Variables y configuraciones
- [**Setup de Base de Datos**](./setup/database-setup.md) - PostgreSQL y Redis
- [**Guía de Despliegue**](./setup/deployment-guide.md) - Producción y staging

### 🔒 **Seguridad**
- [**Autenticación 2FA**](./security/authentication-2fa.md) - Implementación completa
- [**Encriptación de Datos**](./security/data-encryption.md) - Protección de información sensible
- [**Políticas de Seguridad**](./security/security-policies.md) - Mejores prácticas

### 🧩 **Funcionalidades Específicas**
- [**Sistema de Citas**](./features/appointment-system.md) - Gestión de citas médicas
- [**Expedientes Médicos**](./features/medical-records.md) - Historiales clínicos
- [**Gestión de Farmacia**](./features/pharmacy-management.md) - Inventario y dispensación
- [**Módulo de Emergencias**](./features/emergency-module.md) - Triaje y urgencias
- [**Sistema de Reportes**](./features/reporting-system.md) - Estadísticas y análisis
- [**Sistema de Notificaciones**](./features/notification-system.md) - Alertas automáticas

### 🔗 **Integraciones Externas**
- [**APIs Externas**](./integrations/external-apis.md) - Integraciones de terceros
- [**Servicio de Email**](./integrations/email-service.md) - SendGrid y notificaciones
- [**Integración de Mapas**](./integrations/maps-integration.md) - Google Maps API

### 🛠️ **Para Desarrolladores**
- [**Guía de Contribución**](./development/contribution-guide.md) - Cómo contribuir al proyecto
- [**Estándares de Código**](./development/coding-standards.md) - Buenas prácticas
- [**Solución de Problemas**](./development/troubleshooting.md) - Errores comunes

---

## 👥 Roles del Sistema

| Rol | Descripción | Plataforma de Acceso |
|-----|-------------|---------------------|
| **Paciente** | Usuarios finales del sistema | Frontend Web |
| **Doctor** | Personal médico especializado | Desktop + Web |
| **Enfermera** | Personal de enfermería y triaje | Desktop |
| **Obstetriz** | Especialista en atención prenatal | Desktop |
| **Odontólogo** | Especialista en atención dental | Desktop |
| **Farmacéutico** | Control de medicamentos e inventario | Desktop |
| **Personal de Emergencias** | Atención de urgencias y triaje crítico | Desktop |
| **Recepcionista** | Atención al cliente y check-in | Desktop |
| **Administrador** | Gestión completa del sistema | Todos los sistemas |

---

## 📊 Estado Actual del Proyecto

### ✅ **COMPLETADO (85%)**
- Sistema de autenticación con 2FA ✅
- API Backend completa (16/16 endpoints) ✅
- Módulo de citas médicas ✅
- Expedientes médicos centralizados ✅
- Sistema de farmacia con inventario ✅
- Módulo de emergencias funcional ✅
- Sistema de reportes avanzados ✅
- Notificaciones por email ✅
- Frontend Web para pacientes ✅
- Aplicación Desktop para personal ✅
- Integraciones externas (Google Maps, SendGrid) ✅
- Sistema de testing (17/17 pruebas exitosas) ✅

### 🚧 **EN DESARROLLO (15%)**
- Optimizaciones de rendimiento
- Módulos adicionales según necesidades específicas
- Mejoras en UI/UX basadas en feedback
- Documentación de usuario final

---

## 💻 Stack Tecnológico

### **Backend**
```python
Django==5.2.3
djangorestframework==3.16.0
PostgreSQL 12+
Redis (caché y sesiones)
Celery==5.5.3 (tareas asíncronas)
JWT Authentication + 2FA
```

### **Frontend Web**
```javascript
React 19.1.0
Vite 7.0.3
TailwindCSS 3.4.17
React Query 5.17.9
Framer Motion (animaciones)
```

### **Frontend Desktop**
```javascript
Electron 37.2.0
React 19.1.0
Material-UI 7.2.0
React Query 5.83.0
```

---

## 🏆 Características Destacadas

### **🔒 Seguridad Avanzada**
- **JWT** con refresh tokens automáticos
- **Autenticación 2FA** con TOTP y códigos de respaldo
- **Encriptación PGP** para datos sensibles
- **Control de acceso** basado en roles granulares

### **⚡ Rendimiento Optimizado**
- **API Response Time**: <200ms
- **Caché Redis** para consultas frecuentes
- **Lazy loading** en frontend
- **Paginación** eficiente en listados

### **🎯 Experiencia de Usuario**
- **Dashboards específicos** por rol profesional
- **Sistema de triaje** integrado para emergencias
- **Notificaciones automáticas** para todas las acciones importantes
- **Interfaz responsiva** y accesible

---

## 🆘 Soporte y Ayuda

### **📞 Contacto del Proyecto**
- **Universidad**: Universidad Nacional del Altiplano - UNAP
- **Facultad**: Ingeniería de Sistemas
- **Curso**: Sistemas de Información - VI Semestre

### **🔧 Solución Rápida de Problemas**
1. [**Troubleshooting Guide**](./development/troubleshooting.md) - Errores comunes
2. [**Guía de Instalación**](./setup/installation-guide.md) - Problemas de setup
3. [**API Documentation**](http://localhost:8000/api/swagger/) - Referencias técnicas

### **📚 Recursos Adicionales**
- [**Documentación API en Vivo**](http://localhost:8000/api/swagger/)
- [**Panel de Administración Django**](http://localhost:8000/admin/)
- [**Estado del Sistema**](./PROJECT_STATUS.md)

---

## 🎓 Valor Académico y Profesional

Este proyecto demuestra competencias avanzadas en:

- **🏗️ Ingeniería de Software**: Arquitectura limpia, patrones de diseño
- **🔒 Ciberseguridad**: Implementación de seguridad multicapa
- **🧪 Quality Assurance**: Testing automatizado y TDD
- **⚙️ DevOps**: Scripts de automatización y deployment
- **📋 Gestión de Proyectos**: Documentación profesional y control de versiones
- **🌐 Desarrollo Full-Stack**: Frontend, Backend y Base de datos
- **👥 UX/UI**: Interfaces centradas en el usuario por rol

---

## 📜 Licencia

Este proyecto está bajo la **Licencia MIT**. Ver el archivo [LICENSE](../LICENSE) para más detalles.

---

## 🙏 Agradecimientos

Desarrollado para la **Universidad Nacional del Altiplano - UNAP**, como parte del proyecto final de **Sistemas de Información**, demostrando la aplicación práctica de tecnologías modernas en el sector salud peruano.

**Tecnologías y servicios utilizados:**
- Django REST Framework | React.js | Electron
- PostgreSQL | Redis | SendGrid | Google Maps API
- JWT | 2FA | TailwindCSS | Material-UI
- Y muchas tecnologías más...

---

*📅 Última actualización: Enero 2025*
*🔄 Estado: En desarrollo activo - 85% completado*

---

## 🎯 Navegación Rápida

| Soy... | Quiero... | Ir a... |
|--------|-----------|---------|-------|
| **Nuevo al proyecto** | Entender qué hace el sistema | [Estado del Proyecto](./PROJECT_STATUS.md) |
| **Desarrollador** | Instalar y configurar | [Guía de Inicio](./GETTING_STARTED.md) |
| **Usuario Final** | Aprender a usar el sistema | [Manuales de Usuario](./user-guides/) |
| **Técnico** | Entender la arquitectura | [Documentación Técnica](./technical/) |
| **Administrador** | Desplegar en producción | [Guía de Despliegue](./setup/deployment-guide.md) |
