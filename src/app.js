import express from 'express';
import handlebars from 'express-handlebars';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import userRouter from './routes/user.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname ( __filename);

const app = express ();
const PORT = 8080;
// Permite a Express entender datos enviados por formularios HTML (urlencoded)
app.use(express.urlencoded({ extended: true }));
// Permite a Express entender datos enviados como JSON (útil para el futuro)
app.use(express.json());

app.use(session({
    secret: 'mi_secreto_super_seguro', 
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI }),
    cookie: { maxAge: 180 * 60 * 1000 } // La sesión dura 3 horas (en milisegundos)
}));

// NUEVO: Middleware para hacer disponible la info de sesión en todas las vistas
app.use((req, res, next) => {   
    res.locals.user = req.session.user || null; // Si existe sesión, 'user' estará disponible en handlebars
    next();
});
app.engine('handlebars', handlebars.engine());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');
app.get('/', (req, res) => {
    // Ahora podemos pasar el usuario a la vista principal si existe
    res.render('index', {
        title: 'Gestor de Horarios',
        user: req.session.user
    });
});
app.use('/users', userRouter);
//falta env variables de entorno
mongoose.connect("mongodb+srv://rayosanchez1_db_user:Holasoyevo1@gestiondehorarios.ziijdqc.mongodb.net/?appName=gestiondehorarios")
    .then(() => {
        console.log("Conectado a la base de datos");
        // Inicia el servidor SOLO si la conexión a la DB es exitosa
        app.listen(PORT, () => {
            console.log(` Servidor escuchando en http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error(" Error al conectar a la base de datos:", error);
    });

