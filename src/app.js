import express from 'express';
import dotenv from 'dotenv';
import handlebars from 'express-handlebars';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import userRouter from './routes/user.routes.js';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';
import websocket from './websocket.js'; 
import { initializePassport } from './config/passport.config.js'; // ¡NUEVO!


dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname ( __filename);
const app = express ();
const PORT = 8080;
const MONGO_URI = process.env.MONGO_URI;




app.use(cookieParser()); // leer la cookie del token


// formularios HTML (urlencoded)
app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(session({
    secret: 'mi_secreto_super_seguro', 
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI }),
    cookie: { maxAge: 180 * 60 * 1000 } 
}));
app.use(initializePassport())
// NUEVO: Middleware para hacer disponible la info de sesión en todas las vistas
app.use((req, res, next) => {   
    res.locals.user = req.session.user || null; // Si existe sesión, 'user' estará disponible en handlebars
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
app.use('/users', userRouter);

mongoose.connect("MONGO_URI")
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

