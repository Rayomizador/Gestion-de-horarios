import { Router } from 'express';
import { UserModel } from '../models/user.models.js';


const router = Router();


router.get('/register', (req, res) => {
    res.render('register', {
        title: 'Registrar nuevo empleado',
        style: 'index.css',
        });
});


// REGISTRAR
router.post('/register', async (req, res) => {
    
    const { nombre, email, password, role } = req.body;

   
    if (!nombre || !email || !password || !role) {
        return res.render('register', {
            title: 'Registrar Nuevo Empleado',
            errorMessage: 'Todos los campos son obligatorios.'
        });
    }

    try {
        await UserModel.create({
            nombre,
            email,
            password, 
            role
        });
         res.redirect('/'); 
    } catch (error) {
        // EMAIL DUPLICADO
        if (error.code === 11000) {
            res.render('register', {
                title: 'Registrar Nuevo Empleado',
                errorMessage: 'El email que ingresaste ya está en uso.'
            });
        } else {
            console.error(error);
            res.render('register', {
                title: 'Registrar Nuevo Empleado',
                errorMessage: 'Ocurrió un error inesperado al registrar.'
            });
        }
    }
});

export default router;