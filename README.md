<p align="center">
  <img src="teos_logo.png" alt="TEOS Logo" width="140" height="140">
</p>

<h1 align="center">TEOS - Gestor Universitario</h1>

<p align="center">
  <strong>Una aplicación web progresiva (PWA) de alto rendimiento y estética iOS nativa, diseñada para optimizar la organización académica y el control de calificaciones de estudiantes universitarios.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-HTML5%20%2F%20CSS3%20%2F%20JS%20(ES6%2B)-007AFF?style=flat-round" alt="Tech Stack">
  <img src="https://img.shields.io/badge/PWA-Offline%20Ready-green?style=flat-round" alt="PWA Status">
  <img src="https://img.shields.io/badge/UX-iOS%20Design%20System-grey?style=flat-round" alt="Design">
  <img src="https://img.shields.io/badge/Storage-LocalStorage-orange?style=flat-round" alt="Storage">
</p>

---

## 📱 ¿Qué es TEOS?

**TEOS** es un gestor académico personal que combina potencia funcional y una experiencia de usuario sumamente pulida inspirada en las pautas de diseño de Apple (iOS). Ha sido desarrollado utilizando tecnologías web estándar de forma pura (Vanilla) para garantizar máxima velocidad de carga, ligereza y portabilidad absoluta. 

Al ser una **PWA (Progressive Web App)**, puede instalarse en dispositivos móviles (iOS y Android) y computadoras de escritorio, funcionando de forma fluida incluso sin conexión a internet.

---

## ✨ Características Principales

*   **📱 Estética iOS Premium:** Interfaz de alta fidelidad con efectos de desenfoque tipo cristal (glassmorphism), transiciones fluidas, tipografía clara (`SF Pro Display` / `Inter`), selectores segmentados nativos y paletas de colores cuidadosamente curadas.
*   **🏠 Dashboard Dinámico (Inicio):** Vista de un solo vistazo de tus compromisos inmediatos. Te muestra automáticamente cuál es tu **próxima clase** (con hora, aula y docente) y tu **próxima tarea** pendiente con opción de añadir tareas rápidamente.
*   **📅 Horario Interactivo:** Organiza y visualiza tus clases diarias mediante una barra de navegación de días de la semana y un selector de fecha integrado (calendario nativo) para planificaciones futuras.
*   **📚 Gestión Completa de Cursos:** Añade, edita o elimina asignaturas especificando:
    *   Nombre del curso y docente.
    *   Horas de inicio y fin junto con los días que se dicta.
    *   Aula/Ubicación.
    *   Color identificador personalizado para una organización visual rápida.
    *   Promedio acumulado actual del curso.
*   **📊 Simulador de Notas Avanzado:** Planifica tus objetivos académicos. Permite definir la cantidad de secciones de evaluación (exámenes, proyectos, prácticas) con sus respectivos pesos (porcentajes) y calificaciones actuales. Calcula de forma automática el **promedio acumulado** y la **nota mínima requerida** en las evaluaciones restantes para aprobar el curso.
*   **✏️ Gestor de Tareas:** Crea un listado de tareas asociadas a tus cursos con estados de completado y filtros rápidos para mantener el control sobre tus entregas.
*   **🔒 Privacidad Absoluta:** Los datos se guardan localmente en el almacenamiento del navegador (`localStorage`). No requiere registro, servidores externos ni comparte tus datos personales.

---

## 🛠️ Arquitectura y Tecnologías

El desarrollo del sistema sigue la filosofía de "cero dependencias externas complejas" para asegurar máxima optimización:

1.  **Estructura (HTML5):** Uso estricto de HTML5 semántico para accesibilidad y SEO, adaptado para áreas seguras de pantallas modernas (`viewport-fit=cover`).
2.  **Estilo (CSS3):** Diseño premium basado en variables de CSS (Custom Properties) para soporte de temas automático. Diseños adaptables (responsivos) mediante CSS Grid y Flexbox.
3.  **Lógica (JavaScript ES6+):** Programación orientada a objetos modular con almacenamiento persistente encapsulado mediante una clase de gestión de estado (`TEOSStore`).
4.  **Service Worker (Offline):** Registro de `sw.js` para almacenamiento en caché local de los archivos estáticos necesarios para garantizar el acceso offline en todo momento.

---

## 📂 Estructura del Proyecto

```bash
TEOS/
├── assets/                       # Iconos y favicons adaptados a múltiples dispositivos
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   ├── apple-touch-icon.png
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── favicon.ico
│   └── site.webmanifest
├── index.html                    # Estructura principal y layouts de las pantallas
├── style.css                     # Hojas de estilo con diseño y animaciones iOS
├── app.js                        # Lógica de la aplicación, control de estado y vistas
├── sw.js                         # Service Worker para capacidades sin conexión
├── manifest.json                 # Configuración de instalación PWA
├── teos_logo.png                 # Logo oficial del sistema
└── README.md                     # Documentación del proyecto
```

---

## 🚀 Instalación y Uso Local

Al ser una aplicación basada en tecnologías web nativas, no requiere compilación ni dependencias complejas de NodeJS. Puedes ejecutarla de las siguientes maneras:

### Opción 1: Abrir directamente (Básico)
Simplemente haz doble clic en el archivo [index.html](file:///c:/Users/ander/Documents/Proyectos/TEOS/index.html) desde tu explorador de archivos para abrirlo en cualquier navegador web.
> [!NOTE]
> Para el correcto funcionamiento de las capacidades de PWA (Service Worker) y almacenamiento persistente seguro en algunos navegadores, se recomienda servir la aplicación mediante un servidor local (ver opción 2).

### Opción 2: Servidor Local (Recomendado)
Puedes servir los archivos localmente utilizando herramientas sencillas:

*   **Usando Python:**
    ```bash
    python -m http.server 8080
    ```
    Luego ingresa a `http://localhost:8080` en tu navegador.

*   **Usando extensiones como VS Code Live Server:**
    Simplemente abre la carpeta del proyecto en VS Code y haz clic en **Go Live** en la barra inferior.

### Opción 3: Instalar como PWA
Cuando sirvas la aplicación localmente mediante `http://localhost` (o en un servidor HTTPS), verás un icono de instalación (+ o instalar aplicación) en la barra de direcciones de tu navegador web. Al hacer clic, se instalará como una aplicación nativa en tu dispositivo móvil o computadora.
