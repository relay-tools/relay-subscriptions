/* @flow */

import invariant from 'invariant';
import Relay from 'react-relay';
import RelayNetworkLayer from 'react-relay/lib/RelayNetworkLayer';
import RelayStoreData from 'react-relay/lib/RelayStoreData';

import createSubscriptionQuery from './createSubscriptionQuery';
import type Subscription from './Subscription';
import SubscriptionRequest from './SubscriptionRequest';
import type {
  SubscriptionDisposable,
  SubscriptionObservable,
  SubscriptionObserver,
} from './types';
import updateStoreData from './updateStoreData';

// Override a few Relay classes to use our own network layer proxy that
// supports sendSubscription.

class NetworkLayer extends RelayNetworkLayer {
  sendSubscription(
    subscriptionRequest: SubscriptionRequest,
  ): SubscriptionObservable {
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

    const networkLayer = this._storeData.getNetworkLayer();
    const subscriptionObservable = networkLayer.sendSubscription(
      new SubscriptionRequest(query),
    );

    return subscriptionObservable.subscribe({
      onNext: (payload) => {
        updateStoreData(this, subscription.getConfigs(), query, payload);
        if (observer && observer.onNext) {
          observer.onNext(payload);
        }
      },
      onError: (error) => {
        if (observer && observer.onError) {
          observer.onError(error);
        }
      },
      onCompleted: () => {
        if (observer && observer.onCompleted) {
          observer.onCompleted();
        }
      },
    });
  }
}
