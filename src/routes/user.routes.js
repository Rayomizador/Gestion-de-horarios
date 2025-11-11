import { Router } from 'express';
import { UserModel } from '../models/user.models.js';
import passport from 'passport';
import jwt from 'jsonwebtoken';


const router = Router();
const JWT_SECRET = `Process.emv.JWT_SECRET`;


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


router.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
   
    const user = req.user;

    // Creamos el payload del token
    const payload = {
        id: user._id,
        email: user.email,
        nombre: user.nombre,
        role: user.role
    };

    // Firmamos el token JWT
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Expira en 1 hora

    // Enviamos el token en una cookie
    res.cookie('token', token, {
        httpOnly: true, // El navegador no puede modificar la cookie
        secure: false,  // Cambiar a 'true' en producción (con HTTPS)
        maxAge: 3600000 // 1 hora
    }).send({ status: 'success', message: 'Login exitoso' });
});

// --- NUEVO: Ruta "Current" ---
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
    // Si la estrategia 'jwt' falla (token inválido o no hay token), Passport devuelve 401
    
    // Si 'jwt' tiene éxito, req.user contiene el PAYLOAD del token
    res.send({ status: 'success', payload: req.user });
});

export default router;