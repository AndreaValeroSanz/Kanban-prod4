import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    user_id: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    ], // Cambiado a un array
    title: {
        type: String,
        required: true,
    },
});

export default mongoose.model('Project', projectSchema);
