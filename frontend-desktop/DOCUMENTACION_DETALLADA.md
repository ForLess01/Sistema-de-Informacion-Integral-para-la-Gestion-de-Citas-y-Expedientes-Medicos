# Documentación Detallada: Frontend Desktop (Electron)

## 1. Introducción y Propósito

El frontend de escritorio es una aplicación nativa para Windows, macOS y Linux, construida con **Electron**. Su propósito es ofrecer una experiencia de usuario más robusta, integrada y potente para el **personal de la clínica** (doctores, recepcionistas, administradores). Aunque la interfaz de usuario está construida con la misma base de código de React que el frontend web, Electron actúa como un contenedor que le otorga capacidades de una aplicación de escritorio.

**Responsabilidades Principales:**
-   **Contenedor de la App Web:** Empaqueta la SPA de React en una ventana de escritorio, eliminando la necesidad de un navegador web.
-   **Integración con el Sistema Operativo:** Provee funcionalidades que no son posibles en la web, como menús de aplicación nativos, notificaciones del sistema y acceso a diálogos de archivos.
-   **Gestión de Ventanas:** Maneja el ciclo de vida de las ventanas de la aplicación, incluyendo una ventana de login separada y la ventana principal de la aplicación.
-   **Comunicación Segura:** Establece un puente de comunicación seguro (IPC) entre el proceso principal de Electron (con acceso a Node.js) y el proceso de renderizado (la app de React).

---

## 2. Tecnologías y Dependencias Clave

| Tecnología/Librería     | Versión (Aprox.) | Propósito                                               |
| ----------------------- | ---------------- | ------------------------------------------------------- |
| Electron                | 37.2.0           | Framework para construir aplicaciones de escritorio.    |
| Electron Builder        | 26.0.12          | Para empaquetar y crear instaladores de la aplicación.  |
| React                   | 19.1.0           | Librería para construir la interfaz de usuario.         |
| Vite                    | 7.0.3            | Herramienta de construcción para la base de React.      |
| Concurrently            | 9.2.0            | Para ejecutar los scripts de Vite y Electron a la vez.  |
| Wait-on                 | 8.0.3            | Para esperar a que el servidor de Vite esté listo antes de lanzar Electron. |

---

## 3. Estructura del Proyecto (`src`)

La estructura del código de React (`renderer`) es idéntica a la del `frontend-web`. La diferencia clave reside en los directorios `electron` y `preload`.

```
src/
├── electron/             # Proceso Principal de Electron
│   └── main.cjs          # Lógica de creación de ventanas, menús, IPC, etc.
├── preload/              # Script de Preload para la comunicación segura
│   └── preload.js        # Expone funciones del backend de Electron al frontend
└── renderer/             # Código fuente de la aplicación React (similar a frontend-web)
    ├── assets/
    ├── components/
    ├── contexts/
    ├── hooks/
    ├── pages/
    ├── services/
    ├── App.jsx
    └── main.jsx
```

---

## 4. Arquitectura y Diseño

Electron funciona con dos tipos de procesos, y entender su interacción es clave para entender la aplicación:

### 4.1. Proceso Principal (Main Process)

-   **Fichero:** `src/electron/main.cjs`
-   **Entorno:** Node.js completo.
-   **Responsabilidades:**
    -   Es el punto de entrada de la aplicación de escritorio.
    -   Crea y gestiona las ventanas (`BrowserWindow`). En este proyecto, gestiona una `loginWindow` y una `mainWindow`.
    -   Define el menú nativo de la aplicación (`Menu.setApplicationMenu`).
    -   Escucha y responde a eventos del ciclo de vida de la aplicación (ej. `app.whenReady`).
    -   Maneja la comunicación inter-procesos (IPC) a través de `ipcMain`, escuchando los eventos que envía el frontend.

### 4.2. Proceso de Renderizado (Renderer Process)

-   **Ficheros:** Todo el código dentro de `src/renderer/` (la aplicación de React).
-   **Entorno:** Un navegador Chromium (sin acceso directo a Node.js por seguridad).
-   **Responsabilidades:**
    -   Renderizar la interfaz de usuario.
    -   Toda la lógica de la aplicación React (componentes, estado, etc.) se ejecuta aquí.
    -   Para interactuar con el sistema operativo, no puede hacerlo directamente. Debe comunicarse con el Proceso Principal a través de la API expuesta en el script de `preload`.

### 4.3. Script de Preload y Comunicación (IPC)

