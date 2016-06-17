import { PropTypes, Component } from 'react';
import * as RelaySubscriptions from './';

export default class SubscriptionProvider extends Component {
  static childContextTypes = {
    subscriptions: PropTypes.object.isRequired,
  };
  static contextTypes = {
    relay: PropTypes.object.isRequired,
  };
  static propTypes = {
    subscribe: PropTypes.func.isRequired,
  }
  getChildContext() {
    return { subscriptions: { subscribe: this._subscribe.bind(this) } };
  }
  _subscriptions = {};
  componentDidMount() {

  }
  componentWillUnmount() {

  }
  _subscribe(subscription, ...args) {
    const clientMutationId = Math.random().toString(36).substr(0, 9);
    let observable = args[args.length - 1];
    if (observable !== null || observable !== undefined && typeof observable !== 'object') {
      observable = {};
    }
    subscription.bindEnvironment(this.context.relay);
    const input = {
      ...subscription.getVariables(),
      clientMutationId,
    };
    const query = RelaySubscriptions.createQuerySubscription(
      subscription.getSubscription(),
      { input }
    );
    const subscriptionRequest = new RelaySubscriptions.SubscriptionRequest(query);
    subscriptionRequest.subscribe({
      onNext: payload => {
        this.updateStoreData(query, payload, subscription.getConfigs.call(subscription));
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
  }
  updateStoreData(query, payload, configs) {
    const storeData = this.context.relay.getStoreData();
    const callName = query.getCall().name;
    storeData.handleUpdatePayload(query, payload[callName], { configs });
  }
  render() {
    return this.props.children;
  }
}
