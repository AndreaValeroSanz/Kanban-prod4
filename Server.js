import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import typeDefs from './Schemas/Schema.js';
import resolvers from './Resolvers/Resolver.js';
import { connectDB } from './config/db.js';
import { auth } from './auth.js';
import cors from 'cors';
import { Server } from 'socket.io';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import User from './models/user.js';
import Card from './models/card.js';
import { pubsub } from './pubsub.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const startServer = async () => {
  // Crear el esquema GraphQL
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // Configurar ApolloServer
  const server = new ApolloServer({
    schema,
    context: ({ req }) => {
      try {
        auth(req, null, () => {}); // Verificar autenticación
        return { userId: req.userId, pubsub }; // Contexto con userId y pubsub
      } catch (err) {
        console.error('Error de autenticación:', err.message);
        throw new Error('No autorizado');
      }
    },
  });

  await server.start();
  server.applyMiddleware({ app });

  // Configurar WebSocketServer para suscripciones
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  useServer({ schema, context: () => ({ pubsub }) }, wsServer);

  // Conexión a la base de datos
  connectDB();

  // Configurar archivos estáticos
  const uploadDir = path.join(__dirname, 'front', 'dist', 'public', 'avatars');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  app.use(cors());
  app.use(express.json({ limit: '2gb' }));
  app.use(express.urlencoded({ limit: '2gb', extended: true }));
  app.use('/avatars', express.static(uploadDir));

  // Configurar Socket.IO para manejar tareas y avatares
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('upload_task_file', async (data, callback) => {
      const { cardId, fileName, fileContent } = data;

      if (!cardId) {
        callback({ success: false, message: 'ID de tarea no proporcionado.' });
        return;
      }

      const taskUploadDir = path.join(__dirname, 'uploads', 'tasks');
      if (!fs.existsSync(taskUploadDir)) {
        fs.mkdirSync(taskUploadDir, { recursive: true });
      }

      const filePath = path.join(taskUploadDir, `${cardId}_${fileName}`);
      console.log('Guardando archivo en:', filePath);

      try {
        await fs.promises.writeFile(filePath, fileContent, 'base64');
        console.log('Archivo guardado:', filePath);

        const fileUrl = `/uploads/tasks/${cardId}_${fileName}`;
        const result = await Card.findOneAndUpdate(
          { _id: cardId },
          { $push: { files: fileUrl } },
          { new: true }
        );

        if (!result) {
          callback({ success: false, message: 'Tarea no encontrada.' });
          return;
        }

        callback({ success: true, message: 'Archivo subido correctamente.', fileUrl });
      } catch (err) {
        console.error('Error al procesar el archivo:', err);
        callback({ success: false, message: 'Error interno del servidor.' });
      }
    });

    socket.on('upload_avatar', async (data, callback) => {
      const { userId, fileName, fileContent } = data;

      if (!userId) {
        callback({ success: false, message: 'Usuario no autenticado' });
        return;
      }

      const avatarPath = path.join(uploadDir, fileName);

      try {
        await fs.promises.writeFile(avatarPath, fileContent, 'base64');
        console.log('Avatar guardado en:', avatarPath);

        const avatarUrl = `/avatars/${fileName}`;
        await User.findByIdAndUpdate(userId, { avatar: avatarUrl });

        callback({ success: true, message: 'Avatar subido correctamente', avatarUrl });
      } catch (err) {
        console.error('Error al guardar el avatar:', err);
        callback({ success: false, message: 'Error interno del servidor.' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });

  // Iniciar servidor
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`Socket.IO corriendo en http://localhost:${PORT}`);
    console.log(`Suscripciones disponibles en ws://localhost:${PORT}/graphql`);
  });
};

startServer().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
});
