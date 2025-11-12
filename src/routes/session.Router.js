import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.models.js';

const router = Router();

// Ruta de Login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
        try {
            if (err) {
                console.error('Error en autenticación:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error interno del servidor' 
                });
            }
            
            if (!user) {
                console.log('Credenciales inválidas:', info?.message);
                return res.status(401).json({ 
                    success: false, 
                    message: info?.message || 'Credenciales inválidas' 
                });
            }   
            console.log('Usuario autenticado:', user.email);    

            // Generar token JWT
            const token = jwt.sign(
                { 
                    id: user._id,
                    email: user.email,
                    role: user.role 
                },
                process.env.JWT_SECRET || 'secreto-gestor-horarios',
                { expiresIn: '24h' }
            );

            // Configurar cookie
            res.cookie('jwt', token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000, // 24 horas
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });

            // Respuesta JSON
            res.json({
                success: true,
                message: 'Login exitoso',
                user: {
                    id: user._id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('Error en proceso de login:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor' 
            });
        }
    })(req, res, next);
});

// Ruta de Registro
router.post('/register', async (req, res) => {
    try {
        const { first_name, last_name, email, age, password } = req.body;
        
        // Validar campos obligatorios
        if (!first_name || !last_name || !email || !age || !password) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        // Validar longitud de contraseña
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Validar edad
        const edadNum = parseInt(age);
        if (isNaN(edadNum) || edadNum < 18 || edadNum > 100) {
            return res.status(400).json({
                success: false,
                message: 'Edad inválida. Debes ser mayor de 18 años'
            });
        }

        // Verificar si el usuario ya existe
        const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            console.log('Intento de registro con email existente:', email);
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Crear nuevo usuario
        const newUser = new UserModel({
            first_name,
            last_name,
            email: email.toLowerCase(),
            age,
            password // Se encripta automáticamente por el pre-save hook
        });

        await newUser.save();
        console.log('Usuario registrado exitosamente:', email);
    

        // Auto-login después del registro
        const token = jwt.sign(
            { 
                id: newUser._id,
                email: newUser.email,
                role: newUser.role 
            },
            process.env.JWT_SECRET || 'secreto-gestor-horarios',
            { expiresIn: '24h' }
        );

        res.cookie('jwt', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            user: {
                id: newUser._id,
                first_name: newUser.first_name,
                last_name: newUser.last_name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta Current
router.get('/current', 
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        res.json({
            success: true,
            user: {
                id: req.user._id,
                first_name: req.user.first_name,
                last_name: req.user.last_name,
                email: req.user.email,
                role: req.user.role
            }
        });
    }
);

// Ruta Logout
router.post('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.json({ 
        success: true, 
        message: 'Sesión cerrada exitosamente' 
    });
});

export default router;