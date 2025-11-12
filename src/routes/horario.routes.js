import { Router } from 'express';
import { HorarioModel } from '../models/horario.models.js';
import { UserModel } from '../models/user.models.js';
import { requireAuthView } from '../middlewares/auth.middleware.js';

const router = Router();

// Crear nuevo horario
router.post('/', requireAuthView, async (req, res) => {
    try {
        const { semana, año, dias } = req.body;
        const usuario = req.user._id; // Obtener el ID del usuario autenticado

        console.log('📥 Datos recibidos para crear horario:', {
            usuario,
            semana,
            año,
            dias: dias ? dias.length : 0
        });

        // Validar campos obligatorios
        if (!semana || !año) {
            return res.status(400).json({
                success: false,
                message: 'Semana y año son campos obligatorios'
            });
        }

        // Validar rangos
        const semanaNum = parseInt(semana);
        const añoNum = parseInt(año);

        if (isNaN(semanaNum) || semanaNum < 1 || semanaNum > 53) {
            return res.status(400).json({
                success: false,
                message: 'Semana debe estar entre 1 y 53'
            });
        }

        if (isNaN(añoNum) || añoNum < 2020 || añoNum > 2100) {
            return res.status(400).json({
                success: false,
                message: 'Año inválido'
            });
        }

        // Verificar si ya existe un horario para esta semana y año
        const horarioExistente = await HorarioModel.findOne({
            usuario,
            semana: semanaNum,
            año: añoNum
        });

        if (horarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un horario para esta semana y año'
            });
        }

        // Crear nuevo horario
        const horario = new HorarioModel({
            usuario,
            semana: semanaNum,
            año: añoNum,
            dias: dias || []
        });

        await horario.save();

        // Actualizar referencia en el usuario
        await UserModel.findByIdAndUpdate(usuario, {
            horario: horario._id
        });

        console.log('✅ Horario creado exitosamente:', horario._id);

        res.status(201).json({
            success: true,
            message: 'Horario creado exitosamente',
            data: horario
        });

    } catch (error) {
        console.error('💥 Error al crear horario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor: ' + error.message
        });
    }
});

// Obtener horarios del usuario
router.get('/', requireAuthView, async (req, res) => {
    try {
        const horarios = await HorarioModel.find({ usuario: req.user._id })
                                          .sort({ año: -1, semana: -1 })
                                          .lean();

        res.json({
            success: true,
            data: horarios
        });
    } catch (error) {
        console.error('💥 Error al obtener horarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener horarios'
        });
    }
});

// Obtener horario específico
router.get('/:id', requireAuthView, async (req, res) => {
    try {
        const horario = await HorarioModel.findOne({
            _id: req.params.id,
            usuario: req.user._id
        }).lean();

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
        console.error('💥 Error al obtener horario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener horario'
        });
    }
});

// Actualizar horario
router.put('/:id', requireAuthView, async (req, res) => {
    try {
        const { dias } = req.body;

        const horario = await HorarioModel.findOneAndUpdate(
            { 
                _id: req.params.id, 
                usuario: req.user._id 
            },
            { 
                dias,
                // Los campos semana y año no se pueden modificar
            },
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
            message: 'Horario actualizado exitosamente',
            data: horario
        });
    } catch (error) {
        console.error('💥 Error al actualizar horario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar horario: ' + error.message
        });
    }
});

// Eliminar horario
router.delete('/:id', requireAuthView, async (req, res) => {
    try {
        const horario = await HorarioModel.findOneAndDelete({
            _id: req.params.id,
            usuario: req.user._id
        });

        if (!horario) {
            return res.status(404).json({
                success: false,
                message: 'Horario no encontrado'
            });
        }

        // Remover referencia del usuario
        await UserModel.findByIdAndUpdate(req.user._id, {
            $unset: { horario: 1 }
        });

        res.json({
            success: true,
            message: 'Horario eliminado exitosamente'
        });
    } catch (error) {
        console.error('💥 Error al eliminar horario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar horario'
        });
    }
});

export default router;