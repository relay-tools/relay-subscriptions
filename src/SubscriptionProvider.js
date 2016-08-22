import invariant from 'invariant';
import { PropTypes, Component } from 'react';

import createQuerySubscription from './createQuerySubscription';
import SubscriptionRequest from './SubscriptionRequest';
import updateStoreData from './updateStoreData';

export default class SubscriptionProvider extends Component {
  static propTypes = {
    subscribe: PropTypes.func.isRequired,
    environment: PropTypes.object,
    children: PropTypes.element.isRequired,
  };

  static contextTypes = {
    relay: PropTypes.object,
  };

  static childContextTypes = {
    subscriptions: PropTypes.object.isRequired,
  };

  getChildContext() {
    return {
      subscriptions: {
        subscribe: this._subscribe,
      },
    };
  }

  getEnvironment() {
    const environment = this.props.environment || this.context.relay;
    if (process.env.NODE_ENV !== 'production') {
      invariant(
        environment,
        'SubscriptionProvider: RelayEnvironment could not be found. Please render ' +
        'the SubscriptionProvider under a RelayRenderer or provide the `environment` prop'
      );
    }

    return environment;
  }

  _nextId = 0;

  _subscribe = (subscription, ...args) => {
    let observable = args[args.length - 1];
    if (observable !== null || observable !== undefined && typeof observable !== 'object') {
      observable = {};
    }

    const clientSubscriptionId = this._nextId.toString(36);
    ++this._nextId;

    const environment = this.getEnvironment();
    subscription.bindEnvironment(environment);

    const input = {
      ...subscription.getVariables(),
      clientSubscriptionId,
    };

    const query = createQuerySubscription(
      subscription.getSubscription(),
      { input }
    );

    const subscriptionRequest = new SubscriptionRequest(query);
    subscriptionRequest.subscribe({
      onNext: payload => {
        updateStoreData(environment, subscription.getConfigs(), query, payload);
        if (observable.onNext) observable.onNext(payload);
      },
      onError: error => {
        if (observable.onError) observable.onError(error);
      },
      onCompleted: () => {
        if (observable.onCompleted) observable.onCompleted();
      },
    });

    this.props.subscribe(subscriptionRequest, ...args);

    return {
      dispose: () => {
        subscriptionRequest.dispose();
      },
    };
  };

  render() {
    return this.props.children;
  }
}
