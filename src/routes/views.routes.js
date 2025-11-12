import { Router } from 'express';
import { requireAuthView, optionalAuthView } from '../middlewares/auth.middleware.js';

const router = Router();

// Ruta principal / home
router.get('/', optionalAuthView, (req, res) => {
    res.render('index', {
        title: 'Gestión de Horarios',
        user: req.user || null
    });
});

// Ruta de login
router.get('/login', (req, res) => {
    // Si ya está autenticado, redirigir a profile
    if (req.user) {
        return res.redirect('/profile');
    }
    res.render('login', {
        title: 'Iniciar Sesión'
    });
});

// Ruta de registro
router.get('/register', (req, res) => {
    // Si ya está autenticado, redirigir a profile
    if (req.user) {
        return res.redirect('/profile');
    }
    res.render('register', {
        title: 'Registro de Usuario'
    });
});

// Ruta de perfil (protegida)
router.get('/profile', requireAuthView, (req, res) => {
    res.render('profile', {
        title: 'Mi Perfil',
        user: req.user
    });
});

// Ruta de listado de horarios (protegida)
router.get('/horarios', requireAuthView, (req, res) => {
    res.render('index', {
        title: 'Mis Horarios',
        user: req.user,
        showHorarios: true
    });
});

// Ruta para crear nuevo horario (protegida)
router.get('/horarios/nuevo', requireAuthView, (req, res) => {
    try {
        const hoy = new Date();
        const currentYear = hoy.getFullYear();

        // Calcular número de semana ISO (1..53)
        function getISOWeek(date) {
            const target = new Date(date.valueOf());
            const dayNr = (target.getDay() + 6) % 7; // lunes=0 .. domingo=6
            target.setDate(target.getDate() - dayNr + 3); // ajustar a jueves de la misma semana
            const firstThursday = new Date(target.getFullYear(), 0, 4);
            const diff = target - firstThursday;
            return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
        }
        const currentWeek = getISOWeek(hoy);

        // Obtener lunes de la semana actual (00:00)
        const startOfWeek = new Date(hoy);
        startOfWeek.setHours(0, 0, 0, 0);
        const offsetToMonday = (hoy.getDay() + 6) % 7; // lunes=0
        startOfWeek.setDate(hoy.getDate() - offsetToMonday);

        // Días de la semana con fechas (empezando en lunes)
        const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
            .map((nombre, index) => {
                const fecha = new Date(startOfWeek);
                fecha.setDate(startOfWeek.getDate() + index);
                return {
                    nombre,
                    fecha: fecha.toLocaleDateString('es-ES')
                };
            });

        res.render('crearhorario', {
            title: 'Crear Nuevo Horario',
            user: req.user,
            currentYear,
            currentWeek,
            diasSemana
        });
    } catch (error) {
        console.error("Error al cargar formulario de horario:", error);
        res.redirect('/horarios');
    }
});

export default router; 