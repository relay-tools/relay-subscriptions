import RelayQuery from 'react-relay/lib/RelayQuery';
export { default as Subscription } from './Subscription';
export { default as SubscriptionRequest } from './SubscriptionRequest';
export { default as updateStoreData } from './updateStoreData';
export function createQuerySubscription(
  concreteNode: RelayConcreteNode,
  variables: Variables): RelayQuery.Subscription {
  return RelayQuery.Subscription.create(concreteNode, {}, variables);
}

export { default as SubscriptionProvider } from './SubscriptionProvider';
export { default as createSubscriptionContainer } from './SubscriptionContainer';
