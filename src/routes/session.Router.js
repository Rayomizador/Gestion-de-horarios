import { Router } from 'express';
import { UserModel } from '../models/user.models.js';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'revisa-la-variable-de-entorno-papoi';

// Ruta de Registro
router.post('/register', async (req, res) => {
    
    const { first_name, last_name, email, age, password } = req.body;

    if (!first_name || !last_name || !email || !age || !password) {
        return res.status(400).send({ status: 'error', message: 'Todos los campos son obligatorios papoi.' });
    }

    try {
        const newUser = await UserModel.create({
            first_name,
            last_name,
            email,
            age,
            password 
        });

         res.status(201).send({ status: 'success', message: 'Usuario registrado exitosamente', payload: newUser }); 
    
    } catch (error) {
        if (error.code === 11000) { // Error de índice único (email duplicado)
            return res.status(400).send({ status: 'error', message: 'El email que ingresaste ya está en uso.' });
        }
        console.error(error);
        return res.status(500).send({ status: 'error', message: 'Ocurrió un error inesperado al registrar.' });
    }
});


// --- Ruta de Login ---
// ( /api/sessions/login)
router.post('/login', (req, res, next) => {

    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            // Si el usuario no se encuentra o la contraseña es incorrecta
            return res.status(401).send({ status: 'error', message: info.message || 'Credenciales inválidas.' });
        }
        // Si la autenticación es exitosa, generamos el token JWT
        const payload = {
            id: user._id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            age: user.age,
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

    })(req, res, next);
});


// (Esta ruta estaría en GET /api/sessions/current)
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {

    res.send({ status: 'success', payload: req.user });
});

export default router;