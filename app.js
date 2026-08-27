/* ==========================================================================
   TEOS - Application Logic & State Store (iOS Web App)
   ========================================================================== */

const STORAGE_KEY = 'TEOS_APP_DATA_V1';
const THEME_KEY = 'TEOS_THEME_PREF';

const DAYS_MAP = [
  { code: 'LU', name: 'Lunes', short: 'Lun' },
  { code: 'MA', name: 'Martes', short: 'Mar' },
  { code: 'MI', name: 'Miércoles', short: 'Mié' },
  { code: 'JU', name: 'Jueves', short: 'Jue' },
  { code: 'VI', name: 'Viernes', short: 'Vie' },
  { code: 'SA', name: 'Sábado', short: 'Sáb' },
  { code: 'DO', name: 'Domingo', short: 'Dom' }
];

// Initial empty state for user custom data
const INITIAL_EMPTY_DATA = {
  courses: [],
  tasks: []
};

/* --- Data Store Module --- */
class TEOSStore {
  static loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.saveData(INITIAL_EMPTY_DATA);
        return INITIAL_EMPTY_DATA;
      }
      const data = JSON.parse(raw);
      // Clean previous mock data if present
      if (data && data.courses && data.courses.some(c => c.id && c.id.startsWith('course-calc-3'))) {
        this.saveData(INITIAL_EMPTY_DATA);
        return INITIAL_EMPTY_DATA;
      }
      return data;
    } catch (e) {
      console.error('Error al cargar LocalStorage:', e);
      return INITIAL_EMPTY_DATA;
    }
  }

  static saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error al guardar en LocalStorage:', e);
    }
  }

  static getCourses() {
    return this.loadData().courses || [];
  }

  static getCourseById(id) {
    return this.getCourses().find(c => c.id === id);
  }

  static saveCourse(courseData) {
    const data = this.loadData();
    const existingIndex = data.courses.findIndex(c => c.id === courseData.id);
    
    if (existingIndex >= 0) {
      // Preserve simulator data if not provided
      if (!courseData.simulator && data.courses[existingIndex].simulator) {
        courseData.simulator = data.courses[existingIndex].simulator;
      }
      data.courses[existingIndex] = courseData;
    } else {
      if (!courseData.id) courseData.id = 'course-' + Date.now();
      data.courses.push(courseData);
    }
    
    this.saveData(data);
    return courseData;
  }

  static deleteCourse(id) {
    const data = this.loadData();
    data.courses = data.courses.filter(c => c.id !== id);
    // Remove tasks linked to this course
    data.tasks = data.tasks.filter(t => t.courseId !== id);
    this.saveData(data);
  }

  static getTasks() {
    return this.loadData().tasks || [];
  }

  static saveTask(taskData) {
    const data = this.loadData();
    const existingIndex = data.tasks.findIndex(t => t.id === taskData.id);
    
    if (existingIndex >= 0) {
      data.tasks[existingIndex] = taskData;
    } else {
      if (!taskData.id) taskData.id = 'task-' + Date.now();
      data.tasks.push(taskData);
    }
    
    this.saveData(data);
    return taskData;
  }

  static toggleTask(id) {
    const data = this.loadData();
    const task = data.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveData(data);
    }
  }

  static deleteTask(id) {
    const data = this.loadData();
    data.tasks = data.tasks.filter(t => t.id !== id);
    this.saveData(data);
  }

  static saveCourseSimulator(courseId, simulatorData) {
    const data = this.loadData();
    const course = data.courses.find(c => c.id === courseId);
    if (course) {
      course.simulator = simulatorData;
      this.saveData(data);
    }
  }

  static clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/* --- Main Application Class --- */
class TEOSApp {
  constructor() {
    this.currentCourseId = null;
    this.activeScheduleDate = new Date();
    this.selectedScheduleDay = this.getDayCodeFromDate(this.activeScheduleDate);
    this.activeTaskFilter = 'pending';

    this.initElements();
    this.initTheme();
    this.bindEvents();
    this.renderCurrentDate();
    this.renderAll();
  }

