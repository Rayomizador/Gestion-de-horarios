import { Router } from 'express';
import passport from 'passport';
import { UserModel } from '../models/user.models.js'; // Necesitamos UserModel para la ruta /profile

const router = Router();

// Ruta para la página de inicio
router.get('/', (req, res) => {
    res.render('index', {
        title: 'Gestor de Horarios',
        user: req.session.user
    });
});

// Ruta para la página de login
router.get('/login', (req, res) => {
    res.render('login', {
        title: 'Iniciar Sesión'
    });
});

// Ruta para la página de registro
router.get('/register', (req, res) => {
    res.render('register', {
        title: 'Registrar Nuevo Usuario'
    });
});

// Ruta para la página de perfil (¡Protegida!)
router.get('/profile', 
    passport.authenticate('jwt', { 
        session: false, 
        failureRedirect: '/login' 
    }), 
    async (req, res) => {
        try {
            const user = await UserModel.findById(req.user.id)
                                        .populate('Horario')
                                        .lean();

            if (!user) {
                return res.redirect('/login');
            }

            res.render('profile', {
                title: 'Mi Perfil',
                user: user
            });
        } catch (error) {
            console.error("Error al cargar perfil:", error);
            res.redirect('/login');
            console.log(error);
        }
    }
);

export default router;