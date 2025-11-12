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
const __dirname = path.dirname ( __filename);
const app = express ();
const PORT = 8080;
const MONGO_URI = process.env.MONGO_URI;

// --- Configuración de Middlewares ---
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// --- Configuración de Sesión ---
app.use(session({
    secret: 'mi_secreto_super_seguro', 
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI }),
    cookie: { maxAge: 180 * 60 * 1000 } 
}));

// --- Configuración de Passport ---
app.use(initializePassport());
app.use(passport.initialize()); // Requerido para passport

// --- Configuración del Motor de Vistas (Handlebars) ---
app.engine('handlebars', handlebars.engine());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

// --- Registro de Routers ---
app.use('/api/sessions', sessionRouter); // Rutas de API para login/register
app.use('/api/horarios', horarioRouter); // Rutas de API para guardar horarios
app.use('/', viewsRouter);              // Rutas de Vistas (/, /login, /profile, etc)

// --- Conexión a DB y Arranque del Servidor ---
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