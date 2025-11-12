import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true,
        trim: true
    },
    last_name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    age: {
        type: Number,
        required: true,
        min: 0
    },
    password: {
        type: String,
        required: true
    },
    // Reemplazamos 'cart' por 'horario' y 'dias_descanso'
    horario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Horario'
    },
    dias_descanso: [{
        type: String,
        enum: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
    }],
    role: {
        type: String,
        enum: ['user', 'admin', 'supervisor'],
        default: 'user'
    },
    configuracion_horaria: {
        horas_semanales: {
            type: Number,
            default: 40
        },
        turno: {
            type: String,
            enum: ['mañana', 'tarde', 'noche', 'mixto'],
            default: 'mañana'
        },
        fecha_contratacion: {
            type: Date,
            default: Date.now
        }
    }
}, {
    timestamps: true
});

// Encriptación de contraseña
userSchema.pre('save', function(next) {
    if (!this.isModified('password')) return next();
    this.password = bcrypt.hashSync(this.password, 10);
    next();
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = function(password) {
    try {
        return bcrypt.compareSync(password, this.password);
    } catch (error) {
        console.error('Error comparando contraseñas:', error);
        return false;
    }
};

// Método para obtener nombre completo
userSchema.methods.getFullName = function() {
    return `${this.first_name} ${this.last_name}`;
};

// Método virtual para días laborales
userSchema.virtual('dias_laborales').get(function() {
    const todosDias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    return todosDias.filter(dia => !this.dias_descanso.includes(dia));
});

export const UserModel = mongoose.model('User', userSchema);