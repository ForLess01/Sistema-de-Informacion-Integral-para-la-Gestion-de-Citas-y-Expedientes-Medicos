# Documentación Detallada: Frontend Web (React)

## 1. Introducción y Propósito

El frontend web es una Aplicación de Página Única (SPA) construida con React y Vite. Está diseñada para ser la interfaz principal a través de la cual los **pacientes** interactúan con el sistema. Permite a los usuarios gestionar su información personal, agendar y consultar citas, y ver su historial médico de una forma moderna y reactiva.

**Responsabilidades Principales:**
-   **Interfaz de Usuario:** Proporciona una experiencia de usuario limpia e intuitiva para todas las funcionalidades orientadas al paciente.
-   **Comunicación con la API:** Se comunica de forma asíncrona con la API del backend para obtener y enviar datos sin necesidad de recargar la página.
-   **Gestión de Estado:** Maneja el estado de la aplicación, incluyendo la información del usuario autenticado, los datos obtenidos de la API y el estado de la UI.
-   **Enrutamiento:** Utiliza `react-router-dom` para gestionar la navegación del lado del cliente, permitiendo URLs limpias y una experiencia de navegación fluida.

---

## 2. Tecnologías y Dependencias Clave

| Tecnología/Librería     | Versión (Aprox.) | Propósito                                               |
| ----------------------- | ---------------- | ------------------------------------------------------- |
| React                   | 19.1.0           | Librería principal para construir la interfaz de usuario. |
| Vite                    | 7.0.3            | Herramienta de construcción y servidor de desarrollo.   |
| React Router DOM        | 6.15.0           | Para el enrutamiento del lado del cliente (SPA).        |
| Axios                   | 1.4.0            | Cliente HTTP para la comunicación con la API del backend. |
| Tailwind CSS            | 3.4.17           | Framework de CSS para un diseño rápido y personalizable.|
| TanStack Query (React Query) | 5.17.9        | Para la gestión del estado del servidor y el cacheo de datos. |
| React Hook Form         | 7.49.2           | Para la gestión de formularios y validaciones.          |
| Yup                     | 1.3.3            | Para la definición de esquemas de validación.           |
| Chart.js / Recharts     | -                | Para la creación de gráficos y visualizaciones.         |

---

## 3. Estructura del Proyecto (`src`)

```
src/
├── assets/               # Recursos estáticos (imágenes, logos, etc.)
├── components/           # Componentes de React reutilizables
│   ├── auth/             # Componentes para login, registro
│   ├── common/           # Componentes genéricos (Button, Input, Modal)
│   ├── layout/           # Componentes de estructura (Navbar, Sidebar, AuthLayout)
│   └── ...               # Otros componentes específicos de una funcionalidad
├── contexts/             # Contextos de React para el estado global
│   └── AuthContext.jsx   # Contexto para la gestión de la autenticación
├── hooks/                # Hooks de React personalizados
│   └── useAuth.js        # Hook para acceder fácilmente al AuthContext
├── pages/                # Componentes que representan las páginas/vistas principales
│   ├── Appointments.jsx
│   ├── Dashboard.jsx
│   ├── MedicalHistory.jsx
│   ├── Profile.jsx
│   └── ...
├── services/             # Lógica de comunicación con la API
│   ├── api.js            # Configuración central de Axios (interceptores)
│   ├── authService.js    # Llamadas a la API de autenticación
│   └── ...               # Otros servicios (appointmentService, etc.)
├── styles/               # Ficheros de estilos globales (CSS)
├── utils/                # Funciones de utilidad genéricas
├── App.jsx               # Componente raíz con la configuración de React Router
├── main.jsx              # Punto de entrada de la aplicación
└── index.css             # Fichero principal de estilos (Tailwind CSS)
```

---

## 4. Arquitectura y Diseño

### 4.1. Flujo de Datos y Gestión de Estado

-   **Estado del Servidor:** Se utiliza **TanStack Query (React Query)** para gestionar los datos que provienen de la API. Esta librería se encarga automáticamente del cacheo, la revalidación y la actualización de los datos, simplificando enormemente la lógica en los componentes.
-   **Estado Global de UI:** Para el estado que necesita ser compartido globalmente entre componentes (como la información del usuario autenticado), se utiliza el **Context API de React**. El `AuthContext` es el ejemplo más claro, proveyendo datos del usuario y funciones de login/logout a toda la aplicación.
-   **Estado Local:** El estado que es específico de un componente se maneja con los hooks `useState` y `useReducer` de React.

### 4.2. Enrutamiento

El enrutamiento se gestiona con `react-router-dom`. En `App.jsx` se definen las rutas principales de la aplicación. Se utilizan componentes personalizados para proteger las rutas:

-   **`<PrivateRoute>`**: Envuelve las rutas que solo deben ser accesibles para usuarios autenticados. Si el usuario no tiene un token de acceso en `localStorage`, es redirigido a la página de `/login`.
-   **`<PublicRoute>`**: Envuelve las rutas públicas (como `/login` y `/register`). Si el usuario ya está autenticado, es redirigido al `/dashboard` para evitar que vea de nuevo las páginas de inicio de sesión.

