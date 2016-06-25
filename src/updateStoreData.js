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
  payload: SubscriptionResult) {
  const storeData = environment.getStoreData();
  const payloadName = query.getCall().name;
  storeData.handleUpdatePayload(
    query,
    payload[payloadName],
    { configs }
  );
}
