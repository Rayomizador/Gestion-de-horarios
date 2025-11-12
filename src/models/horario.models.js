import mongoose from 'mongoose';
import { calculateHours } from '../middlewares/calculateHours.middleware.js';

const horarioSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    semana: {
        type: Number,
        required: true,
        min: 1,
        max: 52
    },
    año: {
        type: Number,
        required: true
    },
    dias: [{
        fecha: {
            type: Date,
            required: true,
            default: Date.now,
        },
        hora_entrada: {
            type: String,
            validate: {
                validator: function(v) {
                    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
                },
                message: 'Formato de hora inválido (HH:MM)'
            }
        },
        hora_salida: {
            type: String,
            validate: {
                validator: function(v) {
                    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
                },
                message: 'Formato de hora inválido (HH:MM)'
            }
        },
        descanso: {
            type: Boolean,
            default: false
        },
        horas_extras: {
            type: Number,
            min: 0,
            default: 0
        },
        observaciones: {
            type: String,
            trim: true,
            maxlength: 200
        }
    }],
    horas_totales: {
        type: Number,
        default: 0
    },
    horas_extras_totales: {
        type: Number,
        default: 0
    },
    estado: {
        type: String,
        enum: ['borrador', 'enviado', 'aprobado', 'rechazado'],
        default: 'borrador'
    }
}, {
    timestamps: true
});

// Índice compuesto para búsquedas eficientes y prevenir duplicados
horarioSchema.index({ usuario: 1, año: 1, semana: 1 }, { unique: true });

// Middleware pre-save usando el middleware externo
horarioSchema.pre('save', function(next) {
    const calculo = calculateHours(this);
    
    if (calculo.errores) {
        const error = new Error(`Errores en el horario: ${calculo.errores.join(', ')}`);
        return next(error);
    }
    
    this.horas_totales = calculo.horasTotales;
    this.horas_extras_totales = calculo.horasExtrasTotales;
    next();
});

// Método estático para recalcular horas
horarioSchema.statics.recalcularHoras = function(horarioId) {
    return this.findById(horarioId).then(horario => {
        if (!horario) throw new Error('Horario no encontrado');
        
        const calculo = calculateHours(horario);
        return this.findByIdAndUpdate(
            horarioId, 
            { 
                horas_totales: calculo.horasTotales,
                horas_extras_totales: calculo.horasExtrasTotales
            },
            { new: true }
        );
    });
};

export const HorarioModel = mongoose.model('Horario', horarioSchema);