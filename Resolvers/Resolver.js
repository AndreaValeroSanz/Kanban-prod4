import {pubsub, EVENTS} from "../pubsub.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Card from "../models/card.js"; // Ensure you have the Card model
import Project from "../models/project.js";


const SECRET_KEY = "gommit";

const resolvers = {
  Query: {
    getAllCards: async (_, { projectId }, { userId }) => {
      try {
        // Verificar si el usuario está autenticado
        if (!userId) {
          throw new Error("No autorizado");
        }
        console.log("Project ID:", projectId);

        // Si no se pasa un projectId, devolver todas las tarjetas del usuario
        let query = { user_id: userId };

        // Si se pasa un projectId, agregar el filtro para projectId
        if (projectId) {
          query.projects_id = projectId;
        }

        // Buscar las tarjetas que coincidan con los filtros
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
          throw new Error("Usuario no encontrado");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          throw new Error("Contraseña incorrecta");
        }

        const token = jwt.sign(
          { userId: user._id, email: user.email },
          SECRET_KEY,
          { expiresIn: "3h" }
        );

        return {
          userId: user._id,
          token,
          user,
        };
      } catch (error) {
        throw new Error(error.message);
      }
    },
    createCard: async (
      _,
      { title, description, duedate, type, color, projects_id },
      { userId }
    ) => {
      try {
        if (!userId) {
          throw new Error("No autorizado");
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
        pubsub.publish(EVENTS.CARD.CREATED, { cardCreated: savedCard });
        return savedCard;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    deleteCard: async (_, { id }, { userId }) => {
      try {
        if (!userId) {
          throw new Error("No autorizado");
        }

        const deletedCard = await Card.findOneAndDelete({
          _id: id,
          user_id: userId,
        });
        if (!deletedCard) {
          throw new Error(
            "Tarjeta no encontrada o no autorizada para eliminar"
          );
        }
        pubsub.publish(EVENTS.CARD.DELETED, { cardDeleted: deletedCard });
        return deletedCard;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    editCard: async (
      _,
      { id, title, description, duedate, color },
      { userId }
    ) => {
      try {
        if (!userId) {
          throw new Error("No autorizado");
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
          throw new Error("Tarjeta no encontrada");
        }
        pubsub.publish("CARD_UPDATED", { cardUpdated: updatedCard });

        return updatedCard;
      } catch (error) {
        throw new Error(`Error al editar la tarjeta: ${error.message}`);
      }
    },
  },
  Subscription: {
    cardUpdated: {
      subscribe: () => pubsub.asyncIterator(["CARD_UPDATED"]),
    },

    updateCardType: async (_, { id, type }, { userId }) => {
      try {
        if (!userId) {
          throw new Error("No autorizado");
        }

        // Find the card and make sure it belongs to the current user
        const card = await Card.findOne({ _id: id, user_id: userId });
        if (!card) {
          throw new Error("Tarjeta no encontrada o no autorizada");
        }

        // Update the type
        card.type = type;
        const updatedCard = await card.save();

        return updatedCard;
      } catch (error) {
        throw new Error(
          `Error al actualizar el tipo de tarjeta: ${error.message}`
        );
      }
    },

    createProject: async (_, { title, userId }) => {
      try {
        // Crear un nuevo proyecto con los datos recibidos
        const newProject = new Project({
          title,
          user_id: userId, // Vincular con el ID del usuario
        });

        // Guardar el proyecto en la base de datos
        const savedProject = await newProject.save();
        return savedProject;
      } catch (error) {
        console.error("Error al crear el proyecto:", error);
        throw new Error("No se pudo crear el proyecto.");
      }
    },
    editProject: async (_, { id, title }, { userId }) => {
      try {
        if (!userId) {
          throw new Error("No autorizado");
        }

        // Buscar el proyecto con el ID proporcionado
        const project = await Project.findOne({ _id: id, user_id: userId });

        if (!project) {
          throw new Error("Proyecto no encontrado o no autorizado");
        }

        // Actualizar el título del proyecto
        project.title = title || project.title; // Si no se pasa título, mantén el actual

        // Guardar el proyecto actualizado
        const updatedProject = await project.save();

        return updatedProject;
      } catch (error) {
        throw new Error(`Error al editar el proyecto: ${error.message}`);
      }
    },

    deleteProject: async (_, { id }) => {
      try {
        // Verificar si el proyecto existe antes de eliminarlo
        const project = await Project.findById(id);
        if (!project) {
          throw new Error("Proyecto no encontrado");
        }

        // Eliminar todas las cards asociadas al proyecto
        await Card.deleteMany({ projects_id: id });

        // Eliminar el proyecto
        const deletedProject = await Project.findByIdAndDelete(id);

        if (!deletedProject) {
          throw new Error("No se pudo eliminar el proyecto.");
        }

        console.log(`Proyecto eliminado: ${deletedProject.title}`);
        return deletedProject; // Asegúrate de devolver el proyecto eliminado
      } catch (error) {
        console.error("Error al eliminar el proyecto:", error);
        throw new Error("No se pudo eliminar el proyecto.");
      }
    },
  },
  Subscription: {
    cardUpdated: {
      subscribe: () => pubsub.asyncIterator([EVENTS.CARD.UPDATED]),
    },
    cardCreated: {
      subscribe: () => pubsub.asyncIterator([EVENTS.CARD.CREATED]),
    },
    cardDeleted: {
      subscribe: () => pubsub.asyncIterator([EVENTS.CARD.DELETED]),
    },
  },
};

export default resolvers;