  initElements() {
    // Header
    this.headerTitle = document.getElementById('headerTitle');
    this.btnHeaderSettings = document.getElementById('btnHeaderSettings');
    
    // Navigation Tabs
    this.tabItems = document.querySelectorAll('.tab-item');
    this.screens = document.querySelectorAll('.screen');

    // Home Screen
    this.currentDateDisplay = document.getElementById('currentDateDisplay');
    this.nextClassCard = document.getElementById('nextClassCard');
    this.nextClassName = document.getElementById('nextClassName');
    this.nextClassTime = document.getElementById('nextClassTime');
    this.nextClassRoom = document.getElementById('nextClassRoom');
    this.nextClassTeacher = document.getElementById('nextClassTeacher');
    this.nextTaskTitle = document.getElementById('nextTaskTitle');
    this.nextTaskTime = document.getElementById('nextTaskTime');
    this.btnOpenAddTaskFromHome = document.getElementById('btnOpenAddTaskFromHome');

    // Horario Screen
    this.dayTabsContainer = document.getElementById('dayTabsContainer');
    this.scheduleListContainer = document.getElementById('scheduleListContainer');
    this.btnOpenCalendarPicker = document.getElementById('btnOpenCalendarPicker');
    this.calendarPickerInput = document.getElementById('calendarPickerInput');

    // Cursos Screen
    this.coursesListContainer = document.getElementById('coursesListContainer');
    this.btnOpenAddCourse = document.getElementById('btnOpenAddCourse');

    // Detalle Curso Screen
    this.btnBackToCourses = document.getElementById('btnBackToCourses');
    this.detailCourseName = document.getElementById('detailCourseName');
    this.detailCourseColorBadge = document.getElementById('detailCourseColorBadge');
    this.detailCourseTime = document.getElementById('detailCourseTime');
    this.detailCourseDays = document.getElementById('detailCourseDays');
    this.detailCourseRoom = document.getElementById('detailCourseRoom');
    this.detailCourseTeacher = document.getElementById('detailCourseTeacher');
    this.detailCourseAverage = document.getElementById('detailCourseAverage');
    this.btnOpenSimulatorFromDetail = document.getElementById('btnOpenSimulatorFromDetail');
    this.btnEditCourse = document.getElementById('btnEditCourse');
    this.btnDeleteCourse = document.getElementById('btnDeleteCourse');

    // Simulador Screen
    this.btnBackFromSimulator = document.getElementById('btnBackFromSimulator');
    this.simulatorCourseTitle = document.getElementById('simulatorCourseTitle');
    this.simNumSecciones = document.getElementById('simNumSecciones');
    this.simNotaMinima = document.getElementById('simNotaMinima');
    this.simNotaObjetivoSelect = document.getElementById('simNotaObjetivoSelect');
    this.simUsarEnteros = document.getElementById('simUsarEnteros');
    this.simSeccionesContainer = document.getElementById('simSeccionesContainer');
    this.btnCalculateSimulation = document.getElementById('btnCalculateSimulation');
    this.simResultCard = document.getElementById('simResultCard');
    this.simResultBody = document.getElementById('simResultBody');

    // Tareas Screen
    this.btnOpenAddTaskFromTareas = document.getElementById('btnOpenAddTaskFromTareas');
    this.tasksListContainer = document.getElementById('tasksListContainer');
    this.taskChips = document.querySelectorAll('.tasks-filter-bar .chip');

    // Configuración Screen
    this.configThemeSelect = document.getElementById('configThemeSelect');
    this.btnInstallPWA = document.getElementById('btnInstallPWA');
    this.btnExportData = document.getElementById('btnExportData');
    this.btnImportDataTrigger = document.getElementById('btnImportDataTrigger');
    this.importFileInput = document.getElementById('importFileInput');
    this.btnClearData = document.getElementById('btnClearData');

    // Modals
    this.modalCourse = document.getElementById('modalCourse');
    this.modalCourseTitle = document.getElementById('modalCourseTitle');
    this.formCourse = document.getElementById('formCourse');
    this.courseIdHidden = document.getElementById('courseIdHidden');
    this.courseNameInput = document.getElementById('courseNameInput');
    this.courseStartTimeInput = document.getElementById('courseStartTimeInput');
    this.courseEndTimeInput = document.getElementById('courseEndTimeInput');
    this.courseRoomInput = document.getElementById('courseRoomInput');
    this.courseTeacherInput = document.getElementById('courseTeacherInput');
    this.courseDaysChips = document.getElementById('courseDaysChips');
    this.colorPickerRow = document.getElementById('colorPickerRow');
    this.btnCancelCourseModal = document.getElementById('btnCancelCourseModal');
    this.btnSaveCourseModal = document.getElementById('btnSaveCourseModal');

    this.modalTask = document.getElementById('modalTask');
    this.modalTaskTitle = document.getElementById('modalTaskTitle');
    this.formTask = document.getElementById('formTask');
    this.taskIdHidden = document.getElementById('taskIdHidden');
    this.taskTitleInput = document.getElementById('taskTitleInput');
    this.taskCourseSelect = document.getElementById('taskCourseSelect');
    this.taskDueDateInput = document.getElementById('taskDueDateInput');
    this.taskDueTimeInput = document.getElementById('taskDueTimeInput');
    this.btnCancelTaskModal = document.getElementById('btnCancelTaskModal');
    this.btnSaveTaskModal = document.getElementById('btnSaveTaskModal');

    // iOS Custom Alert & PWA Install Modals
    this.iosAlertModal = document.getElementById('iosAlertModal');
    this.iosAlertTitle = document.getElementById('iosAlertTitle');
    this.iosAlertMessage = document.getElementById('iosAlertMessage');
    this.iosAlertActions = document.getElementById('iosAlertActions');

    this.iosInstallModal = document.getElementById('iosInstallModal');
    this.btnCloseInstallModal = document.getElementById('btnCloseInstallModal');
  }

  /* --- Custom iOS Alert & Confirm Modals --- */
  showConfirm({ title, message, confirmText = 'Aceptar', isDanger = true, onConfirm }) {
    this.iosAlertTitle.textContent = title;
    this.iosAlertMessage.textContent = message;
    this.iosAlertActions.className = 'ios-alert-actions';
    
    this.iosAlertActions.innerHTML = `
      <button class="ios-alert-btn cancel" id="btnAlertCancel">Cancelar</button>
      <button class="ios-alert-btn ${isDanger ? 'danger' : 'confirm-primary'}" id="btnAlertConfirm">${confirmText}</button>
    `;

    const closeAlert = () => this.iosAlertModal.classList.remove('active');

    document.getElementById('btnAlertCancel').onclick = () => closeAlert();
    document.getElementById('btnAlertConfirm').onclick = () => {
      closeAlert();
      if (onConfirm) onConfirm();
    };

    this.iosAlertModal.classList.add('active');
  }

  showAlert({ title, message, buttonText = 'OK', onOk }) {
    this.iosAlertTitle.textContent = title;
    this.iosAlertMessage.textContent = message;
    this.iosAlertActions.className = 'ios-alert-actions single-action';
    
    this.iosAlertActions.innerHTML = `
      <button class="ios-alert-btn confirm-primary" id="btnAlertOk">${buttonText}</button>
    `;

    const closeAlert = () => this.iosAlertModal.classList.remove('active');

    document.getElementById('btnAlertOk').onclick = () => {
      closeAlert();
      if (onOk) onOk();
    };

    this.iosAlertModal.classList.add('active');
  }

  getTodayCode() {
    const days = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
    return days[new Date().getDay()];
  }

  initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'auto';
    this.configThemeSelect.value = savedTheme;
    this.applyTheme(savedTheme);
  }

  applyTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-auto');
    if (theme === 'dark') {
      document.body.classList.add('theme-dark');
      document.body.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      document.body.classList.add('theme-light');
      document.body.setAttribute('data-theme', 'light');
    } else {
      document.body.classList.add('theme-auto');
      const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.setAttribute('data-theme', isSystemDark ? 'dark' : 'light');
    }
  }

  bindEvents() {
    // Navigation Tabs
    this.tabItems.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetScreenId = tab.getAttribute('data-target');
        this.navigateToScreen(targetScreenId);
      });
    });

    this.btnHeaderSettings.addEventListener('click', () => {
      this.navigateToScreen('screenConfiguracion');
    });

    // Add Course Modal Triggers
    this.btnOpenAddCourse.addEventListener('click', () => {
      this.openCourseModal();
    });

    this.btnCancelCourseModal.addEventListener('click', () => {
      this.closeCourseModal();
    });

    this.btnSaveCourseModal.addEventListener('click', () => {
      this.saveCourseFromModal();
    });

    // Days Chips inside Course Modal
    this.courseDaysChips.querySelectorAll('.day-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
      });
    });

    // Color Picker Dots inside Course Modal
    this.colorPickerRow.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        this.colorPickerRow.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
      });
    });

    // Add Task Modal Triggers
    this.btnOpenAddTaskFromHome.addEventListener('click', () => {
      this.openTaskModal();
    });

    this.btnOpenAddTaskFromTareas.addEventListener('click', () => {
      this.openTaskModal();
    });

    this.btnCancelTaskModal.addEventListener('click', () => {
      this.closeTaskModal();
    });

    this.btnSaveTaskModal.addEventListener('click', () => {
      this.saveTaskFromModal();
    });

    // Task Filter Chips
    this.taskChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.taskChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeTaskFilter = chip.getAttribute('data-filter');
        this.renderTasksList();
      });
    });

    // Detalle Curso Navigation
    this.btnBackToCourses.addEventListener('click', () => {
      this.navigateToScreen('screenCursos');
    });

    this.btnOpenSimulatorFromDetail.addEventListener('click', () => {
      this.openSimulatorScreen(this.currentCourseId);
    });

    this.btnEditCourse.addEventListener('click', () => {
      const course = TEOSStore.getCourseById(this.currentCourseId);
      if (course) this.openCourseModal(course);
    });

    this.btnDeleteCourse.addEventListener('click', () => {
      this.showConfirm({
        title: 'Eliminar Curso',
        message: '¿Estás seguro de que deseas eliminar este curso?',
        confirmText: 'Eliminar',
        isDanger: true,
        onConfirm: () => {
          TEOSStore.deleteCourse(this.currentCourseId);
          this.navigateToScreen('screenCursos');
          this.renderAll();
        }
      });
    });

    if (this.calendarPickerInput) {
      this.calendarPickerInput.addEventListener('change', (e) => {
        if (e.target.value) {
          const parts = e.target.value.split('-');
          const selDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          this.activeScheduleDate = selDate;
          this.selectedScheduleDay = this.getDayCodeFromDate(selDate);
          this.renderScheduleView();
        }
      });
    }

    // Simulador Screen Events
    this.btnBackFromSimulator.addEventListener('click', () => {
      this.navigateToScreen('screenDetalleCurso');
    });

    this.simNumSecciones.addEventListener('change', () => {
      this.onSimulatorControlsChange();
    });

    this.simNotaMinima.addEventListener('input', () => {
      if (this.activeSimulatorData && this.currentCourseId) {
        this.activeSimulatorData.notaMinima = parseFloat(this.simNotaMinima.value) || 10.5;
        TEOSStore.saveCourseSimulator(this.currentCourseId, this.activeSimulatorData);
      }
      this.calculateSimulatorResult();
    });

    this.simNotaObjetivoSelect.addEventListener('change', () => {
      if (this.activeSimulatorData && this.currentCourseId) {
        this.activeSimulatorData.notaObjetivoSelect = this.simNotaObjetivoSelect.value;
        TEOSStore.saveCourseSimulator(this.currentCourseId, this.activeSimulatorData);
      }
      this.calculateSimulatorResult();
    });

    this.simUsarEnteros.addEventListener('change', () => {
      if (this.activeSimulatorData && this.currentCourseId) {
        this.activeSimulatorData.usarEnteros = this.simUsarEnteros.checked;
        TEOSStore.saveCourseSimulator(this.currentCourseId, this.activeSimulatorData);
      }
      this.calculateSimulatorResult();
    });

    this.btnCalculateSimulation.addEventListener('click', () => {
      this.calculateSimulatorResult();
      this.simResultCard.scrollIntoView({ behavior: 'smooth' });
    });

    // Configuration Screen Events
    this.configThemeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      localStorage.setItem(THEME_KEY, theme);
      this.applyTheme(theme);
    });

    this.btnExportData.addEventListener('click', () => {
      this.exportData();
    });

    this.btnImportDataTrigger.addEventListener('click', () => {
      this.importFileInput.click();
    });

    this.importFileInput.addEventListener('change', (e) => {
      this.importData(e);
    });

    this.btnClearData.addEventListener('click', () => {
      this.showConfirm({
        title: 'Borrar Todo',
        message: '¡ATENCIÓN! Se borrarán todos los cursos, horario y tareas. ¿Deseas continuar?',
        confirmText: 'Borrar todo',
        isDanger: true,
        onConfirm: () => {
          TEOSStore.clearAll();
          location.reload();
        }
      });
    });

    // PWA Installation Handling
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });

    if (this.btnInstallPWA) {
      this.btnInstallPWA.addEventListener('click', () => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        if (isStandalone) {
          this.showAlert({
            title: 'App Ya Instalada',
            message: 'TEOS ya está instalada en tu dispositivo y ejecutándose como App.'
          });
          return;
        }

        if (this.isIOS()) {
          // Force showing iOS / Safari step-by-step modal guide on iPhone/iPad
          if (this.iosInstallModal) {
            this.iosInstallModal.classList.add('active');
          }
        } else if (this.deferredPrompt) {
          // Native PWA prompt for Android / Desktop Chrome
          this.deferredPrompt.prompt();
          this.deferredPrompt.userChoice.then((choice) => {
            if (choice.outcome === 'accepted') {
              console.log('Instalación PWA aceptada');
            }
            this.deferredPrompt = null;
          });
        } else {
          // Fallback showing modal guide if no prompt available
          if (this.iosInstallModal) {
            this.iosInstallModal.classList.add('active');
          }
        }
      });
    }

    if (this.btnCloseInstallModal) {
      this.btnCloseInstallModal.addEventListener('click', () => {
        if (this.iosInstallModal) {
          this.iosInstallModal.classList.remove('active');
        }
      });
    }
  }

  navigateToScreen(screenId) {
    this.screens.forEach(s => s.classList.remove('active'));
    this.tabItems.forEach(t => t.classList.remove('active'));

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) targetScreen.classList.add('active');

    // Update active tab button if applicable
    const activeTab = document.querySelector(`.tab-item[data-target="${screenId}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
    }

    // Refresh rendering when opening screens
    if (screenId === 'screenInicio') this.renderHomeView();
    if (screenId === 'screenHorario') this.renderScheduleView();
    if (screenId === 'screenCursos') this.renderCoursesView();
    if (screenId === 'screenTareas') this.renderTasksList();
  }

  renderCurrentDate() {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateStr = new Date().toLocaleDateString('es-ES', options);
    // Capitalize first letter (e.g. "Jueves, 6 de Agosto")
    const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    this.currentDateDisplay.textContent = formattedDate;
  }

  renderAll() {
    this.renderHomeView();
    this.renderScheduleView();
    this.renderCoursesView();
    this.renderTasksList();
  }

  isIOS() {
    const ua = window.navigator.userAgent || '';
    const isIOSUA = /iPhone|iPad|iPod/i.test(ua);
    const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return isIOSUA || isIPadOS;
  }

  /* --- 1. HOME VIEW --- */
  renderHomeView() {
    const courses = TEOSStore.getCourses();
    const todayCode = this.getTodayCode();

    const now = new Date();
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Find next class for today (one that has not ended yet)
    const todayClasses = courses.filter(c => c.days.includes(todayCode))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const upcomingClass = todayClasses.find(c => c.endTime.localeCompare(currentHHMM) > 0);

    if (upcomingClass) {
      this.nextClassName.textContent = upcomingClass.name;
      this.nextClassTime.textContent = `Hora: ${this.formatTime12h(upcomingClass.startTime)} - ${this.formatTime12h(upcomingClass.endTime)}`;
      this.nextClassRoom.textContent = `Aula: ${upcomingClass.room || 'No asignada'}`;
      this.nextClassTeacher.textContent = `Profesor: ${upcomingClass.teacher || 'No asignado'}`;
      if (this.nextClassCard) {
        this.nextClassCard.style.background = upcomingClass.color || '#007AFF';
        this.nextClassCard.style.boxShadow = `0 8px 25px ${upcomingClass.color || '#007AFF'}40`;
      }
    } else {
      if (this.nextClassCard) {
        this.nextClassCard.style.background = '';
        this.nextClassCard.style.boxShadow = '';
      }
      
      if (courses.length === 0) {
        this.nextClassName.textContent = 'Sin clases registradas';
        this.nextClassTime.textContent = 'Añade un curso desde Mis Cursos';
      } else {
        this.nextClassName.textContent = 'Ya no tienes clases por hoy';
        this.nextClassTime.textContent = '¡Disfruta tu tiempo libre!';
      }
      this.nextClassRoom.textContent = '-';
      this.nextClassTeacher.textContent = '-';
    }

    // Find next task for the current day
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayYYYYMMDD = `${year}-${month}-${day}`;

    const todayTasks = TEOSStore.getTasks().filter(t => !t.completed && t.dueDate === todayYYYYMMDD);

    if (todayTasks.length > 0) {
      todayTasks.sort((a, b) => {
        if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
        if (a.dueTime) return -1;
        if (b.dueTime) return 1;
        return 0;
      });

      const firstTask = todayTasks[0];
      this.nextTaskTitle.textContent = firstTask.title;
      this.nextTaskTime.textContent = firstTask.dueTime ? `Hora: ${this.formatTime12h(firstTask.dueTime)}` : 'Pendiente hoy';
    } else {
      this.nextTaskTitle.textContent = 'Ya no tienes tareas por hoy';
      this.nextTaskTime.textContent = '¡Buen trabajo!';
    }
  }

  getDayCodeFromDate(date) {
    const dayIndex = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const map = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
    return map[dayIndex];
  }

  getFiveDayWindow(centerDate) {
    const days = [];
    for (let i = -2; i <= 2; i++) {
      const d = new Date(centerDate);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }

  /* --- 2. HORARIO VIEW --- */
  renderScheduleView() {
    // Render 5-Day Segmented Bar (Matching Sketch)
    this.dayTabsContainer.innerHTML = '';
    const fiveDays = this.getFiveDayWindow(this.activeScheduleDate);

    fiveDays.forEach(dayObj => {
      const code = this.getDayCodeFromDate(dayObj);
      const isToday = dayObj.toDateString() === new Date().toDateString();
      const isSelected = dayObj.toDateString() === this.activeScheduleDate.toDateString();

      const shortNames = { 'LU': 'LU', 'MA': 'MA', 'MI': 'MI', 'JU': 'JU', 'VI': 'VI', 'SA': 'SA', 'DO': 'DO' };
      const topLabel = isToday ? 'HOY' : shortNames[code];

      const dd = String(dayObj.getDate()).padStart(2, '0');
      const mm = String(dayObj.getMonth() + 1).padStart(2, '0');
      const bottomLabel = `${dd}.${mm}`;

      const segTab = document.createElement('div');
      segTab.className = `segmented-day-tab ${isSelected ? 'active' : ''}`;
      segTab.innerHTML = `
        <span class="seg-day-name">${topLabel}</span>
        <span class="seg-day-date">${bottomLabel}</span>
      `;
      segTab.addEventListener('click', () => {
        this.activeScheduleDate = dayObj;
        this.selectedScheduleDay = code;
        this.renderScheduleView();
      });
      this.dayTabsContainer.appendChild(segTab);
    });

    // Render Timeline Items for Selected Day
    const courses = TEOSStore.getCourses().filter(c => c.days.includes(this.selectedScheduleDay))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    this.scheduleListContainer.innerHTML = '';

    if (courses.length === 0) {
      this.scheduleListContainer.innerHTML = `
        <div class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <p>No tienes clases programadas este día.</p>
        </div>
      `;
      return;
    }

    courses.forEach(c => {
      const item = document.createElement('div');
      item.className = 'schedule-item';
      item.style.borderLeftColor = c.color || '#007AFF';
      item.innerHTML = `
        <div class="item-course">${c.name}</div>
        <div class="item-detail">⏰ ${this.formatTime12h(c.startTime)} - ${this.formatTime12h(c.endTime)}</div>
        <div class="item-detail">📍 Aula: ${c.room || 'Sin aula'} | 👨‍🏫 ${c.teacher || 'Sin profesor'}</div>
      `;
      item.addEventListener('click', () => {
        this.openCourseDetail(c.id);
      });
      this.scheduleListContainer.appendChild(item);
    });
  }

  calculateCourseAverage(course) {
    if (!course || !course.simulator || !course.simulator.secciones) return '0.00';
    
    let notaActual = 0;
    const secciones = course.simulator.secciones;

    secciones.forEach(sec => {
      const peso = parseFloat(sec.peso) || 0;
      const numExamenes = sec.examenes ? sec.examenes.length : 1;
      let sumaNotasSec = 0;

      if (sec.examenes) {
        sec.examenes.forEach(ex => {
          if (ex.realizado && ex.nota !== '') {
            sumaNotasSec += parseFloat(ex.nota);
          }
        });
      }

      const promedioSeccion = sumaNotasSec / numExamenes;
      notaActual += promedioSeccion * (peso / 100);
    });

    return notaActual.toFixed(2);
  }

  /* --- 3. MIS CURSOS VIEW --- */
  renderCoursesView() {
    const courses = TEOSStore.getCourses();
    this.coursesListContainer.innerHTML = '';

    if (courses.length === 0) {
      this.coursesListContainer.innerHTML = `
        <div class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          <p>No hay cursos registrados. Toca el botón + para añadir uno.</p>
        </div>
      `;
      return;
    }

    courses.forEach(c => {
      const daysText = c.days && c.days.length > 0 ? c.days.join(', ') : 'Sin días';
      const card = document.createElement('div');
      card.className = 'shortcut-card course-shortcut';
      card.style.backgroundColor = c.color || '#007AFF';
      card.style.boxShadow = `0 6px 20px ${c.color || '#007AFF'}35`;
      card.innerHTML = `
        <div class="shortcut-header compact-header">
          <div class="shortcut-title-group">
            <span class="shortcut-icon-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            </span>
            <h3 class="shortcut-title inline-title">${c.name}</h3>
          </div>
          <div class="shortcut-dots">•••</div>
        </div>
        <div class="shortcut-body-compact">
          <div class="shortcut-detail-text">🕒 ${this.formatTime12h(c.startTime)} - ${this.formatTime12h(c.endTime)} (${daysText})</div>
          <div class="shortcut-detail-text">📍 ${c.room || 'Aula no def.'} | 👨‍🏫 ${c.teacher || 'Profesor no def.'}</div>
        </div>
      `;
      card.addEventListener('click', () => {
        this.openCourseDetail(c.id);
      });
      this.coursesListContainer.appendChild(card);
    });
  }

  /* --- 4. DETALLE DEL CURSO --- */
  openCourseDetail(courseId) {
    const course = TEOSStore.getCourseById(courseId);
    if (!course) return;

    this.currentCourseId = course.id;
    this.detailCourseName.textContent = course.name;
    this.detailCourseColorBadge.style.backgroundColor = course.color || '#007AFF';
    this.detailCourseTime.textContent = `${this.formatTime12h(course.startTime)} - ${this.formatTime12h(course.endTime)}`;
    
    const daysFull = course.days ? course.days.map(code => {
      const d = DAYS_MAP.find(dm => dm.code === code);
      return d ? d.name : code;
    }).join(', ') : 'Ninguno';
    this.detailCourseDays.textContent = daysFull;

    this.detailCourseRoom.textContent = course.room || 'No especificada';
    this.detailCourseTeacher.textContent = course.teacher || 'No especificado';

    const avg = this.calculateCourseAverage(course);
    if (this.detailCourseAverage) {
      this.detailCourseAverage.textContent = `${avg} / 20`;
    }

    this.navigateToScreen('screenDetalleCurso');
  }

  /* --- 5. SIMULADOR DE NOTAS --- */
  openSimulatorScreen(courseId) {
    const course = TEOSStore.getCourseById(courseId);
    if (!course) return;

    this.currentCourseId = course.id;
    this.simulatorCourseTitle.textContent = `Simulador: ${course.name}`;

    // Initialize or load simulator state
    let simData = course.simulator;
    if (!simData) {
      // Default 4 sections like Calculadora-de-Notas-main
      simData = {
        numSecciones: 4,
        notaMinima: 10.5,
        usarEnteros: false,
        secciones: [
          { nombre: 'Practicas Calificadas', peso: 40, numExamenes: 4, examenes: [{nota:'', realizado:false}, {nota:'', realizado:false}, {nota:'', realizado:false}, {nota:'', realizado:false}] },
          { nombre: 'Examen Parcial', peso: 25, numExamenes: 1, examenes: [{nota:'', realizado:false}] },
          { nombre: 'Examen Final', peso: 25, numExamenes: 1, examenes: [{nota:'', realizado:false}] },
          { nombre: 'Trabajo Encargado', peso: 10, numExamenes: 1, examenes: [{nota:'', realizado:false}] }
        ]
      };
      TEOSStore.saveCourseSimulator(courseId, simData);
    }

    this.activeSimulatorData = simData;

    this.simNumSecciones.value = simData.numSecciones || 4;
    this.simNotaMinima.value = simData.notaMinima !== undefined ? simData.notaMinima : 10.5;
    this.simNotaObjetivoSelect.value = simData.notaObjetivoSelect || 'minima';
    this.simUsarEnteros.checked = !!simData.usarEnteros;

    this.renderSimulatorSections(simData);
    this.calculateSimulatorResult();
    this.navigateToScreen('screenSimulador');
  }

  onSimulatorControlsChange() {
    let numSecciones = parseInt(this.simNumSecciones.value) || 1;
    if (numSecciones < 1) numSecciones = 1;
    if (numSecciones > 10) numSecciones = 10;

    let simData = this.activeSimulatorData || { secciones: [] };

    // Auto set default 4 sections if count is 4
    if (numSecciones === 4 && (!simData.secciones || simData.secciones.length !== 4)) {
      this.simNotaMinima.value = 10.5;
      simData.secciones = [
        { nombre: 'Practicas Calificadas', peso: 40, numExamenes: 4, examenes: [{nota:'', realizado:false}, {nota:'', realizado:false}, {nota:'', realizado:false}, {nota:'', realizado:false}] },
        { nombre: 'Examen Parcial', peso: 25, numExamenes: 1, examenes: [{nota:'', realizado:false}] },
        { nombre: 'Examen Final', peso: 25, numExamenes: 1, examenes: [{nota:'', realizado:false}] },
        { nombre: 'Trabajo Encargado', peso: 10, numExamenes: 1, examenes: [{nota:'', realizado:false}] }
      ];
    } else {
      // Adjust existing sections array size
      const newSecciones = [];
      for (let i = 0; i < numSecciones; i++) {
        if (simData.secciones && simData.secciones[i]) {
          newSecciones.push(simData.secciones[i]);
        } else {
          newSecciones.push({
            nombre: `Sección ${i + 1}`,
            peso: Math.floor(100 / numSecciones),
            numExamenes: 1,
            examenes: [{ nota: '', realizado: false }]
          });
        }
      }
      simData.secciones = newSecciones;
    }

    simData.numSecciones = numSecciones;
    this.activeSimulatorData = simData;
    TEOSStore.saveCourseSimulator(this.currentCourseId, simData);

    this.renderSimulatorSections(simData);
    this.calculateSimulatorResult();
  }

  renderSimulatorSections(simData) {
    this.simSeccionesContainer.innerHTML = '';
    this.activeSimulatorData = simData;

    simData.secciones.forEach((sec, sIdx) => {
      const secCard = document.createElement('div');
      secCard.className = 'section-card';
      secCard.innerHTML = `
        <h4 class="section-card-title">Sección ${sIdx + 1}</h4>
        <div class="form-group">
          <label>Nombre de la sección</label>
          <input type="text" class="ios-input sec-name-input" data-sidx="${sIdx}" value="${sec.nombre || ''}" placeholder="ej. Prácticas Calificadas">
        </div>
        <div class="form-row-grid" style="margin-top: 10px;">
          <div class="form-group">
            <label>Porcentaje (%)</label>
            <input type="number" class="ios-input sec-peso-input" data-sidx="${sIdx}" min="0" max="100" value="${sec.peso !== undefined ? sec.peso : ''}" placeholder="ej. 40">
          </div>
          <div class="form-group">
            <label>N° Evaluaciones</label>
            <input type="number" class="ios-input sec-numex-input" data-sidx="${sIdx}" min="1" max="10" value="${sec.numExamenes || 1}">
          </div>
        </div>

        <div class="exams-list" id="examsContainer-${sIdx}">
          <!-- Exam rows -->
        </div>
      `;

      this.simSeccionesContainer.appendChild(secCard);
      this.renderExamRows(sIdx, sec);
    });

    // Attach Section Inputs Listeners
    this.simSeccionesContainer.querySelectorAll('.sec-name-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-sidx'));
        this.activeSimulatorData.secciones[idx].nombre = e.target.value;
        TEOSStore.saveCourseSimulator(this.currentCourseId, this.activeSimulatorData);
        this.calculateSimulatorResult();
      });
    });

    this.simSeccionesContainer.querySelectorAll('.sec-peso-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-sidx'));
        this.activeSimulatorData.secciones[idx].peso = parseFloat(e.target.value) || 0;
        TEOSStore.saveCourseSimulator(this.currentCourseId, this.activeSimulatorData);
        this.calculateSimulatorResult();
      });
    });

    this.simSeccionesContainer.querySelectorAll('.sec-numex-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-sidx'));
        let count = parseInt(e.target.value) || 1;
        if (count < 1) count = 1;
        
        this.activeSimulatorData.secciones[idx].numExamenes = count;
        // Resize examenes array
        const currentEx = this.activeSimulatorData.secciones[idx].examenes || [];
        const newEx = [];
        for (let j = 0; j < count; j++) {
          if (currentEx[j]) {
            newEx.push(currentEx[j]);
          } else {
            newEx.push({ nota: '', realizado: false });
          }
        }
        this.activeSimulatorData.secciones[idx].examenes = newEx;
        TEOSStore.saveCourseSimulator(this.currentCourseId, this.activeSimulatorData);

        this.renderExamRows(idx, this.activeSimulatorData.secciones[idx]);
        this.calculateSimulatorResult();
      });
    });
  }

  renderExamRows(sIdx, secData) {
    const container = document.getElementById(`examsContainer-${sIdx}`);
    if (!container) return;

    container.innerHTML = '';
    const examenes = secData.examenes || [];

    examenes.forEach((ex, eIdx) => {
      const row = document.createElement('div');
      row.className = 'exam-row';
      row.innerHTML = `
        <label>Evaluación ${eIdx + 1}</label>
        <input type="number" class="ios-input exam-score-input" min="0" max="20" step="0.1" 
          value="${ex.nota !== '' ? ex.nota : ''}" placeholder="Nota" ${!ex.realizado ? 'disabled' : ''}>
        <div class="realizado-badge">
          <span>Realizado</span>
          <label class="ios-switch">
            <input type="checkbox" class="exam-done-checkbox" ${ex.realizado ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
      `;

      const scoreInput = row.querySelector('.exam-score-input');
      const doneCheckbox = row.querySelector('.exam-done-checkbox');

      doneCheckbox.addEventListener('change', (e) => {
        ex.realizado = e.target.checked;
        scoreInput.disabled = !ex.realizado;
        if (!ex.realizado) scoreInput.value = '';
        ex.nota = scoreInput.value !== '' ? parseFloat(scoreInput.value) : '';
        TEOSStore.saveCourseSimulator(this.currentCourseId, this.activeSimulatorData);
        this.calculateSimulatorResult();
      });

      scoreInput.addEventListener('input', (e) => {
        ex.nota = e.target.value !== '' ? parseFloat(e.target.value) : '';
        TEOSStore.saveCourseSimulator(this.currentCourseId, this.activeSimulatorData);
        this.calculateSimulatorResult();
      });

      container.appendChild(row);
    });
  }

  /* Core Calculation Algorithm directly ported from Calculadora-de-Notas-main */
  calculateSimulatorResult() {
    const course = TEOSStore.getCourseById(this.currentCourseId);
    if (!course) return;

    let simData = this.activeSimulatorData || course.simulator;
    if (!simData) return;

    const numSecciones = simData.secciones ? simData.secciones.length : 0;
    const notaMinima = parseFloat(this.simNotaMinima.value) || 10.5;
    const selectVal = this.simNotaObjetivoSelect.value;
    const usarEnteros = this.simUsarEnteros.checked;

    simData.notaMinima = notaMinima;
    simData.usarEnteros = usarEnteros;

    let notaObjetivo = notaMinima;
    if (selectVal !== 'minima') {
      notaObjetivo = parseFloat(selectVal);
    }

    // 1. Verificar peso total sumando 100%
    let pesoTotal = 0;
    simData.secciones.forEach(s => pesoTotal += (parseFloat(s.peso) || 0));

    if (Math.abs(pesoTotal - 100) > 0.01) {
      this.simResultBody.innerHTML = `
        <div class="status-banner warning">
          <span>⚠️ Los pesos de las secciones deben sumar 100%. Actualmente suman <strong>${pesoTotal.toFixed(2)}%</strong></span>
        </div>
      `;
      return;
    }

    // 2. Calcular nota acumulada actual y lista de exámenes pendientes
    let notaActual = 0;
    let examenesPendientes = [];
    let pesoTotalPendientes = 0;

    simData.secciones.forEach((sec) => {
      const peso = parseFloat(sec.peso) || 0;
      const numExamenes = sec.examenes ? sec.examenes.length : 1;
      let sumaNotasSec = 0;

      sec.examenes.forEach((ex, eIdx) => {
        if (ex.realizado && ex.nota !== '') {
          sumaNotasSec += parseFloat(ex.nota);
        } else {
          const pesoExamen = peso / numExamenes;
          examenesPendientes.push({
            seccionNombre: sec.nombre || 'Sección',
            examenIndex: eIdx + 1,
            pesoExamen: pesoExamen
          });
          pesoTotalPendientes += pesoExamen;
        }
      });

      const promedioSeccion = sumaNotasSec / numExamenes;
      notaActual += promedioSeccion * (peso / 100);
    });

    const maximaNotaAlcanzable = notaActual + (20 * pesoTotalPendientes / 100);
    let objetivoAlcanzable = notaObjetivo <= maximaNotaAlcanzable + 0.001;

    const notaFinalFormateada = notaActual.toFixed(2);
    const notaObjetivoFormateada = notaObjetivo.toFixed(2);
    const maximaFormateada = maximaNotaAlcanzable.toFixed(2);

    let htmlContent = `
      <div class="result-stats-grid">
        <div class="stat-card">
          <span class="stat-label">Nota Acumulada</span>
          <span class="stat-value primary">${notaFinalFormateada}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Nota Objetivo</span>
          <span class="stat-value goal">${notaObjetivoFormateada}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Máx. Posible</span>
          <span class="stat-value max">${maximaFormateada}</span>
        </div>
      </div>
    `;

    if (notaActual >= notaObjetivo) {
      htmlContent += `
        <div class="status-banner success">
          <span>🎉 <strong>¡Felicidades!</strong> Ya has alcanzado tu objetivo de <strong>${notaObjetivoFormateada}</strong>.</span>
        </div>
      `;
    } else if (examenesPendientes.length === 0) {
      htmlContent += `
        <div class="status-banner warning">
          <span>⚠️ Ya has completado todas las evaluaciones. Tu nota final obtenida es <strong>${notaFinalFormateada}</strong>.</span>
        </div>
      `;
    } else {
      const deficit = notaObjetivo - notaActual;
      const notaTotalNecesaria = (deficit * 100) / pesoTotalPendientes;

      if (!objetivoAlcanzable || notaTotalNecesaria > 20) {
        htmlContent += `
          <div class="status-banner warning">
            <span>⚠️ <strong>Objetivo no alcanzable:</strong> Requieres más de 20 puntos por examen. La nota máxima que podrías alcanzar es <strong>${maximaFormateada}</strong>.</span>
          </div>
        `;
      } else {
        htmlContent += `
          <div class="status-banner info">
            <span>💡 Lograrás tu objetivo de <strong>${notaObjetivoFormateada}</strong> obteniendo las siguientes notas mínimas:</span>
          </div>

          <div class="result-subtitle">Notas requeridas por examen pendiente:</div>
          <div class="result-exams-list">
        `;

        examenesPendientes.forEach(ex => {
          const notaMostrar = usarEnteros ? Math.ceil(notaTotalNecesaria) : (notaTotalNecesaria < 0 ? '0.00' : notaTotalNecesaria.toFixed(2));
          htmlContent += `
            <div class="exam-result-item">
              <div class="exam-result-info">
                <span class="exam-result-title">Evaluación ${ex.examenIndex}</span>
                <span class="exam-result-sec">${ex.seccionNombre} (${ex.pesoExamen.toFixed(1)}%)</span>
              </div>
              <span class="badge-grade">Necesitas ${notaMostrar}</span>
            </div>
          `;
        });

        htmlContent += `</div>`;
      }
    }

    this.simResultBody.innerHTML = htmlContent;
  }

  /* --- 6. TAREAS VIEW --- */
  sortTasks(tasks) {
    return tasks.sort((a, b) => {
      // 1. Tasks with dueDate come before tasks without dueDate
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;

      // 2. Compare dueDate chronologically if both have it
      if (a.dueDate && b.dueDate) {
        const dateCmp = a.dueDate.localeCompare(b.dueDate);
        if (dateCmp !== 0) return dateCmp;
      }

      // 3. Same date or both without date: compare dueTime (tasks with specific time come first)
      if (a.dueTime && !b.dueTime) return -1;
      if (!a.dueTime && b.dueTime) return 1;
      if (a.dueTime && b.dueTime) {
        const timeCmp = a.dueTime.localeCompare(b.dueTime);
        if (timeCmp !== 0) return timeCmp;
      }

      // 4. In 'all' view, pending tasks come before completed if date/time is identical
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // 5. Alphabetical tie-breaker
      return (a.title || '').localeCompare(b.title || '');
    });
  }

  renderTasksList() {
    let tasks = TEOSStore.getTasks();
    if (this.activeTaskFilter === 'pending') {
      tasks = tasks.filter(t => !t.completed);
    } else if (this.activeTaskFilter === 'completed') {
      tasks = tasks.filter(t => t.completed);
    }

    this.sortTasks(tasks);

    this.tasksListContainer.innerHTML = '';

    if (tasks.length === 0) {
      this.tasksListContainer.innerHTML = `
        <div class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          <p>No hay tareas registradas en esta categoría.</p>
        </div>
      `;
      return;
    }

    const courses = TEOSStore.getCourses();

    tasks.forEach(t => {
      const course = courses.find(c => c.id === t.courseId);
      const courseName = course ? course.name : '';
      const courseColor = course ? course.color : '#8E8E93';

      const taskItem = document.createElement('div');
      taskItem.className = `task-item ${t.completed ? 'completed' : ''}`;
      taskItem.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''}>
        <div class="task-content">
          <div class="task-title">${t.title}</div>
          ${courseName ? `<div class="task-course" style="color:${courseColor}; font-weight:600; font-size:13px; margin-top:2px;">${courseName}</div>` : ''}
          <div class="task-meta">
            ${t.dueTime ? `🕒 ${this.formatTime12h(t.dueTime)}` : ''} ${t.dueDate ? `📅 ${t.dueDate}` : ''}
          </div>
        </div>
        <button class="task-delete-btn" aria-label="Eliminar Tarea">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      `;

      taskItem.querySelector('.task-checkbox').addEventListener('change', () => {
        TEOSStore.toggleTask(t.id);
        this.renderTasksList();
        this.renderHomeView();
      });

      taskItem.querySelector('.task-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        TEOSStore.deleteTask(t.id);
        this.renderTasksList();
        this.renderHomeView();
      });

      this.tasksListContainer.appendChild(taskItem);
    });
  }

  /* --- MODAL COURSE LOGIC --- */
  openCourseModal(courseToEdit = null) {
    this.formCourse.reset();
    this.courseDaysChips.querySelectorAll('.day-chip').forEach(c => c.classList.remove('active'));
    this.colorPickerRow.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));

    if (courseToEdit) {
      this.modalCourseTitle.textContent = 'Editar Curso';
      this.courseIdHidden.value = courseToEdit.id;
      this.courseNameInput.value = courseToEdit.name;
      this.courseStartTimeInput.value = courseToEdit.startTime;
      this.courseEndTimeInput.value = courseToEdit.endTime;
      this.courseRoomInput.value = courseToEdit.room || '';
      this.courseTeacherInput.value = courseToEdit.teacher || '';

      if (courseToEdit.days) {
        courseToEdit.days.forEach(code => {
          const chip = this.courseDaysChips.querySelector(`.day-chip[data-day="${code}"]`);
          if (chip) chip.classList.add('active');
        });
      }

      const activeColorDot = this.colorPickerRow.querySelector(`.color-dot[data-color="${courseToEdit.color}"]`);
      if (activeColorDot) activeColorDot.classList.add('active');
      else this.colorPickerRow.children[0].classList.add('active');

    } else {
      this.modalCourseTitle.textContent = 'Añadir Curso';
      this.courseIdHidden.value = '';
      this.colorPickerRow.children[0].classList.add('active');
    }

    this.modalCourse.classList.add('active');
  }

  closeCourseModal() {
    this.modalCourse.classList.remove('active');
  }

  saveCourseFromModal() {
    const name = this.courseNameInput.value.trim();
    const startTime = this.courseStartTimeInput.value;
    const endTime = this.courseEndTimeInput.value;

    if (!name || !startTime || !endTime) {
      this.showAlert({
        title: 'Campo Requerido',
        message: 'Por favor completa el nombre y el horario del curso.'
      });
      return;
    }

    const selectedDays = [];
    this.courseDaysChips.querySelectorAll('.day-chip.active').forEach(c => {
      selectedDays.push(c.getAttribute('data-day'));
    });

    const selectedColorDot = this.colorPickerRow.querySelector('.color-dot.active');
    const color = selectedColorDot ? selectedColorDot.getAttribute('data-color') : '#007AFF';

    const courseData = {
      id: this.courseIdHidden.value || undefined,
      name,
      startTime,
      endTime,
      days: selectedDays,
      room: this.courseRoomInput.value.trim(),
      teacher: this.courseTeacherInput.value.trim(),
      color
    };

    TEOSStore.saveCourse(courseData);
    this.closeCourseModal();
    this.renderAll();

    if (this.currentCourseId === courseData.id) {
      this.openCourseDetail(courseData.id);
    }
  }

  /* --- MODAL TASK LOGIC --- */
  openTaskModal() {
    this.formTask.reset();
    // Populate Course Select
    this.taskCourseSelect.innerHTML = '<option value="">-- Sin curso asignado --</option>';
    TEOSStore.getCourses().forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      this.taskCourseSelect.appendChild(opt);
    });

    this.modalTask.classList.add('active');
  }

  closeTaskModal() {
    this.modalTask.classList.remove('active');
  }

  saveTaskFromModal() {
    const title = this.taskTitleInput.value.trim();
    if (!title) {
      this.showAlert({
        title: 'Campo Requerido',
        message: 'Por favor ingresa la descripción de la tarea.'
      });
      return;
    }

    const taskData = {
      id: this.taskIdHidden.value || undefined,
      title,
      courseId: this.taskCourseSelect.value || null,
      dueDate: this.taskDueDateInput.value || null,
      dueTime: this.taskDueTimeInput.value || null,
      completed: false
    };

    TEOSStore.saveTask(taskData);
    this.closeTaskModal();
    this.renderTasksList();
    this.renderHomeView();
  }

  /* --- BACKUP & RESTORE DATA --- */
  exportData() {
    const data = TEOSStore.loadData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `TEOS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (importedData && Array.isArray(importedData.courses) && Array.isArray(importedData.tasks)) {
          TEOSStore.saveData(importedData);
          this.showAlert({
            title: 'Importación Exitosa',
            message: '¡Tus datos han sido importados con éxito!',
            onOk: () => this.renderAll()
          });
        } else {
          this.showAlert({
            title: 'Error de Formato',
            message: 'El archivo JSON no tiene el formato válido de TEOS.'
          });
        }
      } catch (err) {
        this.showAlert({
          title: 'Error de Lectura',
          message: 'Ocurrió un error al leer el archivo JSON.'
        });
      }
    };
    reader.readAsText(file);
  }

  formatTime12h(time24) {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m < 10 ? '0' + m : m} ${period}`;
  }
}

// Initialize TEOS App when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.teosApp = new TEOSApp();

  // Register PWA Service Worker for Offline capability
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('TEOS PWA Service Worker registrado con éxito:', reg.scope);
        reg.update();
      })
      .catch(err => console.error('Error al registrar Service Worker:', err));
  }
});