### 4.3. Comunicación con el Backend

La comunicación con la API se centraliza en el directorio `services/`.

-   **`services/api.js`**: Aquí se crea una instancia de `axios`. Lo más importante de este fichero son los **interceptores**:
    -   **Interceptor de Petición (Request):** Antes de que cualquier petición sea enviada, este interceptor añade el `Authorization Header` con el token JWT si existe en `localStorage`.
    -   **Interceptor de Respuesta (Response):** Si una respuesta de la API devuelve un código de estado `401 Unauthorized`, significa que el token ha expirado o no es válido. Este interceptor se encarga de limpiar `localStorage` (eliminando los tokens y datos de usuario) y redirigir al usuario a la página de `/login`.
-   **Servicios (`authService.js`, etc.):** Cada fichero de servicio agrupa un conjunto de funciones relacionadas que llaman a los endpoints de la API. Por ejemplo, `authService.js` contiene las funciones `login()`, `register()` y `logout()`.

---

## 5. Análisis y Recomendaciones

### 5.1. Manejo de Errores en la API
-   **Observación:** En `services/api.js`, la lógica para manejar el error 401 contiene rutas hardcodeadas (`/api/v1/appointments/upcoming/`, `/api/v1/medical-records/summary/`) para evitar la redirección en llamadas específicas del dashboard.
-   **Riesgo:** Esta lógica es frágil. Si se añaden nuevos endpoints al dashboard o si las URLs cambian, será necesario actualizar esta lista manualmente, lo que es propenso a errores.
-   **Recomendación:** En lugar de una lista negra de URLs, se podría añadir una opción en la configuración de la llamada de `axios` para indicar si la redirección en caso de error 401 debe ser ignorada. Por ejemplo:
    ```javascript
    // En el servicio
    api.get('/dashboard/data', { meta: { preventRedirect: true } });

    // En el interceptor
    if (error.response?.status === 401 && !error.config?.meta?.preventRedirect) {
        // Redirigir...
    }
    ```

### 5.2. Estructura de Componentes
-   **Observación:** La estructura de la carpeta `components` es funcional, pero podría mejorar su escalabilidad. Actualmente, parece mezclar componentes genéricos con componentes específicos de una funcionalidad.
-   **Riesgo:** A medida que la aplicación crezca, puede volverse difícil encontrar componentes y entender sus dependencias.
-   **Recomendación:** Considerar una estructura más granular dentro de `components`, agrupando los componentes por "feature" o página. Por ejemplo:
    ```
    components/
    ├── common/             # Botones, Inputs, Modales (muy reutilizables)
    ├── layout/             # Navbar, Sidebar
    ├── auth/               # Componentes solo para autenticación
    └── appointments/       # Componentes para la gestión de citas
        ├── AppointmentList.jsx
        ├── AppointmentForm.jsx
        └── Calendar.jsx
    ```

### 5.3. Gestión de Formularios
-   **Observación:** El proyecto utiliza `react-hook-form` y `yup`, lo cual es una excelente práctica. Sin embargo, en `authService.js`, se realiza una transformación manual de los datos del formulario antes de enviarlos a la API.
-   **Riesgo:** La lógica de transformación de datos dentro de un fichero de servicio mezcla responsabilidades. El servicio debería encargarse solo de la comunicación, no de la manipulación de la estructura de los datos.
-   **Recomendación:** La transformación de los datos del formulario para que coincidan con lo que espera la API debería ocurrir en el propio componente o en la función `onSubmit` que llama al servicio. Esto mantiene la lógica del formulario contenida y el servicio agnóstico a la forma de los datos de la UI.

### 5.4. Archivos Duplicados o de Backup
-   **Observación:** Existe un fichero `App.backup.jsx` en el directorio `src`.
-   **Riesgo:** Los ficheros de backup en el control de versiones pueden causar confusión y ser aplicados por error en el futuro.
-   **Recomendación:** Eliminar `App.backup.jsx`. El control de versiones (Git) es la herramienta adecuada para gestionar el historial de los ficheros, por lo que los backups manuales son innecesarios y desaconsejados.

---

## 6. Guía de Puesta en Marcha (Desarrollo)

1.  **Clonar el repositorio:** `git clone <URL_DEL_REPOSITORIO>`
2.  **Navegar al directorio:** `cd frontend-web`
3.  **Instalar dependencias:** `npm install`
4.  **Configurar variables de entorno:** Crear un fichero `.env.local` en la raíz de `frontend-web` y definir la variable `VITE_API_URL`:
    ```
    VITE_API_URL=http://localhost:8000/api/v1
    ```
5.  **Ejecutar el servidor de desarrollo:** `npm run dev`
6.  **Acceder a la aplicación:** Abrir el navegador en `http://localhost:3000` (o el puerto que indique Vite).
