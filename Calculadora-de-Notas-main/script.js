// Función para calcular el peso total de las secciones
function calcularPesoTotal(numSecciones) {
    let pesoTotal = 0;
    for (let i = 0; i < numSecciones; i++) {
        const peso = parseFloat(document.getElementById(`peso-${i}`).value);
        pesoTotal += peso;
    }
    return pesoTotal;
}

// Función para verificar si los pesos suman 100%
function verificarPesoTotal(pesoTotal) {
    if (Math.abs(pesoTotal - 100) > 0.01) {
        return `<p>Los pesos de las secciones deben sumar 100%. Actualmente suman ${pesoTotal.toFixed(2)}%</p>`;
    }
    return null;
}

// Función para calcular la máxima nota alcanzable
function calcularMaximaNota(numSecciones) {
    let maximaNota = 0;
    for (let i = 0; i < numSecciones; i++) {
        const peso = parseFloat(document.getElementById(`peso-${i}`).value);
        maximaNota += 20 * (peso / 100); // Cada sección puede aportar hasta 20 * (peso/100)
    }
    return maximaNota;
}

// Función para calcular la nota final de todas las secciones
function calcularNotaFinal(numSecciones, notaObjetivo, usarEnteros) {
    let notaActual = 0;
    let examenesPendientes = [];
    let pesoTotalPendientes = 0;

    // Calcular la nota actual sin redondeo
    for (let i = 0; i < numSecciones; i++) {
        const peso = parseFloat(document.getElementById(`peso-${i}`).value);
        const nombreSeccion = document.getElementById(`nombre-seccion-${i}`).value;
        const numExamenes = parseInt(document.getElementById(`num-examenes-${i}`).value);

        let sumaNotas = 0;
        for (let j = 0; j < numExamenes; j++) {
            const examenRealizado = document.getElementById(`examen-realizado-${i}-${j}`).checked;
            const notaExamenInput = document.getElementById(`nota-examen-${i}-${j}`);
            
            if (examenRealizado && notaExamenInput.value !== '') {
                sumaNotas += parseFloat(notaExamenInput.value);
            } else {
                sumaNotas += 0;
                if (!examenRealizado) {
                    const pesoExamen = peso / numExamenes;
                    examenesPendientes.push({
                        seccion: nombreSeccion,
                        examen: j + 1,
                        pesoExamen: pesoExamen
                    });
                    pesoTotalPendientes += pesoExamen;
                }
            }
        }

        const promedioSeccion = sumaNotas / numExamenes;
        notaActual += promedioSeccion * (peso / 100);
    }

    // Calcular máxima nota alcanzable
    const maximaNotaAlcanzable = notaActual + (20 * pesoTotalPendientes / 100);

    // Verificar si el objetivo es alcanzable
    let objetivoAlcanzable = notaObjetivo <= maximaNotaAlcanzable;
    
    // Calcular notas necesarias para exámenes pendientes
    let examenNecesarioHtml = '';
    let mensajeAdicional = '';

    if (examenesPendientes.length > 0) {
        if (!objetivoAlcanzable) {
            mensajeAdicional = `<p class="advertencia">¡Atención! La máxima nota que puedes alcanzar es ${maximaNotaAlcanzable.toFixed(2)}</p>`;
        } else {
            const deficit = notaObjetivo - notaActual;
            const notaTotalNecesaria = (deficit * 100) / pesoTotalPendientes;
            
            // Verificar si la nota necesaria por examen es mayor a 20
            if (notaTotalNecesaria > 20) {
                objetivoAlcanzable = false;
                mensajeAdicional = `<p class="advertencia">¡Atención! La máxima nota que puedes alcanzar es ${maximaNotaAlcanzable.toFixed(2)}</p>`;
            } else {
                examenesPendientes.forEach(examen => {
                // Cambiar Math.round por Math.ceil para redondear siempre hacia arriba
                const notaMostrar = usarEnteros ? Math.ceil(notaTotalNecesaria) : notaTotalNecesaria.toFixed(2);
                examenNecesarioHtml += ` 
                    <p><strong>Examen ${examen.examen} (${examen.seccion}):</strong> 
                    Necesitas ${notaMostrar}</p>
                `;
                });
                
                mensajeAdicional = `<p>Con estos resultados podrías alcanzar ${notaObjetivo.toFixed(2)}</p>`;
            }
        }
    }

    return { 
        notaFinal: notaActual,
        examenNecesarioHtml,
        mensajeAdicional,
        objetivoAlcanzable,
        maximaNotaAlcanzable
    };
}

