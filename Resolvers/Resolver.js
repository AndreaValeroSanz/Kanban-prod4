import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import Card from '../models/card.js'; // Ensure you have the Card model
import Project from '../models/project.js';
import pubsub from '../config/pubsub.js';

const SECRET_KEY = "gommit";

const resolvers = {
  Query: {
    getAllCards: async (_, { projectId }, { userId }) => {
      try {
        if (!userId) {
          throw new Error('No autorizado');
        }

        let query = { user_id: userId };
        if (projectId) {
          query.projects_id = projectId;
        }

        const cards = await Card.find(query);
        return cards;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    projects: async (_, __, { userId }) => {
      try {
        if (!userId) {
          throw new Error("No autorizado");
        }
        const projects = await Project.find({ user_id: userId });
        return projects;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },
  Mutation: {
    login: async (_, { email, password }) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          throw new Error('Contraseña incorrecta');
        }

        const token = jwt.sign(
          { userId: user._id, email: user.email },
          SECRET_KEY,
          { expiresIn: '3h' }
        );

        return { userId: user._id, token, user };
      } catch (error) {
        throw new Error(error.message);
      }
    },
    createCard: async (_, { title, description, duedate, type, color, projects_id }, { userId }) => {
      try {
        if (!userId) {
          throw new Error('No autorizado');
        }

        const defaultProjectId = "67224b9d9040a876aa6e7013";
        const projectIdToUse = projects_id || defaultProjectId;

        const newCard = new Card({
          title,
          description,
          duedate,
          type,
          color,
          user_id: userId,
          projects_id: projectIdToUse,
        });

        const savedCard = await newCard.save();

        pubsub.publish(`CARD_UPDATED_${projectIdToUse}`, { cardUpdated: savedCard });

        return savedCard;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    deleteCard: async (_, { id }, { userId }) => {
      try {
        if (!userId) {
          throw new Error('No autorizado');
        }

        const deletedCard = await Card.findOneAndDelete({ _id: id, user_id: userId });
        if (!deletedCard) {
          throw new Error('Tarjeta no encontrada o no autorizada para eliminar');
        }

        return deletedCard;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    editCard: async (_, { id, title, description, duedate, color }, { userId }) => {
      try {
        if (!userId) {
          throw new Error('No autorizado');
        }

        const updatedCard = await Card.findByIdAndUpdate(
          id,
          {
            ...(title && { title }),
            ...(description && { description }),
            ...(duedate && { duedate }),
            ...(color && { color }),
          },
          { new: true }
        );

        if (!updatedCard) {
          throw new Error('Tarjeta no encontrada');
        }

        pubsub.publish(`CARD_UPDATED_${updatedCard.projects_id}`, { cardUpdated: updatedCard });

        return updatedCard;
      } catch (error) {
        throw new Error(`Error al editar la tarjeta: ${error.message}`);
      }
    },
    updateCardType: async (_, { id, type }, { userId }) => {
      try {
        if (!userId) {
          throw new Error('No autorizado');
        }

        const card = await Card.findOne({ _id: id, user_id: userId });
        if (!card) {
          throw new Error('Tarjeta no encontrada o no autorizada');
        }

        card.type = type;
        const updatedCard = await card.save();

        return updatedCard;
      } catch (error) {
        throw new Error(`Error al actualizar el tipo de tarjeta: ${error.message}`);
      }
    },
    createProject: async (_, { title }, { userId }) => {
      try {
        if (!userId) {
          throw new Error('No autorizado');
        }

        const newProject = new Project({ title, user_id: userId });
        const savedProject = await newProject.save();
        return savedProject;
      } catch (error) {
        throw new Error("No se pudo crear el proyecto.");
      }
    },
    editProject: async (_, { id, title }, { userId }) => {
      try {
        if (!userId) {
          throw new Error('No autorizado');
        }

        const project = await Project.findOne({ _id: id, user_id: userId });
        if (!project) {
          throw new Error('Proyecto no encontrado o no autorizado');
        }

        project.title = title || project.title;
        const updatedProject = await project.save();
        return updatedProject;
      } catch (error) {
        throw new Error(`Error al editar el proyecto: ${error.message}`);
      }
    },
    deleteProject: async (_, { id }) => {
      try {
        const project = await Project.findById(id);
        if (!project) {
          throw new Error("Proyecto no encontrado");
        }

        await Card.deleteMany({ projects_id: id });
        const deletedProject = await Project.findByIdAndDelete(id);

        return deletedProject;
      } catch (error) {
        throw new Error("No se pudo eliminar el proyecto.");
      }
    },
  },
  Subscription: {
    cardUpdated: {
      subscribe: (_, { projects_id }) => pubsub.asyncIterator(`CARD_UPDATED_${projects_id}`),
    },
  },
};

export default resolvers;
