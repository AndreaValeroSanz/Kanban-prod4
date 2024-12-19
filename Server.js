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
  // Create GraphQL schema
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // Configure ApolloServer
  const server = new ApolloServer({
    schema,
    context: ({ req }) => {
      try {
        auth(req, null, () => {}); // Verify authentication
        return { userId: req.userId, pubsub }; // Provide userId and pubsub in context
      } catch (err) {
        console.error('Authentication error:', err.message);
        throw new Error('Unauthorized');
      }
    },
  });

  await server.start();
  server.applyMiddleware({ app });

  // Configure WebSocketServer for subscriptions on port 4200
  const wsServer = new WebSocketServer({
    port: 4200, // Separate port for WebSocket
    path: '/graphql',
  });

  useServer({ schema, context: () => ({ pubsub }) }, wsServer);

  console.log('Subscriptions available at ws://localhost:4200/graphql');

  // Connect to the database
  connectDB();

  // Configure static file handling
  const uploadDir = path.join(__dirname, 'front', 'dist', 'public', 'avatars');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  app.use(cors());
  app.use(express.json({ limit: '2gb' }));
  app.use(express.urlencoded({ limit: '2gb', extended: true }));
  app.use('/avatars', express.static(uploadDir));

  // Configure Socket.IO for tasks and avatars on HTTP server
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('upload_task_file', async (data, callback) => {
      const { cardId, fileName, fileContent } = data;

      if (!cardId) {
        callback({ success: false, message: 'Task ID not provided.' });
        return;
      }

      const taskUploadDir = path.join(__dirname, 'uploads', 'tasks');
      if (!fs.existsSync(taskUploadDir)) {
        fs.mkdirSync(taskUploadDir, { recursive: true });
      }

      const filePath = path.join(taskUploadDir, `${cardId}_${fileName}`);
      console.log('Saving file to:', filePath);

      try {
        await fs.promises.writeFile(filePath, fileContent, 'base64');
        console.log('File saved:', filePath);

        const fileUrl = `/uploads/tasks/${cardId}_${fileName}`;
        const result = await Card.findOneAndUpdate(
          { _id: cardId },
          { $push: { files: fileUrl } },
          { new: true }
        );

        if (!result) {
          callback({ success: false, message: 'Task not found.' });
          return;
        }

        callback({ success: true, message: 'File uploaded successfully.', fileUrl });
      } catch (err) {
        console.error('Error processing file:', err);
        callback({ success: false, message: 'Internal server error.' });
      }
    });

    socket.on('upload_avatar', async (data, callback) => {
      const { userId, fileName, fileContent } = data;

      if (!userId) {
        callback({ success: false, message: 'User not authenticated.' });
        return;
      }

      const avatarPath = path.join(uploadDir, fileName);

      try {
        await fs.promises.writeFile(avatarPath, fileContent, 'base64');
        console.log('Avatar saved to:', avatarPath);

        const avatarUrl = `/avatars/${fileName}`;
        await User.findByIdAndUpdate(userId, { avatar: avatarUrl });

        callback({ success: true, message: 'Avatar uploaded successfully.', avatarUrl });
      } catch (err) {
        console.error('Error saving avatar:', err);
        callback({ success: false, message: 'Internal server error.' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Start HTTP server
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`Socket.IO running at http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Error starting server:', err);
});