function mostrarResultados(notaFinal, notaObjetivo, examenNecesarioHtml, mensajeAdicional, objetivoAlcanzable, usarEnteros) {
    const resultadosDiv = document.getElementById("resultados");
    
    // Mostrar siempre nota final y objetivo con 2 decimales
    const notaFinalFormateada = notaFinal.toFixed(2);
    const notaObjetivoFormateada = notaObjetivo.toFixed(2);

    if (notaFinal >= notaObjetivo) {
        resultadosDiv.innerHTML = `
            <p><strong>Nota Final Calculada:</strong> ${notaFinalFormateada}</p>
            <p><strong>¡Felicidades, has alcanzado tu objetivo de ${notaObjetivoFormateada}!</strong></p>
        `;
    } else {
        let contenido = `
            <p><strong>Nota Final Calculada:</strong> ${notaFinalFormateada}</p>
            <p><strong>Nota Objetivo:</strong> ${notaObjetivoFormateada}</p>
        `;

        if (!objetivoAlcanzable) {
            contenido += `
                <p class="advertencia">Tu objetivo no es alcanzable</p>
                ${mensajeAdicional}
            `;
        } else {
            contenido += `
                <p><strong>Para alcanzar tu objetivo:</strong></p>
                ${examenNecesarioHtml}
                ${mensajeAdicional}
            `;
        }

        resultadosDiv.innerHTML = contenido;
    }
}

// Función para actualizar las notas necesarias
function calcularNotasNecesarias() {
    const numSecciones = parseInt(document.getElementById("num-secciones").value);
    const notaMinima = parseFloat(document.getElementById("nota-minima").value);
    const notaObjetivoSelect = document.getElementById("nota-objetivo");
    const usarEnteros = document.getElementById("nota-entera").checked;
    
    // Determinar nota objetivo
    let notaObjetivo = notaMinima;
    if (notaObjetivoSelect.value !== "minima") {
        notaObjetivo = parseFloat(notaObjetivoSelect.value);
    }
    
    const pesoTotal = calcularPesoTotal(numSecciones);
    const error = verificarPesoTotal(pesoTotal);
    if (error) {
        document.getElementById("resultados").innerHTML = error;
        return;
    }

    const { 
        notaFinal, 
        examenNecesarioHtml, 
        mensajeAdicional,
        objetivoAlcanzable
    } = calcularNotaFinal(numSecciones, notaObjetivo, usarEnteros);
    
    mostrarResultados(
        notaFinal, 
        notaObjetivo, 
        examenNecesarioHtml, 
        mensajeAdicional, 
        objetivoAlcanzable,
        usarEnteros
    );
}

// Función para actualizar los exámenes según el número de exámenes por sección
function actualizarExamenes(index) {
    const numExamenes = parseInt(document.getElementById(`num-examenes-${index}`).value);
    const container = document.getElementById(`examenes-container-${index}`);
    container.innerHTML = ''; // Limpiar el contenedor

    for (let i = 0; i < numExamenes; i++) {
        const notaExamenId = `nota-examen-${index}-${i}`;
        const examenRealizadoId = `examen-realizado-${index}-${i}`;

        container.innerHTML += `
            <div class="input-group examen-group">
                <label for="${notaExamenId}">Nota del Examen ${i + 1}:</label>
                <input type="number" id="${notaExamenId}" min="0" max="20" step="0.01" placeholder="Nota" required disabled>
                <div class="realizado-container">
                    <label for="${examenRealizadoId}">Realizado</label>
                    <input type="checkbox" id="${examenRealizadoId}">
                </div>
            </div>
        `;
    }
}

