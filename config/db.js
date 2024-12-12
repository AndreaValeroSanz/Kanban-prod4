import mongoose from 'mongoose';

const MONGO_URI = "mongodb+srv://avalerosanz:root@cluster0.oqdti.mongodb.net/Kanban_JS?retryWrites=true&w=majority&appName=Cluster0";

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        // Si ya está conectado, no intentamos conectarnos de nuevo
        console.log("Ya estás conectado a MongoDB.");
        return;
    }

    try {
        const conn = await mongoose.connect(MONGO_URI);
        console.log(`MongoDB conectado en: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error al conectar a la base de datos: ${error.message}`);
        process.exit(1); // Termina el proceso si la conexión falla
    }
};

export { connectDB };
