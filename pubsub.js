import { PubSub } from 'graphql-subscriptions';

// Create a PubSub instance
const pubsub = new PubSub();

// Event names (constants for better management)
const EVENTS = {
  CARD: {
    UPDATED: 'CARD_UPDATED',
    CREATED: 'CARD_CREATED',
    DELETED: 'CARD_DELETED',
  },
};

export { pubsub, EVENTS };
