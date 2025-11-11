import passport from 'passport';
import passportLocal from 'passport-local';
import passportJwt from 'passport-jwt';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/user.models.js';


const LocalStrategy = passportLocal.Strategy;
const JwtStrategy = passportJwt.Strategy;
const ExtractJwt = passportJwt.ExtractJwt;

const JWT_SECRET = process.env.JWT_SECRET;
ç

// Estrategia Local (para el login con email/password)
passport.use('local', new LocalStrategy(
    { usernameField: 'email' }, // Usamos 'email' como nombre de usuario
    async (email, password, done) => {
        try {
            const user = await UserModel.findOne({ email });
            
            if (!user) {
                // Usuario no encontrado
                return done(null, false, { message: 'Usuario no encontrado.' });
            }

            // Comparar la contraseña hasheada
            const isMatch = await bcrypt.compare(password, user.password);
            
            if (!isMatch) {
                // Contraseña incorrecta
                return done(null, false, { message: 'Contraseña incorrecta.' });
            }

            // Autenticación exitosa
            return done(null, user);

        } catch (error) {
            return done(error);
        }
    }
));

// Función para extraer el token desde una cookie
const cookieExtractor = (req) => {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['token']; // Nombre de la cookie
    }
    return token;
};

// Estrategia JWT (para proteger rutas y endpoint "current")
passport.use('jwt', new JwtStrategy(
    {
        jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]), // Extrae de la cookie
        secretOrKey: JWT_SECRET
    },
    async (jwt_payload, done) => {
        try {
            // El payload es el objeto que firmamos al hacer login
            // Simplemente lo devolvemos para que Passport lo ponga en req.user
            return done(null, jwt_payload);
        } catch (error) {
            return done(error, false);
        }
    }
));

export const initializePassport = () => {
    return passport.initialize();
};