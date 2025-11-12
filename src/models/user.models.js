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
        trim: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Email inválido'
        }
    },
    age: {
        type: Number,
        required: true,
        min: [18, 'Debes ser mayor de 18 años'],
        max: [100, 'Edad inválida']
    },
    password: {
        type: String,
        required: true,
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
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
userSchema.pre('save', async function(next) {
    // Solo hashear si la contraseña fue modificada O si es un documento nuevo
    if (!this.isModified('password')) return next();
    
    try {
        // Usar método asíncrono para mejor performance
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(password) {
    try {
        return await bcrypt.compare(password, this.password);
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