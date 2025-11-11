import mongoose from 'mongoose';

const { Schema } = mongoose;

const shiftSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    
    hora_inicio: {
        type: Date,
        required: true
    },
    hora_fin: {
        type: Date,
        required: true
    },
     notas: {
        type: String,
        default: '' 
    }
}, {

    timestamps: true //estampas de tiempo
});

//modelo a partir del esquema
export const ShiftModel = mongoose.model('Shift', shiftSchema);