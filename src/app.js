import dotenv from 'dotenv';
dotenv.config(); 

import express from 'express';
import handlebars from 'express-handlebars';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';

// Importación de Routers
import sessionRouter from './routes/session.Router.js';
import horarioRouter from './routes/horario.routes.js';
import viewsRouter from './routes/views.routes.js'; 

// Importación de Lógica Interna
import websocket from './websockets/websockets.js';
import { initializePassport } from './config/passportconfig.js';

// --- Configuración Inicial ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ RUTA CORRECTA: src/views (no src/js/views)
console.log('Directorio de vistas:', path.join(__dirname, 'views'));

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Verificar variables de entorno críticas
if (!MONGO_URI) {
    console.error("ERROR: MONGO_URI no está definida en las variables de entorno");
    process.exit(1);
}

// --- Configuración de Middlewares Básicos ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Configuración de archivos estáticos ---
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use(express.static(path.join(__dirname, 'public')));

// --- Configuración de Sesión ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'mi_secreto_super_seguro',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: MONGO_URI,
        ttl: 14 * 24 * 60 * 60
    }),
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false
    }
}));

// --- Configuración de Passport ---
app.use(passport.initialize());
app.use(passport.session());
initializePassport();

// --- Configuración CORREGIDA del Motor de Vistas ---
app.engine('handlebars', handlebars.engine({
    defaultLayout: 'main',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    },
    helpers: {
        eq: (a, b) => a === b,
        json: (context) => JSON.stringify(context)
    }
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

// --- Middleware de Usuario Global ---
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.currentPath = req.path;
    next();
});

// --- Registro de Routers ---
app.use('/api/sessions', sessionRouter);
app.use('/api/horarios', horarioRouter);
app.use('/', viewsRouter);

// --- Middleware para rutas no encontradas (404) ---
app.use((req, res) => {
    res.status(404).render('404', {
        title: 'Página No Encontrada',
        user: req.user || null
    });
});

// --- Middleware de manejo de errores ---
app.use((error, req, res, next) => {
    console.error('Error del servidor:', error);
    res.status(500).render('error', {
        title: 'Error del Servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Ha ocurrido un error interno',
        user: req.user || null
    });
});

// --- Conexión a DB y Arranque del Servidor ---
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log(" Conectado a la base de datos MongoDB");

        const httpServer = http.createServer(app);
        const io = new Server(httpServer);
        websocket(io);
        app.set('socketio', io);

        httpServer.listen(PORT, () => {
            console.log(`Servidor escuchando en http://localhost:${PORT}`);
            console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Directorio de vistas: ${path.join(__dirname, 'views')}`);
        });
    })
    .catch(error => {
        console.error(" Error al conectar a la base de datos:", error);
        process.exit(1);
    });

export default app;