import passport from 'passport';

// Middleware para proteger vistas usando JWT desde cookies
export const requireAuthView = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            console.error("Error en autenticación:", err);
            return res.redirect('/login');
        }
        
        if (!user) {
            return res.redirect('/login');
        }
        
        req.user = user;
        next();
    })(req, res, next);
};

// Middleware opcional para autenticación (no requiere login)
export const optionalAuthView = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (user) {
            req.user = user;
        }
        next();
    })(req, res, next);
};