-   **Fichero:** `src/preload/preload.js`
-   **Propósito:** Es un puente de comunicación seguro entre el Proceso Principal y el de Renderizado.
-   **Funcionamiento:** El script `preload.js` se ejecuta en un contexto que tiene acceso tanto al DOM de la página como a un subconjunto de las APIs de Node.js. Utiliza `contextBridge.exposeInMainWorld` para exponer de forma segura funciones específicas al Proceso de Renderizado bajo un objeto global (en este caso, `window.electronAPI`).
-   **APIs Expuestas (`electronAPI`):**
    -   `loginSuccess(userData)`: Notifica al proceso principal que el login fue exitoso para que cierre la ventana de login y abra la principal.
    -   `logout()`: Notifica al proceso principal que se debe cerrar la sesión.
    -   `onNavigate(callback)`: Permite que el proceso principal (a través del menú) le pida al frontend que navegue a una ruta específica.
    -   `printDocument()`: Invoca la funcionalidad de impresión nativa.
    -   `saveFile()`: Abre un diálogo nativo para guardar archivos.

---

## 5. Análisis y Recomendaciones

### 5.1. Seguridad del Proceso de Renderizado
-   **Observación:** En `src/electron/main.cjs`, la configuración de la `loginWindow` tiene la propiedad `webSecurity: false`.
-   **Riesgo:** Deshabilitar la seguridad web, incluso en desarrollo, es una práctica muy peligrosa. Abre la puerta a ataques de Cross-Site Scripting (XSS) y otros problemas de seguridad, ya que relaja la Same-Origin Policy.
-   **Recomendación:** Eliminar `webSecurity: false`. Si el problema que se intentaba solucionar era relacionado con CORS al hacer peticiones a la API local, la solución correcta es configurar los CORS adecuadamente en el backend de Django para que permita peticiones desde el origen `file://` (que es el origen de una aplicación Electron en producción) o configurar un proxy en Electron si es necesario. Nunca se debe desactivar la seguridad web.

### 5.2. Manejo de la Transición de Ventanas
-   **Observación:** El handler `ipcMain.handle('login-success', ...)` en `main.cjs` contiene una lógica compleja con múltiples flags (`isProcessingLogin`, `isMainWindowCreating`) y un `setTimeout` como medida de seguridad para gestionar la transición entre la ventana de login y la principal.
-   **Riesgo:** Esta complejidad es una señal de que el flujo es propenso a errores (race conditions). El uso de `setTimeout` para recuperarse de un posible fallo es un indicativo de que el estado no se está gestionando de forma predecible.
-   **Recomendación:** Simplificar drásticamente este flujo. En lugar de cerrar una ventana y abrir otra, se podría usar una única ventana principal y simplemente cambiar el contenido que se muestra. Al iniciar sesión, en lugar de destruir y crear ventanas, se podría navegar a la ruta del dashboard y redimensionar la ventana si es necesario. Esto eliminaría toda la lógica de flags y timeouts, haciendo el código más robusto y fácil de mantener.

### 5.3. Estructura de Directorios
-   **Observación:** La estructura del código fuente (`src`) mezcla directorios del proceso principal (`electron`, `preload`) con los del proceso de renderizado (`renderer`, `components`, `pages`, etc.).
-   **Riesgo:** Esto puede ser confuso, ya que no queda inmediatamente claro qué código pertenece a qué proceso.
-   **Recomendación:** Adoptar una estructura más explícita que separe claramente el código de cada proceso. Una convención común es:
    ```
    src/
    ├── main/               # Todo el código del Proceso Principal
    │   ├── index.js
    │   └── preload.js
    └── renderer/           # Todo el código del Proceso de Renderizado (React)
        ├── index.html
        ├── main.jsx
        └── ...
    ```
    Esto hace que la separación de responsabilidades sea evidente desde la estructura de carpetas.

### 5.4. Dependencias de Desarrollo
-   **Observación:** El paquete `electron-reload` se está instalando como una dependencia de producción, pero solo se usa en entorno de desarrollo (`if (isDev)`).
-   **Riesgo:** Aumenta innecesariamente el tamaño del paquete final de la aplicación.
-   **Recomendación:** Mover `electron-reload` de `dependencies` a `devDependencies` en el `package.json`.

---

## 6. Guía de Puesta en Marcha (Desarrollo)

1.  **Clonar el repositorio:** `git clone <URL_DEL_REPOSITORIO>`
2.  **Navegar al directorio:** `cd frontend-desktop`
3.  **Instalar dependencias:** `npm install`
4.  **Ejecutar la aplicación en modo desarrollo:** `npm run dev`
    -   Este comando iniciará el servidor de desarrollo de Vite para la interfaz de React y, una vez listo, lanzará la aplicación Electron.

## 7. Empaquetado para Producción

1.  **Asegurarse de que todas las dependencias estén instaladas:** `npm install`
2.  **Ejecutar el script de empaquetado:** `npm run dist`
3.  **Buscar los instaladores:** El comando utilizará `electron-builder` para generar los instaladores nativos (ej. `.exe`, `.dmg`, `.AppImage`) en la carpeta `dist/` dentro de `frontend-desktop`.
