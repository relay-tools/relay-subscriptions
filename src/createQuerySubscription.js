/* @flow */
import RelayQuery from 'react-relay/lib/RelayQuery';
import RelayMetaRoute from 'react-relay/lib/RelayMetaRoute';
import type { Variables, RelayConcreteNode } from './types';

export default function createQuerySubscription(
  concreteNode: RelayConcreteNode,
  variables: Variables): RelayQuery.Subscription {
  return RelayQuery.Subscription.create(
    concreteNode,
    RelayMetaRoute.get('$createQuerySubscription'),
    variables
  );
}
