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
                    }
                });
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
                const diasNombres = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
                
                diasNombres.forEach((nombreDia, index) => {
                    const checkbox = document.getElementById(`dia-${index}`);
                    const horaEntrada = document.querySelector(`.hora-entrada[data-dia="${nombreDia}"]`);
                    const horaSalida = document.querySelector(`.hora-salida[data-dia="${nombreDia}"]`);
                    const horasExtras = document.querySelector(`.horas-extras[data-dia="${nombreDia}"]`);
                    const observaciones = document.querySelector(`.observaciones[data-dia="${nombreDia}"]`);
                    
                    if (checkbox && checkbox.checked) {
                        const fecha = new Date();
                        // Calcular fecha para el día específico de la semana
                        const diaData = {
                            fecha: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + index),
                            hora_entrada: horaEntrada ? horaEntrada.value : '',
                            hora_salida: horaSalida ? horaSalida.value : '',
                            descanso: false,
                            horas_extras: horasExtras ? parseFloat(horasExtras.value) || 0 : 0,
                            observaciones: observaciones ? observaciones.value : ''
                        };
                        dias.push(diaData);
                    }
                });

                console.log('📤 Enviando datos del horario:', {
                    año,
                    semana,
                    dias: dias.length
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