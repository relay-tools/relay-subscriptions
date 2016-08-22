/* @flow */
import type {
  MutationConfig,
  RelayEnvironment,
  SubscriptionResult,
} from './types';
import RelayQuery from 'react-relay/lib/RelayQuery';

export default function updateStoreData(
  environment: RelayEnvironment,
  configs: Array<MutationConfig>,
  query: RelayQuery.Operation,
  payload: SubscriptionResult
) {
  const storeData = environment.getStoreData();
  const payloadName = query.getCall().name;

  // FIXME: Applying a RANGE_ADD update requires a clientMutationId. This is a
  // nonce that won't collide with any actual mutation IDs.
  const clientMutationId = Math.random().toString(36);

  storeData.handleUpdatePayload(
    query,
    { ...payload[payloadName], clientMutationId },
    { configs }
  );
}
