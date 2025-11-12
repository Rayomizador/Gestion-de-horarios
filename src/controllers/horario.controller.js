import { HorarioModel } from '../models/horario.models.js';
import { calculateHours } from '../middlewares/calculateHours.middleware.js';

export const HorarioController = {
    // Crear nuevo horario
    crearHorario: async (req, res) => {
        try {
            const { usuario, semana, año, dias } = req.body;
            
            const horario = new HorarioModel({
                usuario,
                semana,
                año,
                dias
            });

            await horario.save();
            
            res.status(201).json({
                success: true,
                data: horario
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Actualizar horario existente
    actualizarHorario: async (req, res) => {
        try {
            const { id } = req.params;
            const { dias } = req.body;

            const horario = await HorarioModel.findByIdAndUpdate(
                id,
                { dias },
                { new: true, runValidators: true }
            );

            if (!horario) {
                return res.status(404).json({
                    success: false,
                    message: 'Horario no encontrado'
                });
            }

            res.json({
                success: true,
                data: horario
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Recalcular horas manualmente
    recalcularHoras: async (req, res) => {
        try {
            const { id } = req.params;
            const horarioActualizado = await HorarioModel.recalcularHoras(id);
            
            res.json({
                success: true,
                data: horarioActualizado
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Calcular horas sin guardar (para preview)
    calcularPreview: async (req, res) => {
        try {
            const { dias } = req.body;
            const calculo = calculateHours({ dias });
            
            res.json({
                success: true,
                data: calculo
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};