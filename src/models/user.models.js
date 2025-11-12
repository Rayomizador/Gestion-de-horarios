import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    age: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true,
    },
    
    // CAMBIE CART POR ESTE, SE AÑADEN DIAS DE DESCANSO, SIMULANDO EL CARRITO. 
    dias_descanso: {
        type: [String], 
        default: []    
    },
    
    
    role:{
        type: String,
        default: 'user' //Role por defecto 'user'
    },
});


userSchema.pre('save', function (next) {
    // Solo hashear si la contraseña es nueva o fue modificada
    if (!this.isModified('password')) return next(); 
    
    try {
        const salt = bcrypt.genSaltSync(10);
        this.password = bcrypt.hashSync(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }      
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};


export const UserModel = mongoose.model('User', userSchema);