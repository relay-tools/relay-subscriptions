/* eslint-disable no-console */

import Relay from 'react-relay/classic';
import { SubscriptionClient } from 'subscriptions-transport-ws';

export default class NetworkLayer extends Relay.DefaultNetworkLayer {
  constructor(...args) {
    super(...args);

    this._subscriptionClient = new SubscriptionClient(
      `ws://${global.location.host}/graphql`,
      { reconnect: true },
    );
  }

  sendSubscription(request) {
    const { unsubscribe } = this._subscriptionClient.request({
      query: request.getQueryString(),
      variables: request.getVariables(),
    }).subscribe({
      next: ({ errors, data }) => {
        if (errors) {
          request.onError(errors);
        } else {
          request.onNext(data);
        }
      },
      error: request.onError,
      complete: request.onCompleted,
    });

    return { dispose: unsubscribe };
  }

  disconnect() {
    this._subscriptionClient.close();
  }
}
