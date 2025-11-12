import dotenv from 'dotenv';
dotenv.config(); 

import express from 'express';
import handlebars from 'express-handlebars';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import sessionRouter from './routes/session.Router.js'; 
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';
import websocket from './websockets/websockets.js'; 
import { initializePassport } from './config/passportconfig.js'; 
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import horarioRouter from './routes/horario.routes.js';
import { UserModel } from './models/user.models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname ( __filename);
const app = express ();
const PORT = 8080;
const MONGO_URI = process.env.MONGO_URI;

app.use(cookieParser()); 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(session({
    secret: 'mi_secreto_super_seguro', 
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI }),
    cookie: { maxAge: 180 * 60 * 1000 } 
}));
app.use(initializePassport())

app.use((req, res, next) => {   
    res.locals.user = req.session.user || null; 
    next();
});
app.engine('handlebars', handlebars.engine());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Gestor de Horarios',
        user: req.session.user
    });
});
app.get('/login', (req, res) => {
    res.render('login', {
        title: 'Iniciar Sesión'
    });
});
app.get('/register', (req, res) => {
    res.render('register', {
        title: 'Registrar Nuevo Usuario'
    });
});

app.get('/profile', 
   
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
            res.redirect('/login');
        }
    }
);

app.use('/api/horarios', horarioRouter)
app.use('/api/sessions', sessionRouter);

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("Conectado a la base de datos");
        const httpServer = http.createServer(app);
        const io = new Server(httpServer);
        websocket(io);
        app.listen(PORT, () => {
            console.log(` Servidor escuchando en http://localhost:${PORT}`);
        });
        app.set('socketio', io);
    })
    .catch(error => {
        console.error(" Error al conectar a la base de datos:", error);
    });