// Función para habilitar/deshabilitar la entrada de notas de examen
function manejarCheckboxExamen(checkbox) {
    const idParts = checkbox.id.split("-");
    const sectionIndex = idParts[2];
    const examIndex = idParts[3];
    const notaExamenInput = document.getElementById(`nota-examen-${sectionIndex}-${examIndex}`);

    if (checkbox.checked) {
        notaExamenInput.disabled = false;
    } else {
        notaExamenInput.disabled = true;
        notaExamenInput.value = ''; // Limpiar el valor cuando se desmarque
    }
    calcularNotasNecesarias();
}

// Event listeners
document.getElementById("num-secciones").addEventListener("input", function() {
    const numSecciones = parseInt(this.value);
    const container = document.getElementById("secciones-container");
    container.innerHTML = ''; // Limpiar el contenedor

    // Configurar nota mínima automática solo para 4 secciones
    if (numSecciones === 4) {
        document.getElementById("nota-minima").value = "10.5";
    }

    for (let i = 0; i < numSecciones; i++) {
        let nombreDefault = "";
        let numExamenesDefault = 1;
        let pesoDefault = "";
        
        // Configuración para 4 secciones específicas
        if (numSecciones === 4) {
            switch(i) {
                case 0:
                    nombreDefault = "Practicas Calificadas";
                    numExamenesDefault = 4;
                    pesoDefault = "40";
                    break;
                case 1:
                    nombreDefault = "Examen Parcial";
                    numExamenesDefault = 1;
                    pesoDefault = "25";
                    break;
                case 2:
                    nombreDefault = "Examen Final";
                    numExamenesDefault = 1;
                    pesoDefault = "25";
                    break;
                case 3:
                    nombreDefault = "Trabajo Encargado";
                    numExamenesDefault = 1;
                    pesoDefault = "10";
                    break;
            }
        } else {
            nombreDefault = `Sección ${i + 1}`;
        }

        container.innerHTML += `
            <div class="seccion">
                <label for="nombre-seccion-${i}">Nombre de la Sección ${i + 1}:</label>
                <input type="text" id="nombre-seccion-${i}" value="${nombreDefault}" placeholder="Nombre de la sección">
                
                <label for="peso-${i}">Peso de la Sección ${i + 1} (%):</label>
                <input type="number" id="peso-${i}" min="0" max="100" value="${pesoDefault}" placeholder="Peso" required>
                
                <div class="input-group">
                    <label for="num-examenes-${i}">Número de Exámenes:</label>
                    <input type="number" id="num-examenes-${i}" min="1" value="${numExamenesDefault}" placeholder="Número de exámenes" required>
                </div>

                <div id="examenes-container-${i}"></div>
            </div>
        `;
    }
    
    // Actualizar los contenedores de exámenes para cada sección
    for (let i = 0; i < numSecciones; i++) {
        actualizarExamenes(i);
    }
    
    calcularNotasNecesarias();
});

//Checkbox para usar notas enteras
document.getElementById("form-notas").addEventListener("submit", function(event) {
    event.preventDefault();
    calcularNotasNecesarias();
});

document.getElementById("secciones-container").addEventListener("input", function(event) {
    if (event.target.id.startsWith("num-examenes-")) {
        const index = event.target.id.split("-")[2];
        actualizarExamenes(index);
    }
});

document.getElementById("secciones-container").addEventListener("change", function(event) {
    if (event.target.type === "checkbox" && event.target.id.startsWith("examen-realizado-")) {
        manejarCheckboxExamen(event.target);
    }
});

// Toggle Menu
document.getElementById('menu-btn').addEventListener('click', function(event) {
    event.stopPropagation(); // Evita que el clic se propague y cierre inmediatamente
    const dropdown = document.getElementById('menu-dropdown');
    dropdown.classList.toggle('show');
});

// Close menu when clicking outside
document.addEventListener('click', function(event) {
    const menuBtn = document.getElementById('menu-btn');
    const dropdown = document.getElementById('menu-dropdown');
    
    if (!menuBtn.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// Dark Mode Toggle
document.getElementById('dark-mode-toggle').addEventListener('change', function() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', this.checked);
});

// Check for saved dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
    document.getElementById('dark-mode-toggle').checked = true;
    document.body.classList.add('dark-mode');
}