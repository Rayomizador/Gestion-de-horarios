/**
 * Middleware para calcular horas trabajadas de un horario
 * @param {Object} horario - Objeto de horario con array de días
 * @returns {Object} - Objeto con horasTotales, horasExtrasTotales y errores
 */
export const calculateHours = (horario) => {
    let horasTotales = 0;
    let horasExtrasTotales = 0;
    const errores = [];

    // Validar que horario tenga días
    if (!horario || !horario.dias || !Array.isArray(horario.dias)) {
        return {
            horasTotales: 0,
            horasExtrasTotales: 0,
            errores: ['No se proporcionaron días válidos']
        };
    }

    horario.dias.forEach((dia, index) => {
        try {
            // Validar que no sea día de descanso y tenga horas válidas
            if (!dia.descanso && dia.hora_entrada && dia.hora_salida) {
                
                // Validar formato de horas
                if (!isValidTimeFormat(dia.hora_entrada) || !isValidTimeFormat(dia.hora_salida)) {
                    errores.push(`Día ${index + 1}: Formato de hora inválido`);
                    return;
                }

                // Crear objetos Date
                const entrada = new Date(`2000-01-01T${dia.hora_entrada}:00`);
                const salida = new Date(`2000-01-01T${dia.hora_salida}:00`);
                
                // Validar que las fechas sean válidas
                if (isNaN(entrada.getTime()) || isNaN(salida.getTime())) {
                    errores.push(`Día ${index + 1}: Horas inválidas`);
                    return;
                }
                
                // Calcular diferencia en horas
                const diferenciaMs = salida - entrada;
                let horasDia = diferenciaMs / (1000 * 60 * 60);
                
                // Manejar horarios nocturnos (salida < entrada)
                if (horasDia < 0) {
                    horasDia = 24 + horasDia; // Sumar 24 horas para horarios que cruzan medianoche
                }
                
                // Validar horas razonables (máximo 24 horas por día)
                if (horasDia > 24) {
                    errores.push(`Día ${index + 1}: Más de 24 horas en un día`);
                    return;
                }

                // Acumular totales
                horasTotales += horasDia;
                horasExtrasTotales += dia.horas_extras || 0;
            }
        } catch (error) {
            errores.push(`Día ${index + 1}: ${error.message}`);
        }
    });

    return {
        horasTotales: Math.round(horasTotales * 100) / 100,
        horasExtrasTotales: horasExtrasTotales,
        errores: errores.length > 0 ? errores : null
    };
};

/**
 * Valida el formato de hora (HH:MM)
 * @param {string} timeString 
 * @returns {boolean}
 */
const isValidTimeFormat = (timeString) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
};

/**
 * Middleware para usar en rutas (si necesitas validar antes de guardar)
 */
export const validateAndCalculateHours = (req, res, next) => {
    try {
        const { dias } = req.body;
        
        if (!dias || !Array.isArray(dias)) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere un array de días'
            });
        }

        const calculo = calculateHours({ dias });
        
        if (calculo.errores) {
            return res.status(400).json({
                success: false,
                message: 'Errores en el horario',
                errores: calculo.errores
            });
        }

        // Agregar cálculo al request para usarlo en el controller
        req.calculoHoras = calculo;
        next();

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al calcular horas',
            error: error.message
        });
    }
};