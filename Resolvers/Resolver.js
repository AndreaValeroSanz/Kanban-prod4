import { pubsub, EVENTS } from "../pubsub.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Card from "../models/card.js";
import Project from "../models/project.js";

const SECRET_KEY = "gommit";

const resolvers = {
  Query: {
    // Fetch all cards for a user, optionally filtered by projectId
    getAllCards: async (_, { projectId }, { userId }) => {
      try {
        if (!userId) {
          throw new Error("No autorizado");
        }

        console.log("Project ID:", projectId);

        const query = { user_id: userId };
        if (projectId) {
          query.projects_id = projectId;
        }

        const cards = await Card.find(query);
        return cards;
      } catch (error) {
        console.error("Error fetching cards:", error);
        throw new Error("Error fetching cards");
      }
    },

    // Fetch all projects for a user
    projects: async (_, __, { userId }) => {
      try {
        if (!userId) {
          throw new Error("No autorizado");
        }

        const projects = await Project.find({ user_id: userId });
        return projects;
      } catch (error) {
        console.error("Error fetching projects:", error);
        throw new Error("Error fetching projects");
      }
    },
  },

  Mutation: {
    // Login mutation
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
        console.error("Error durante el login:", error);
        throw new Error("Error durante el login");
      }
    },

    // Create a new card
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
        console.error("Error creating card:", error);
        throw new Error("Error creating card");
      }
    },

    // Delete a card
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
          throw new Error("Tarjeta no encontrada o no autorizada para eliminar");
        }

        pubsub.publish(EVENTS.CARD.DELETED, { cardDeleted: deletedCard });
        return deletedCard;
      } catch (error) {
        console.error("Error deleting card:", error);
        throw new Error("Error deleting card");
      }
    },

    // Edit a card
    editCard: async (_, { id, title, description, duedate, color }, { userId }) => {
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

        pubsub.publish(EVENTS.CARD.UPDATED, { cardUpdated: updatedCard });
        return updatedCard;
      } catch (error) {
        console.error("Error editing card:", error);
        throw new Error("Error editing card");
      }
    },

    // Update card type
    updateCardType: async (_, { id, type }, { userId }) => {
      try {
        if (!userId) {
          throw new Error("No autorizado");
        }

        const card = await Card.findOne({ _id: id, user_id: userId });
        if (!card) {
          throw new Error("Tarjeta no encontrada o no autorizada");
        }

        card.type = type;
        const updatedCard = await card.save();
        return updatedCard;
      } catch (error) {
        console.error("Error updating card type:", error);
        throw new Error("Error updating card type");
      }
    },

    // Create a new project
    createProject: async (_, { title, userId }, { userId: contextUserId }) => {
      try {
        if (!contextUserId) {
          throw new Error("No autorizado");
        }

        // Asegurarse de que userId sea un array
        if (!Array.isArray(userId)) {
          throw new Error("El userId debe ser un array");
        }

        const newProject = new Project({
          title,
          user_id: userId,
        });

        const savedProject = await newProject.save();
        return savedProject;
      } catch (error) {
        console.error("Error al editar el proyecto:", error);
        throw new Error("Error al editar el proyecto");
      }
    },

    // Edit a project
    editProject: async (_, { id, title }, { userId }) => {
      try {
        if (!userId) {
          throw new Error("No autorizado");
        }

        const project = await Project.findOne({ _id: id, user_id: userId });
        if (!project) {
          throw new Error("Proyecto no encontrado o no autorizado");
        }

        project.title = title || project.title;
        const updatedProject = await project.save();
        return updatedProject;
      } catch (error) {
        console.error("Error al editar el proyecto:", error);
        throw new Error("Error al editar el proyecto");
      }
    },

    // Delete a project
    deleteProject: async (_, { id }, { userId }) => {
      try {
        if (!userId) {
          throw new Error("No autorizado");
        }

        const project = await Project.findOne({ _id: id, user_id: userId });
        if (!project) {
          throw new Error("Proyecto no encontrado");
        }

        await Card.deleteMany({ projects_id: id });
        const deletedProject = await Project.findByIdAndDelete(id);

        if (!deletedProject) {
          throw new Error("No se pudo eliminar el proyecto.");
        }

        return deletedProject;
      } catch (error) {
        console.error("Error deleting project:", error);
        throw new Error("Error deleting project");
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
