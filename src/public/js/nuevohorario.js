document.addEventListener('DOMContentLoaded', function() {
    const horarioForm = document.getElementById('horarioForm');
    const errorDiv = document.getElementById('error-message');
    const successDiv = document.getElementById('success-message');
    
    // Activar/desactivar campos de día
    document.querySelectorAll('.dia-activo').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const camposDia = this.closest('.dia-card').querySelector('.dia-campos');
            if (this.checked) {
                camposDia.style.display = 'block';
            } else {
                camposDia.style.display = 'none';
                // Limpiar campos cuando se desactiva
                camposDia.querySelectorAll('input').forEach(input => {
                    if (input.type !== 'checkbox') {
                        input.value = '';
                    } else {
                        input.checked = false;
                    }
                });
            }
        });
    });

    // Manejar checkbox de descanso - deshabilitar campos de horario
    document.querySelectorAll('.dia-descanso').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const card = this.closest('.dia-card');
            const horarioFields = card.querySelector('.horario-fields');
            const inputs = horarioFields.querySelectorAll('input');
            
            if (this.checked) {
                // Deshabilitar y limpiar campos de horario
                inputs.forEach(input => {
                    input.disabled = true;
                    if (input.type !== 'checkbox') {
                        input.value = input.classList.contains('horas-extras') ? '0' : '';
                    }
                });
                horarioFields.style.opacity = '0.5';
            } else {
                // Habilitar campos de horario
                inputs.forEach(input => {
                    input.disabled = false;
                });
                horarioFields.style.opacity = '1';
            }
        });
    });

    if (horarioForm) {
        horarioForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const año = document.getElementById('año').value;
            const semana = document.getElementById('semana').value;
            const submitBtn = document.getElementById('submitBtn');
            
            // Reset mensajes
            errorDiv.classList.add('d-none');
            successDiv.classList.add('d-none');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Creando horario...';
            
            try {
                // Recolectar datos de los días
                const dias = [];
                
                // Usar diasSemanaData si está disponible (pasado desde Handlebars)
                const diasInfo = typeof diasSemanaData !== 'undefined' ? diasSemanaData : null;
                
                document.querySelectorAll('.dia-activo:checked').forEach((checkbox, idx) => {
                    const card = checkbox.closest('.dia-card');
                    const nombreDia = checkbox.getAttribute('data-dia');
                    
                    // Obtener campos
                    const fechaInput = card.querySelector('.dia-fecha');
                    const descansoCheckbox = card.querySelector('.dia-descanso');
                    const horaEntrada = card.querySelector('.hora-entrada');
                    const horaSalida = card.querySelector('.hora-salida');
                    const horasExtras = card.querySelector('.horas-extras');
                    const observaciones = card.querySelector('.observaciones');
                    
                    const esDescanso = descansoCheckbox ? descansoCheckbox.checked : false;
                    
                    // Construir objeto del día
                    const diaData = {
                        fecha: fechaInput ? fechaInput.value : new Date().toISOString(),
                        descanso: esDescanso
                    };
                    
                    // Si NO es descanso, incluir horarios
                    if (!esDescanso) {
                        diaData.hora_entrada = horaEntrada ? horaEntrada.value : '';
                        diaData.hora_salida = horaSalida ? horaSalida.value : '';
                        diaData.horas_extras = horasExtras ? parseFloat(horasExtras.value) || 0 : 0;
                    } else {
                        // En días de descanso, dejar campos vacíos
                        diaData.hora_entrada = '';
                        diaData.hora_salida = '';
                        diaData.horas_extras = 0;
                    }
                    
                    // Observaciones siempre se pueden agregar
                    diaData.observaciones = observaciones ? observaciones.value : '';
                    
                    dias.push(diaData);
                });

                // Validar que haya al menos un día seleccionado
                if (dias.length === 0) {
                    errorDiv.textContent = 'Debes seleccionar al menos un día';
                    errorDiv.classList.remove('d-none');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Crear Horario';
                    return;
                }

                console.log('📤 Enviando datos del horario:', {
                    año: parseInt(año),
                    semana: parseInt(semana),
                    dias: dias.length,
                    detalle: dias
                });

                const response = await fetch('/api/horarios', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        año: parseInt(año),
                        semana: parseInt(semana),
                        dias 
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    successDiv.textContent = data.message || 'Horario creado exitosamente';
                    successDiv.classList.remove('d-none');
                    
                    // Redirigir después de 2 segundos
                    setTimeout(() => {
                        window.location.href = '/horarios';
                    }, 2000);
                } else {
                    errorDiv.textContent = data.message || 'Error al crear el horario';
                    errorDiv.classList.remove('d-none');
                }
            } catch (error) {
                console.error('💥 Error de fetch:', error);
                errorDiv.textContent = 'Error de conexión. Intenta nuevamente.';
                errorDiv.classList.remove('d-none');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Crear Horario';
            }
        });
    }
});