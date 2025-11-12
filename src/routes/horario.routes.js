import { Router } from 'express';
import passport from 'passport';
import { HorarioModel } from '../models/horario.models.js';
import { UserModel } from '../models/user.models.js';

const router = Router();

// Ruta protegida para crear/actualizar el horario
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const userId = req.user.id;
        const datosHorario = req.body;

        // 1. Buscar si el usuario ya tiene un horario.
        let horario = await HorarioModel.findOne({ user: userId });

        if (horario) {
            // 2. Si existe, lo actualiza (upsert)
            horario = await HorarioModel.findOneAndUpdate(
                { user: userId },
                { ...datosHorario },
                { new: true } // Devuelve el documento actualizado
            );
        } else {
            // 3. Si NO existe, lo crea
            horario = new HorarioModel({
                ...datosHorario,
                user: userId // Aseguramos el vínculo
            });
            await horario.save();

            // 4. ¡Anexar! Guardamos la referencia en el Modelo User
            await UserModel.findByIdAndUpdate(userId, { horario: horario._id });
        }

        res.status(200).send({ status: 'success', payload: horario });

    } catch (error) {
        console.error(error);
        res.status(500).send({ status: 'error', message: 'Error interno al guardar horario' });
    }
});

export default router;