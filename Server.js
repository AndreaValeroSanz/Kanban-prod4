import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import typeDefs from './Schemas/Schema.js';
import resolvers from './Resolvers/Resolver.js';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { auth } from './auth.js';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import User from './models/user.js';
import Card from './models/card.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());

const startServer = async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      try {
        auth(req, null, () => {});
        return { userId: req.userId };
      } catch (err) {
        console.error('Error de autenticación:', err.message);
        throw new Error('No autorizado');
      }
    },
  });

  app.use(express.json({ limit: '2gb' })); // Ajusta el límite según lo necesario
  app.use(express.urlencoded({ limit: '2gb', extended: true }));

  await server.start();
  server.applyMiddleware({ app });

  connectDB();

  // Ensure the 'public/avatars' directory exists
  const uploadDir = path.join(__dirname, 'front', 'dist', 'public', 'avatars');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Serve static files from 'public/avatars'
  app.use('/avatars', express.static(uploadDir));

  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('upload_task_file', async (data, callback) => {
      const { cardId, fileName, fileContent } = data;
    
      if (!cardId) {
        callback({ success: false, message: 'ID de tarea no proporcionado.' });
        return;
      }
    
      const uploadDir = path.join(__dirname, 'uploads', 'tasks');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    
      const filePath = path.join(uploadDir, `${cardId}_${fileName}`);
      console.log('Guardando archivo en:', filePath);
      try {
        // Guarda el archivo en el sistema de archivos
        await fs.promises.writeFile(filePath, fileContent, 'base64');
        console.log('Archivo guardado:', filePath);
    
        const fileUrl = `/uploads/tasks/${cardId}_${fileName}`;
    
        // Actualiza usando taskKey en lugar de _id
        const result = await Card.findOneAndUpdate(
          { _id: cardId }, // Usa taskKey como identificador
          { $push: { files: fileUrl } },
          { new: true }
        );
    
        if (!result) {
          callback({ success: false, message: 'Tarea no encontrada.' });
          return;
        }
    
        callback({ success: true, message: 'Archivo subido correctamente.', fileUrl });
      } catch (err) {
        console.error('Error al procesar el archivo o actualizar la base de datos:', err);
        callback({ success: false, message: 'Error interno del servidor.' });
      }
    });
    
    

    socket.on('upload_avatar', async (data, callback) => {
      const { userId, fileName, fileContent } = data;

      if (!userId) {
        callback({ success: false, message: 'Usuario no autenticado' });
        return;
      }

      const uploadPath = path.join(uploadDir, fileName);

      // Save the file
      fs.writeFile(uploadPath, fileContent, 'base64', async (err) => {
        if (err) {
          console.error('Error al guardar el archivo:', err);
          callback({ success: false, message: 'Error al guardar el archivo' });
        } else {
          console.log('Archivo guardado en:', uploadPath);

          // Update the user's avatar in the database
          const avatarUrl = `/public/avatars/${fileName}`;
          await User.findByIdAndUpdate(userId, { avatar: avatarUrl });

          callback({ success: true, message: 'Avatar subido correctamente', avatarUrl });
          
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`Socket.IO corriendo en http://localhost:${PORT}`);
  });
};

startServer();
