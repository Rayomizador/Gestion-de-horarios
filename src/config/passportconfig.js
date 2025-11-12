import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt';
import { UserModel } from '../models/user.models.js';

export const initializePassport = () => {
    // ESTRATEGIA LOCAL
    passport.use('local', new LocalStrategy({
        usernameField: 'email',    // Usar email como nombre de usuario
        passwordField: 'password'  // Campo de contraseña
    }, async (email, password, done) => {
        try {
            console.log('Intentando autenticar:', email);
            
            // Buscar usuario por email
            const user = await UserModel.findOne({ email: email.toLowerCase() });
            
            if (!user) {
                console.log(' Usuario no encontrado:', email);
                return done(null, false, { message: 'Usuario no encontrado' });
            }
            
            // Verificar contraseña
            const isPasswordValid = user.comparePassword(password);
            if (!isPasswordValid) {
                console.log(' Contraseña incorrecta para:', email);
                return done(null, false, { message: 'Contraseña incorrecta' });
            }
            
            console.log(' Autenticación exitosa para:', email);
            return done(null, user);
            
        } catch (error) {
            console.error('Error en autenticación local:', error);
            return done(error);
        }
    }));

    //  ESTRATEGIA JWT - Para autenticación con tokens
    passport.use('jwt', new JWTStrategy({
        jwtFromRequest: ExtractJwt.fromExtractors([
            (req) => {
                // Buscar token en cookies
                if (req && req.cookies && req.cookies.jwt) {
                    return req.cookies.jwt;
                }
                // Buscar token en headers
                if (req && req.headers && req.headers.authorization) {
                    return req.headers.authorization.replace('Bearer ', '');
                }
                return null;
            }
        ]),
        secretOrKey: process.env.JWT_SECRET || 'secreto-gestor-horarios'
    }, async (payload, done) => {
        try {
            console.log('Validando JWT para usuario ID:', payload.id);
            const user = await UserModel.findById(payload.id);
            
            if (!user) {
                console.log(' Usuario no encontrado en JWT');
                return done(null, false);
            }
            
            console.log('JWT válido para:', user.email);
            return done(null, user);
        } catch (error) {
            console.error('Error en validación JWT:', error);
            return done(error, false);
        }
    }));

    //  ESTRATEGIA "current" 
    passport.use('current', new JWTStrategy({
        jwtFromRequest: ExtractJwt.fromExtractors([
            (req) => {
                if (req && req.cookies && req.cookies.jwt) {
                    return req.cookies.jwt;
                }
                if (req && req.headers && req.headers.authorization) {
                    return req.headers.authorization.replace('Bearer ', '');
                }
                return null;
            }
        ]),
        secretOrKey: process.env.JWT_SECRET || 'secreto-gestor-horarios',
        ignoreExpiration: true //desarrollo
    }, async (payload, done) => {
        try {
            const user = await UserModel.findById(payload.id);
            if (!user) return done(null, false);
            return done(null, user);
        } catch (error) {
            return done(error, false);
        }
    }));

    // Serialización del usuario (requerida para sessions)
    passport.serializeUser((user, done) => {
        console.log('serializando usuario:', user.email);
        done(null, user._id);
    });

    // Deserialización del usuario (requerida para sessions)
    passport.deserializeUser(async (id, done) => {
        try {
            console.log('Deserializando usuario ID:', id);
            const user = await UserModel.findById(id);
            done(null, user);
        } catch (error) {
            console.error('Error deserializando usuario:', error);
            done(error, null);
        }
    });

    console.log('Todas las estrategias de Passport configuradas correctamente');
};

export default passport;