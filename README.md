# Sistema de Información Integral para la Gestión de Citas y Expedientes Médicos

## Descripción General

Este proyecto tiene como objetivo desarrollar un sistema híbrido (web y escritorio) para la gestión de citas médicas, historiales clínicos, despacho de medicamentos y atención de emergencias en centros de salud del Perú. 

La plataforma está dividida en dos partes:
- **Web pública:** Para que los pacientes puedan registrarse y programar sus citas.
- **Aplicación de escritorio:** Para uso interno del personal médico, administrativo y de farmacia con diferentes niveles de acceso.

---

## Características Principales

- Programación y gestión de citas médicas.
- Registro y consulta de historiales clínicos.
- Gestión de stock y despacho en farmacia.
- Alertas de atención prioritaria para emergencias.
- Generación de reportes clínicos y administrativos.
- Control de acceso por roles.

---

## Tecnologías Utilizadas

### Backend
- Python
- Django
- Django REST Framework

### Frontend Web
- React
- JavaScript
- HTML5 / CSS3
- Tailwind CSS / Bootstrap

### Escritorio
- PyQt (para interfaces nativas) / Electron (opcional)

### Base de Datos
- PostgreSQL

### Seguridad
- JWT (JSON Web Tokens)
- Autenticación con doble factor

### Visualización y Reportes
- Chart.js / D3.js
- ReportLab / WeasyPrint

---

## Requisitos del Sistema

- PostgreSQL ≥ 13
- Python ≥ 3.10
- Node.js ≥ 18
- Navegador moderno (para uso web)
- Sistema operativo compatible con PyQt/Electron para escritorio

---

## Instalación

1. **Clona este repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/nombre-repo.git
   cd nombre-repo
