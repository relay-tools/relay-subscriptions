/* @flow */

import invariant from 'invariant';
import Relay from 'react-relay/classic';
import RelayNetworkLayer from 'react-relay/lib/RelayNetworkLayer';
import RelayStoreData from 'react-relay/lib/RelayStoreData';

import createSubscriptionQuery from './createSubscriptionQuery';
import type Subscription from './Subscription';
import SubscriptionRequest from './SubscriptionRequest';
import type { SubscriptionDisposable, SubscriptionObserver } from './types';
import updateStoreData from './updateStoreData';

// Override a few Relay classes to use our own network layer proxy that
// supports sendSubscription.

class NetworkLayer extends RelayNetworkLayer {
  sendSubscription(
    subscriptionRequest: SubscriptionRequest,
  ): SubscriptionDisposable {
    const implementation = this._getImplementation();
    invariant(
      implementation.sendSubscription,
      'NetworkLayer: Network layer implementation does not support ' +
      'subscriptions.',
    );

    return implementation.sendSubscription(subscriptionRequest);
  }
}

class StoreData extends RelayStoreData {
  _networkLayer: NetworkLayer;

  constructor(...args) {
    super(...args);

    this._networkLayer = new NetworkLayer();
  }
}

export default class Environment extends Relay.Environment {
  subscribe: (
    subscription: Subscription<any>,
    observer?: SubscriptionObserver,
  ) => SubscriptionDisposable;

  constructor(storeData?: StoreData) {
    super(storeData || new StoreData());

    this.subscribe = this.subscribe.bind(this);

    this._nextClientSubscriptionId = 0;
  }

  subscribe(
    subscription: Subscription<any>,
    observer?: SubscriptionObserver,
  ): SubscriptionDisposable {
    const clientSubscriptionId = this._nextClientSubscriptionId.toString(36);
    ++this._nextClientSubscriptionId;

    subscription.bindEnvironment(this);

    const query = createSubscriptionQuery(subscription.getSubscription(), {
      input: {
        ...subscription.getVariables(),
        clientSubscriptionId,
      },
    });

    const onPayload = (payload) => {
      updateStoreData(this, subscription.getConfigs(), query, payload);
    };

    let requestObserver;
    if (observer) {
      const definedObserver = observer; // Placate Flow.
      requestObserver = {
        onNext: (payload) => {
          onPayload(payload);
          if (definedObserver.onNext) {
            definedObserver.onNext(payload);
          }
        },
        onError: (error) => {
          if (definedObserver.onError) {
            definedObserver.onError(error);
          }
        },
        onCompleted: (value) => {
          if (definedObserver.onCompleted) {
            definedObserver.onCompleted(value);
          }
        },
      };
    } else {
      requestObserver = {
        onNext: onPayload,
        onError: () => {},
        onCompleted: () => {},
      };
    }

    return this._storeData.getNetworkLayer().sendSubscription(
      new SubscriptionRequest(query, requestObserver),
    );
  }
}
