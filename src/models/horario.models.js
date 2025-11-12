import mongoose from 'mongoose';

const { Schema } = mongoose;


const tiempoExtraSchema = new Schema({
    horas: {
        type: Number,
        required: true
    },
    fecha: {
        type: Date,
        required: true
    },
    descripcion: {
        type: String,
        default: '' // Ej: "Horas extra proyecto X" o "Cubriendo turno"
    }
}, { _id: true, timestamps: true }); 


const horarioSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true 
    },

   
    horas_lunes: {
        type: Number,
        default: 10 
    },
    horas_martes: {
        type: Number,
        default: 10
    },
    horas_miercoles: {
        type: Number,
        default: 10
    },
    horas_jueves: {
        type: Number,
        default: 10
    },
    horas_viernes: {
        type: Number,
        default: 10
    },
    horas_sabado: {
        type: Number,
        default: 10 
    },
    horas_domingo: {
        type: Number, 
        default: 10 
    },


    horas_semanales_estandar: {
        type: Number,
        default: 50 // (10 * 5 días)
    },

   
    tiempo_extra_log: [tiempoExtraSchema]

}, {
    timestamps: true
});

export const HorarioModel = mongoose.model('Horario', horarioSchema);