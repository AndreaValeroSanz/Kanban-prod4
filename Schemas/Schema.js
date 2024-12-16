import { gql } from 'apollo-server-express';
import { pubsub } from '../pubsub.js';

const typeDefs = gql`
  type Card {
    _id: ID!
    title: String!
    description: String!
    duedate: String!
    type: String
    color: String
    user_id: ID!
    projects_id: ID!
  }

  type editCard {
    _id: ID!
    title: String!
    description: String!
    duedate: String!
    color: String
  }

  type User {
    _id: ID!
    email: String!
    password: String!
    avatar: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    getAllCards(projectId: ID): [Card]
    projects: [Project!]!
  }

  type Project {
    _id: ID!
    user_id: ID!
    title: String!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!

    createCard(
      title: String!
      description: String!
      duedate: String!
      type: String
      color: String
      projects_id: ID!
    ): Card!
    
    deleteCard(id: ID!): Card!

    editCard(
      id: ID!
      title: String
      description: String
      duedate: String
      color: String
    ): Card!
    
    updateCardType(id: ID!, type: String!): Card!

    createProject(title: String!, userId: String!): Project!
    
    editProject(id: ID!, title: String!): Project!

    deleteProject(id: ID!): Project
  }

  type Subscription {
    cardUpdated: Card!
    cardCreated: Card!
    cardDeleted: Card!
  }
`;

export default typeDefs;
