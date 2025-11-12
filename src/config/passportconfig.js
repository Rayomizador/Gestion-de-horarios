import passport from 'passport';
import passportLocal from 'passport-local';
import passportJwt from 'passport-jwt';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/user.models.js'; //

const LocalStrategy = passportLocal.Strategy;
const JwtStrategy = passportJwt.Strategy;
const ExtractJwt = passportJwt.ExtractJwt;

const JWT_SECRET = process.env.JWT_SECRET; 

if (!JWT_SECRET) {
    console.error("Error: JWT_SECRET no está definido en el archivo .env");
    process.exit(1);
}

// Estrategia Local
passport.use('local', new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
        try {
            const user = await UserModel.findOne({ email });
            
            if (!user) {
                return done(null, false, { message: 'credenciales invalidas.' });
            }

            // Comparar la contraseña hasheada
            const isMatch = await bcrypt.compare(password, user.password);
            
            if (!isMatch) {
                return done(null, false, { message: 'credenciales invalidas' });
            }

            return done(null, user); // Autenticación exitosa

        } catch (error) {
            return done(error);
        }
    }
));

// Función para extraer el token desde una cookie
const cookieExtractor = (req) => {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['token'];
    }
    return token;
};

// Estrategia JWT (para proteger rutas y endpoint "current")
// 
passport.use('jwt', new JwtStrategy(
    {
        jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]), // Extrae de la cookie
        secretOrKey: JWT_SECRET
    },
    async (jwt_payload, done) => {
        try {
            // El payload son los datos del usuario que firmamos en el token
            // Passport lo añade a req.user
            return done(null, jwt_payload);
        } catch (error) {
            return done(error, false);
        }
    }
));

export const initializePassport = () => {
    return passport.initialize();
};