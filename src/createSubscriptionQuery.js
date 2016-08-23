/* @flow */

import RelayMetaRoute from 'react-relay/lib/RelayMetaRoute';
import RelayQuery from 'react-relay/lib/RelayQuery';

import type { RelayConcreteNode, Variables } from './types';

export default function createSubscriptionQuery(
  concreteNode: RelayConcreteNode,
  variables: Variables
): RelayQuery.Subscription {
  return RelayQuery.Subscription.create(
    concreteNode,
    RelayMetaRoute.get('$createSubscriptionQuery'),
    variables
  );
}
